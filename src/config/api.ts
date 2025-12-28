// API 基础 URL 配置
// 本地开发时使用 Vercel 部署的 API，生产环境使用相对路径
export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export const getApiUrl = (path: string) => {
    return `${API_BASE_URL}${path}`
}
