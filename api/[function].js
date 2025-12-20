// 微信云开发代理服务 - 可部署到 Vercel / Cloudflare Workers
// 用于 Web 端调用微信云函数

const WEIXIN_CONFIG = {
    appId: process.env.WX_APPID || 'YOUR_APPID',
    appSecret: process.env.WX_APPSECRET || 'YOUR_APPSECRET',
    envId: process.env.WX_ENV_ID || 'YOUR_ENV_ID'
}

let accessToken = null
let tokenExpireTime = 0

// 获取 access_token
async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpireTime) {
        return accessToken
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WEIXIN_CONFIG.appId}&secret=${WEIXIN_CONFIG.appSecret}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.access_token) {
        accessToken = data.access_token
        tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000 // 提前5分钟刷新
        return accessToken
    }
    throw new Error(data.errmsg || '获取 access_token 失败')
}

// 调用云函数
async function invokeCloudFunction(name, data) {
    const token = await getAccessToken()
    const url = `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${token}&env=${WEIXIN_CONFIG.envId}&name=${name}`

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })

    const result = await response.json()
    if (result.errcode && result.errcode !== 0) {
        throw new Error(result.errmsg || '云函数调用失败')
    }

    // 解析云函数返回结果
    return JSON.parse(result.resp_data)
}

// Vercel API 路由处理
export default async function handler(req, res) {
    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        // 从 URL 获取云函数名 (如 /api/inventory)
        const pathParts = req.url.split('/')
        const functionName = pathParts[pathParts.length - 1].split('?')[0]

        if (!functionName || !['inventory', 'transactions', 'costs'].includes(functionName)) {
            return res.status(400).json({ error: '无效的云函数名' })
        }

        const { action, data } = req.body
        const result = await invokeCloudFunction(functionName, { action, data })

        return res.status(200).json(result)
    } catch (error) {
        console.error('Proxy error:', error)
        return res.status(500).json({ success: false, error: error.message })
    }
}
