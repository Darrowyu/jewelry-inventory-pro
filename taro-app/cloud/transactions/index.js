const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
    const { action, data } = event
    const transCollection = db.collection('jewelry_transactions')
    const invCollection = db.collection('jewelry_inventory')

    try {
        switch (action) {
            case 'list': { // 获取交易记录列表
                const { type, itemId, startDate, endDate, limit = 50 } = data || {}
                let query = {}
                if (type) query.type = type
                if (itemId) query.itemId = itemId
                if (startDate && endDate) {
                    query.date = _.gte(startDate).and(_.lte(endDate))
                }

                const result = await transCollection.where(query).orderBy('date', 'desc').limit(limit).get()
                return { success: true, data: result.data }
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
                    return { success: true, data: { _id: transResult._id, ...record } }
                } catch (e) {
                    await transaction.rollback()
                    throw e
                }
            }

            case 'getByItem': { // 获取某商品的交易历史
                const { itemId } = data
                const result = await transCollection.where({ itemId }).orderBy('date', 'desc').get()
                return { success: true, data: result.data }
            }

            case 'stats': { // 获取销售统计
                const { startDate, endDate } = data || {}
                let query = { type: 'outbound' }
                if (startDate && endDate) {
                    query.date = _.gte(startDate).and(_.lte(endDate))
                }

                const result = await transCollection.where(query).get()
                const salesByCurrency = { CNY: 0, SGD: 0, TWD: 0 }
                result.data.forEach(rec => {
                    if (rec.finalAmount && rec.currency) {
                        salesByCurrency[rec.currency] = (salesByCurrency[rec.currency] || 0) + rec.finalAmount
                    }
                })
                return { success: true, data: { salesByCurrency, totalRecords: result.data.length } }
            }

            default:
                return { success: false, error: `Unknown action: ${action}` }
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}
