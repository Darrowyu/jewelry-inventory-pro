const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 权限校验函数（使用数据库验证）
async function checkPermission(event) {
    // Web 端调用（通过 Vercel API）跳过 openid 校验
    if (event._fromWeb || event.body) {
        return { allowed: true }
    }
    
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    if (!openid) {
        return { allowed: false, error: '无法获取用户身份' }
    }

    // 查询数据库验证用户
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
        // HTTP 触发方式：请求体在 event.body 中
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body
        action = body.action
        data = body.data
    } else {
        // 普通云函数调用方式
        action = event.action
        data = event.data
    }

    const collection = db.collection('jewelry_inventory')

    try {
        let result
        switch (action) {
            case 'list': { // 获取库存列表
                const { keyword, category, warehouse } = data || {}
                let query = {}
                if (keyword) {
                    query = _.or([
                        { modelNumber: db.RegExp({ regexp: keyword, options: 'i' }) },
                        { specification: db.RegExp({ regexp: keyword, options: 'i' }) }
                    ])
                }
                if (category) query.category = category
                if (warehouse) query.warehouse = warehouse

                const res = await collection.where(query).orderBy('updatedAt', 'desc').get()
                result = { success: true, data: res.data }
                break
            }

            case 'get': { // 获取单个商品
                const { id } = data
                const res = await collection.doc(id).get()
                result = { success: true, data: res.data }
                break
            }

            case 'add': { // 新增商品
                const now = new Date().toISOString()
                const item = {
                    ...data,
                    createdAt: now,
                    updatedAt: now
                }
                const res = await collection.add({ data: item })
                result = { success: true, data: { _id: res._id, ...item } }
                break
            }

            case 'update': { // 更新商品
                const { id, ...updateData } = data
                const now = new Date().toISOString()
                updateData.updatedAt = now

                // 检测价格变动并记录日志
                if (updateData.onlinePrice !== undefined || updateData.offlinePrice !== undefined) {
                    const oldItem = await collection.doc(id).get()
                    const oldData = oldItem.data
                    const priceLogs = oldData.priceLogs || []

                    if (updateData.onlinePrice !== undefined && updateData.onlinePrice !== oldData.onlinePrice) {
                        priceLogs.push({
                            date: now,
                            type: 'online',
                            oldPrice: oldData.onlinePrice || 0,
                            newPrice: updateData.onlinePrice
                        })
                    }
                    if (updateData.offlinePrice !== undefined && updateData.offlinePrice !== oldData.offlinePrice) {
                        priceLogs.push({
                            date: now,
                            type: 'offline',
                            oldPrice: oldData.offlinePrice || 0,
                            newPrice: updateData.offlinePrice
                        })
                    }
                    updateData.priceLogs = priceLogs
                }

                await collection.doc(id).update({ data: updateData })
                result = { success: true }
                break
            }

            case 'delete': { // 删除商品
                const { id, force } = data
                // 检查是否有关联的交易记录
                const transCollection = db.collection('jewelry_transactions')
                const relatedTrans = await transCollection.where({ itemId: id }).count()
                if (relatedTrans.total > 0 && !force) {
                    result = { 
                        success: false, 
                        error: `该商品有 ${relatedTrans.total} 条关联交易记录，删除后记录将成为孤立数据。如确认删除请使用强制删除。`,
                        hasRelatedRecords: true,
                        relatedCount: relatedTrans.total
                    }
                    break
                }
                await collection.doc(id).remove()
                result = { success: true }
                break
            }

            case 'updateQuantity': { // 更新库存数量（原子操作）
                const { id, delta } = data
                await collection.doc(id).update({
                    data: {
                        quantity: _.inc(delta),
                        updatedAt: new Date().toISOString()
                    }
                })
                result = { success: true }
                break
            }

            default:
                result = { success: false, error: `Unknown action: ${action}` }
        }

        // --- 图片链接转换逻辑 (Web端兼容) ---
        if (result && result.success && result.data) {
            const fileList = []
            const isArray = Array.isArray(result.data)
            const items = isArray ? result.data : [result.data]

            // 1. 收集所有 cloud:// 开头的图片 ID
            items.forEach(item => {
                if (item.image && item.image.startsWith('cloud://')) {
                    fileList.push(item.image)
                }
            })

            // 2. 批量换取临时链接 (有效期较长)
            if (fileList.length > 0) {
                const { fileList: tempFiles } = await cloud.getTempFileURL({
                    fileList: fileList
                })

                // 3. 建立映射表
                const urlMap = {}
                tempFiles.forEach(f => {
                    if (f.tempFileURL) {
                        urlMap[f.fileID] = f.tempFileURL
                    }
                })

                // 4. 替换原始数据中的链接
                items.forEach(item => {
                    if (item.image && urlMap[item.image]) {
                        item.image = urlMap[item.image]
                    }
                })
            }
        }
        // ------------------------------------

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
