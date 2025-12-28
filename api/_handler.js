// 微信云开发代理核心逻辑
const WEIXIN_CONFIG = {
    appId: process.env.WX_APPID,
    appSecret: process.env.WX_APPSECRET,
    envId: process.env.WX_ENV_ID
}

let accessToken = null
let tokenExpireTime = 0

async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpireTime) {
        return accessToken
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WEIXIN_CONFIG.appId}&secret=${WEIXIN_CONFIG.appSecret}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.access_token) {
        accessToken = data.access_token
        tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000
        return accessToken
    }
    throw new Error(data.errmsg || '获取 access_token 失败')
}

export async function handleCloudRequest(req, res, functionName) {
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
        const { action, data } = req.body
        const token = await getAccessToken()
        const url = `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${token}&env=${WEIXIN_CONFIG.envId}&name=${functionName}`

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, data, _fromWeb: true })
        })

        const result = await response.json()
        if (result.errcode && result.errcode !== 0) {
            throw new Error(result.errmsg || '云函数调用失败')
        }

        const respData = JSON.parse(result.resp_data)
        return res.status(200).json(respData)
    } catch (error) {
        console.error(`Proxy error (${functionName}):`, error)
        return res.status(500).json({ success: false, error: error.message })
    }
}
