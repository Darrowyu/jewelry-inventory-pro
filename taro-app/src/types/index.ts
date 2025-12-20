// 商品分类
export enum Category {
    EAR_STUD = '耳饰',
    NECKLACE = '项链',
    BRACELET = '手链',
    RING = '戒指',
    OTHERS = '其他'
}

// 仓库
export enum Warehouse {
    SOHO = 'SOHO',
    TATA = '他她',
    YIFAN = '一番'
}

// 出库类型
export enum OutboundType {
    TATA_DIRECT = '他她仓位直接出售',
    SHOPEE_SG = 'Shopee 新加坡',
    SHOPEE_TW = 'Shopee 台湾',
    RED = '小红书',
    OTHER = '其他'
}

// 入库类型
export enum InboundType {
    RETURN = '退货',
    PROCUREMENT = '采购',
    HANDMADE = '自制品',
    OTHER = '其他'
}

// 货币类型
export enum Currency {
    SGD = 'SGD',
    TWD = 'TWD',
    CNY = 'CNY'
}

// 价格变动记录
export interface PriceLog {
    date: string
    type: 'online' | 'offline'
    oldPrice: number
    newPrice: number
}

// 库存商品
export interface InventoryItem {
    _id?: string
    id?: string
    image: string
    category: Category
    modelNumber: string
    specification: string
    color: string
    quantity: number
    warehouse: Warehouse
    costPrice: number
    onlinePrice: number
    offlinePrice: number
    priceLogs: PriceLog[]
    createdAt?: string
    updatedAt?: string
}

// 交易记录
export interface TransactionRecord {
    _id?: string
    id?: string
    itemId: string
    type: 'inbound' | 'outbound'
    method: OutboundType | InboundType
    quantity: number
    date: string
    amount?: number
    currency?: Currency
    discount?: number
    finalAmount?: number
    source?: string
    status?: '完好' | '损坏'
    linkedTransactionId?: string
    note?: string
}

// 成本项
export interface CostItem {
    _id?: string
    id?: string
    name: string
    value: number
    category: 'equipment' | 'packaging' | 'parts' | 'procurement' | 'promotion' | 'loss'
    date: string
}

// 云函数响应
export interface CloudResponse<T = any> {
    success: boolean
    data?: T
    error?: string
}

// 交易类型
export type TransactionType = 'inbound' | 'outbound'
export type TransactionMethod = OutboundType | InboundType
