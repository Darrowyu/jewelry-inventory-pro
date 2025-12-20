const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
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
                const { itemId, type, quantity, ...rest } = data
                const now = new Date().toISOString()

                // 使用事务确保数据一致性
                const transaction = await db.startTransaction()
                try {
                    // 1. 添加交易记录
                    const record = {
                        itemId,
                        type,
                        quantity,
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
                let query = { type: 'outbound' }
                if (startDate && endDate) {
                    query.date = _.gte(startDate).and(_.lte(endDate))
                }

                const res = await transCollection.where(query).get()
                const salesByCurrency = { CNY: 0, SGD: 0, TWD: 0 }
                res.data.forEach(rec => {
                    if (rec.finalAmount && rec.currency) {
                        salesByCurrency[rec.currency] = (salesByCurrency[rec.currency] || 0) + rec.finalAmount
                    }
                })
                result = { success: true, data: { salesByCurrency, totalRecords: res.data.length } }
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
