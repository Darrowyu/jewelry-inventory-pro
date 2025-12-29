// API 基础 URL 配置
// 开发环境通过 Vite 代理访问 Vercel API，生产环境直接使用相对路径
export const API_BASE_URL = '/api'

export const getApiUrl = (path: string) => {
    // 确保路径不会重复 /api
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${API_BASE_URL}${cleanPath}`
}

