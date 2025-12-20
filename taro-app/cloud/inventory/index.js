const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
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
                updateData.updatedAt = new Date().toISOString()
                await collection.doc(id).update({ data: updateData })
                result = { success: true }
                break
            }

            case 'delete': { // 删除商品
                const { id } = data
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
