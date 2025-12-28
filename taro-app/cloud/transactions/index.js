const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 权限校验函数（使用数据库验证）
async function checkPermission(event) {
    if (event.body) {
        return { allowed: true }
    }
    
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    if (!openid) {
        return { allowed: false, error: '无法获取用户身份' }
    }

    const userRes = await db.collection('jewelry_users').where({
        openid,
        status: 'active'
    }).get()

    if (userRes.data.length === 0) {
        return { allowed: false, openid, error: '未授权访问，请先登录' }
    }
    
    return { allowed: true, openid, user: userRes.data[0] }
}

exports.main = async (event, context) => {
    // 权限校验
    const permission = await checkPermission(event)
    if (!permission.allowed) {
        return { success: false, error: permission.error }
    }

    // 兼容 HTTP 触发和普通云函数调用
    let action, data
    if (event.body) {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body
        action = body.action
        data = body.data
    } else {
        action = event.action
        data = event.data
    }

    const transCollection = db.collection('jewelry_transactions')
    const invCollection = db.collection('jewelry_inventory')

    try {
        let result
        switch (action) {
            case 'list': { // 获取交易记录列表
                const { type, itemId, startDate, endDate, limit = 50 } = data || {}
                let query = {}
                if (type) query.type = type
                if (itemId) query.itemId = itemId
                if (startDate && endDate) {
                    query.date = _.gte(startDate).and(_.lte(endDate))
                }

                const res = await transCollection.where(query).orderBy('date', 'desc').limit(limit).get()
                result = { success: true, data: res.data }
                break
            }

            case 'add': { // 新增交易记录（同时更新库存）
                const { itemId, type, quantity, method, linkedTransactionId, ...rest } = data
                const now = new Date().toISOString()

                // 基础校验
                if (!itemId || !type || !quantity || quantity <= 0) {
                    result = { success: false, error: '参数不完整或数量无效' }
                    break
                }

                // 校验商品是否存在
                let inventoryItem
                try {
                    const invRes = await invCollection.doc(itemId).get()
                    inventoryItem = invRes.data
                } catch (e) {
                    result = { success: false, error: '商品不存在' }
                    break
                }

                // 出库时校验库存是否充足
                if (type === 'outbound') {
                    if (inventoryItem.quantity < quantity) {
                        result = { 
                            success: false, 
                            error: `库存不足，当前库存 ${inventoryItem.quantity} 件，无法出库 ${quantity} 件` 
                        }
                        break
                    }
                }

                // 退货校验逻辑
                if (type === 'inbound' && method === '退货' && linkedTransactionId) {
                    // 1. 验证关联的出库记录是否存在
                    const linkedRecord = await transCollection.doc(linkedTransactionId).get()
                    if (!linkedRecord.data) {
                        result = { success: false, error: '关联的出库记录不存在' }
                        break
                    }
                    if (linkedRecord.data.type !== 'outbound') {
                        result = { success: false, error: '只能关联出库记录' }
                        break
                    }

                    // 2. 检查已退货数量，防止超退
                    const existingReturns = await transCollection.where({
                        linkedTransactionId: linkedTransactionId,
                        type: 'inbound',
                        method: '退货'
                    }).get()
                    const totalReturned = existingReturns.data.reduce((sum, r) => sum + r.quantity, 0)
                    const originalQty = linkedRecord.data.quantity

                    if (totalReturned + quantity > originalQty) {
                        result = { 
                            success: false, 
                            error: `退货数量超出限制，原出库${originalQty}件，已退${totalReturned}件，最多还可退${originalQty - totalReturned}件` 
                        }
                        break
                    }
                }

                // 使用事务确保数据一致性
                const transaction = await db.startTransaction()
                try {
                    // 1. 添加交易记录
                    const record = {
                        itemId,
                        type,
                        quantity,
                        method,
                        linkedTransactionId: linkedTransactionId || null,
                        date: now,
                        ...rest
                    }
                    const transResult = await transaction.collection('jewelry_transactions').add({ data: record })

                    // 2. 更新库存数量
                    const delta = type === 'inbound' ? quantity : -quantity
                    await transaction.collection('jewelry_inventory').doc(itemId).update({
                        data: {
                            quantity: _.inc(delta),
                            updatedAt: now
                        }
                    })

                    await transaction.commit()
                    result = { success: true, data: { _id: transResult._id, ...record } }
                } catch (e) {
                    await transaction.rollback()
                    throw e
                }
                break
            }

            case 'getByItem': { // 获取某商品的交易历史
                const { itemId } = data
                const res = await transCollection.where({ itemId }).orderBy('date', 'desc').get()
                result = { success: true, data: res.data }
                break
            }

            case 'stats': { // 获取销售统计
                const { startDate, endDate } = data || {}
                let dateQuery = {}
                if (startDate && endDate) {
                    dateQuery.date = _.gte(startDate).and(_.lte(endDate))
                }

                // 获取出库记录（销售）
                const outboundRes = await transCollection.where({ 
                    type: 'outbound',
                    ...dateQuery 
                }).get()
                
                // 获取退货记录（需要从销售额中扣除）
                const returnRes = await transCollection.where({ 
                    type: 'inbound', 
                    method: '退货',
                    ...dateQuery 
                }).get()

                const salesByCurrency = { CNY: 0, SGD: 0, TWD: 0 }
                
                // 累加出库销售额
                outboundRes.data.forEach(rec => {
                    if (rec.finalAmount && rec.currency) {
                        salesByCurrency[rec.currency] = (salesByCurrency[rec.currency] || 0) + rec.finalAmount
                    }
                })
                
                // 扣除退货金额（退货时如果有关联出库记录，使用关联记录的金额）
                returnRes.data.forEach(rec => {
                    if (rec.finalAmount && rec.currency) {
                        salesByCurrency[rec.currency] = (salesByCurrency[rec.currency] || 0) - rec.finalAmount
                    }
                })

                result = { 
                    success: true, 
                    data: { 
                        salesByCurrency, 
                        totalRecords: outboundRes.data.length,
                        returnRecords: returnRes.data.length
                    } 
                }
                break
            }

            default:
                result = { success: false, error: `Unknown action: ${action}` }
        }

        // HTTP 触发返回格式
        if (event.body) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify(result)
            }
        }
        return result
    } catch (error) {
        const errResult = { success: false, error: error.message }
        if (event.body) {
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(errResult)
            }
        }
        return errResult
    }
}
