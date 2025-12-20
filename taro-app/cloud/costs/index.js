const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
    const { action, data } = event
    const collection = db.collection('jewelry_costs')

    try {
        switch (action) {
            case 'list': {
                const result = await collection.orderBy('date', 'desc').get()
                return { success: true, data: result.data }
            }

            case 'add': {
                const item = { ...data, date: new Date().toISOString() }
                const result = await collection.add({ data: item })
                return { success: true, data: { _id: result._id, ...item } }
            }

            case 'update': {
                const { id, ...updateData } = data
                await collection.doc(id).update({ data: updateData })
                return { success: true }
            }

            case 'delete': {
                const { id } = data
                await collection.doc(id).remove()
                return { success: true }
            }

            case 'summary': { // 获取成本汇总
                const result = await collection.get()
                const summary = {}
                let total = 0
                result.data.forEach(cost => {
                    if (!summary[cost.category]) {
                        summary[cost.category] = { name: cost.name, value: 0 }
                    }
                    summary[cost.category].value += cost.value
                    total += cost.value
                })
                return { success: true, data: { byCategory: Object.values(summary), total } }
            }

            default:
                return { success: false, error: `Unknown action: ${action}` }
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}
