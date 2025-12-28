// API 基础 URL 配置
const VERCEL_API_URL = 'https://jewelry-inventory-pro-yvomma.vercel.app/api'

// 生产环境用相对路径，开发环境用 Vercel API
export const API_BASE_URL = import.meta.env.PROD ? '/api' : VERCEL_API_URL

export const getApiUrl = (path: string) => {
    return `${API_BASE_URL}${path}`
}
