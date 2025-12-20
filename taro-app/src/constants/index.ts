import { Category, Warehouse, OutboundType, InboundType, Currency, CostCategory, ReturnStatus } from '../types'

// 存储键名
export const STORAGE_KEYS = {
    JEWELRY_INVENTORY: 'jewelry_inventory',
    JEWELRY_RECORDS: 'jewelry_transactions',
    JEWELRY_COSTS: 'jewelry_costs',
} as const

// 分类选项
export const CATEGORY_OPTIONS = [
    { value: Category.EAR, label: '耳饰' },
    { value: Category.NECKLACE, label: '项链' },
    { value: Category.BRACELET, label: '手链' },
    { value: Category.RING, label: '戒指' },
    { value: Category.OTHERS, label: '其他' }
]

// 仓位选项
export const WAREHOUSE_OPTIONS = [
    { value: Warehouse.SOHO, label: 'SOHO' },
    { value: Warehouse.TATA, label: '他她' },
    { value: Warehouse.YIFAN, label: '一番' }
]

// 出库方式选项
export const OUTBOUND_OPTIONS = [
    { value: OutboundType.TATA_DIRECT, label: '他她直售', currency: Currency.CNY },
    { value: OutboundType.SHOPEE_SG, label: 'Shopee新加坡', currency: Currency.SGD },
    { value: OutboundType.SHOPEE_TW, label: 'Shopee台湾', currency: Currency.TWD },
    { value: OutboundType.RED, label: '小红书', currency: Currency.CNY },
    { value: OutboundType.OTHER, label: '其他', currency: Currency.CNY }
]

// 入库方式选项
export const INBOUND_OPTIONS = [
    { value: InboundType.RETURN, label: '退货' },
    { value: InboundType.PROCUREMENT, label: '采购' },
    { value: InboundType.HANDMADE, label: '自制品' },
    { value: InboundType.OTHER, label: '其他' }
]

// 币种选项
export const CURRENCY_OPTIONS = [
    { value: Currency.CNY, label: '人民币 (CNY)', symbol: '¥' },
    { value: Currency.SGD, label: '新加坡元 (SGD)', symbol: 'S$' },
    { value: Currency.TWD, label: '新台币 (TWD)', symbol: 'NT$' }
]

// 退货状态选项
export const RETURN_STATUS_OPTIONS = [
    { value: ReturnStatus.INTACT, label: '完好' },
    { value: ReturnStatus.DAMAGED, label: '损坏' }
]

// 成本类目选项
export const COST_CATEGORY_OPTIONS = [
    { value: CostCategory.EQUIPMENT, label: '设备费' },
    { value: CostCategory.PACKAGING, label: '包装费' },
    { value: CostCategory.PARTS, label: '配件费' },
    { value: CostCategory.PRODUCT, label: '产品采购费' },
    { value: CostCategory.MATERIAL, label: '材料采购费' },
    { value: CostCategory.PROMOTION, label: '推广费' },
    { value: CostCategory.LOSS, label: '损耗费' }
]

// 成本类别颜色
export const COST_COLORS: Record<string, string> = {
    [CostCategory.EQUIPMENT]: '#EF4444',
    [CostCategory.PACKAGING]: '#F97316',
    [CostCategory.PARTS]: '#F59E0B',
    [CostCategory.PRODUCT]: '#EAB308',
    [CostCategory.MATERIAL]: '#84CC16',
    [CostCategory.PROMOTION]: '#22C55E',
    [CostCategory.LOSS]: '#06B6D4'
}

// 币种符号映射
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
    [Currency.CNY]: '¥',
    [Currency.SGD]: 'S$',
    [Currency.TWD]: 'NT$'
}

// 出库方式对应的默认币种
export const METHOD_CURRENCY_MAP: Record<OutboundType, Currency> = {
    [OutboundType.TATA_DIRECT]: Currency.CNY,
    [OutboundType.SHOPEE_SG]: Currency.SGD,
    [OutboundType.SHOPEE_TW]: Currency.TWD,
    [OutboundType.RED]: Currency.CNY,
    [OutboundType.OTHER]: Currency.CNY
}
