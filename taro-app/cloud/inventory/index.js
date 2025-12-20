const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
    const { action, data } = event
    const collection = db.collection('jewelry_inventory')

    try {
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

                const result = await collection.where(query).orderBy('updatedAt', 'desc').get()
                return { success: true, data: result.data }
            }

            case 'get': { // 获取单个商品
                const { id } = data
                const result = await collection.doc(id).get()
                return { success: true, data: result.data }
            }

            case 'add': { // 新增商品
                const now = new Date().toISOString()
                const item = {
                    ...data,
                    createdAt: now,
                    updatedAt: now
                }
                const result = await collection.add({ data: item })
                return { success: true, data: { _id: result._id, ...item } }
            }

            case 'update': { // 更新商品
                const { id, ...updateData } = data
                updateData.updatedAt = new Date().toISOString()
                await collection.doc(id).update({ data: updateData })
                return { success: true }
            }

            case 'delete': { // 删除商品
                const { id } = data
                await collection.doc(id).remove()
                return { success: true }
            }

            case 'updateQuantity': { // 更新库存数量（原子操作）
                const { id, delta } = data
                await collection.doc(id).update({
                    data: {
                        quantity: _.inc(delta),
                        updatedAt: new Date().toISOString()
                    }
                })
                return { success: true }
            }

            default:
                return { success: false, error: `Unknown action: ${action}` }
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}
