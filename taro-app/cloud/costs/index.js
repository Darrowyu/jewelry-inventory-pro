const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

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

    const collection = db.collection('jewelry_costs')

    try {
        let result
        switch (action) {
            case 'list': {
                const res = await collection.orderBy('date', 'desc').get()
                result = { success: true, data: res.data }
                break
            }

            case 'add': {
                const item = { ...data, date: new Date().toISOString() }
                const res = await collection.add({ data: item })
                result = { success: true, data: { _id: res._id, ...item } }
                break
            }

            case 'update': {
                const { id, ...updateData } = data
                await collection.doc(id).update({ data: updateData })
                result = { success: true }
                break
            }

            case 'delete': {
                const { id } = data
                await collection.doc(id).remove()
                result = { success: true }
                break
            }

            case 'summary': { // 获取成本汇总
                const res = await collection.get()
                const summary = {}
                let total = 0
                res.data.forEach(cost => {
                    if (!summary[cost.category]) {
                        summary[cost.category] = { name: cost.category, value: 0 }
                    }
                    summary[cost.category].value += cost.amount || 0
                    total += cost.amount || 0
                })
                result = { success: true, data: { byCategory: Object.values(summary), total } }
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
