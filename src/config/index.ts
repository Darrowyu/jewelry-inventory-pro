// API配置
export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// 应用配置
export const APP_CONFIG = {
    name: '库存管家',
    version: '1.0.0',
    description: '珠宝库存管理系统'
} as const

// 分页配置
export const PAGINATION = {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100]
} as const

// 成本类别颜色
export const COST_COLORS: Record<string, string> = {
    equipment: '#FCA5A5',
    packaging: '#F87171',
    parts: '#F43F5E',
    procurement: '#E11D48',
    promotion: '#BE123C',
    loss: '#9F1239'
}
