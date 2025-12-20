import { Category, Warehouse, OutboundType, InboundType, Currency } from '../types'

// 存储键名
export const STORAGE_KEYS = {
    JEWELRY_INVENTORY: 'jewelry_inventory',
    JEWELRY_RECORDS: 'jewelry_transactions',
    JEWELRY_COSTS: 'jewelry_costs',
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

// 分类选项（用于Picker）
export const CATEGORY_OPTIONS = [
    { value: Category.EAR_STUD, label: '耳饰' },
    { value: Category.NECKLACE, label: '项链' },
    { value: Category.BRACELET, label: '手链' },
    { value: Category.RING, label: '戒指' },
    { value: Category.OTHERS, label: '其他' }
]

export const WAREHOUSE_OPTIONS = [
    { value: Warehouse.SOHO, label: 'SOHO' },
    { value: Warehouse.TATA, label: '他她' },
    { value: Warehouse.YIFAN, label: '一番' }
]

export const OUTBOUND_OPTIONS = [
    { value: OutboundType.TATA_DIRECT, label: '他她仓位直接出售' },
    { value: OutboundType.SHOPEE_SG, label: 'Shopee 新加坡' },
    { value: OutboundType.SHOPEE_TW, label: 'Shopee 台湾' },
    { value: OutboundType.RED, label: '小红书' },
    { value: OutboundType.OTHER, label: '其他' }
]

export const INBOUND_OPTIONS = [
    { value: InboundType.RETURN, label: '退货' },
    { value: InboundType.PROCUREMENT, label: '采购' },
    { value: InboundType.HANDMADE, label: '自制品' },
    { value: InboundType.OTHER, label: '其他' }
]

export const CURRENCY_OPTIONS = [
    { value: Currency.CNY, label: 'CNY' },
    { value: Currency.SGD, label: 'SGD' },
    { value: Currency.TWD, label: 'TWD' }
]

// 成本类别选项
export const COST_CATEGORY_OPTIONS = [
    { value: 'equipment', label: '设备' },
    { value: 'packaging', label: '包装' },
    { value: 'parts', label: '配件' },
    { value: 'procurement', label: '采购' },
    { value: 'promotion', label: '推广' },
    { value: 'loss', label: '损耗' }
]
