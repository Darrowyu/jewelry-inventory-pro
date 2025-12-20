// 商品类目
export enum Category {
    EAR = '耳饰',
    NECKLACE = '项链',
    BRACELET = '手链',
    RING = '戒指',
    OTHERS = '其他'
}

// 仓位
export enum Warehouse {
    SOHO = 'SOHO',
    TATA = '他她',
    YIFAN = '一番'
}

// 出库方式
export enum OutboundType {
    TATA_DIRECT = '他她直售',
    SHOPEE_SG = 'Shopee新加坡',
    SHOPEE_TW = 'Shopee台湾',
    RED = '小红书',
    OTHER = '其他'
}

// 入库方式
export enum InboundType {
    RETURN = '退货',
    PROCUREMENT = '采购',
    HANDMADE = '自制品',
    OTHER = '其他'
}

// 币种
export enum Currency {
    CNY = 'CNY',
    SGD = 'SGD',
    TWD = 'TWD'
}

// 退货状态
export enum ReturnStatus {
    INTACT = '完好',
    DAMAGED = '损坏'
}

// 成本类目
export enum CostCategory {
    EQUIPMENT = '设备费',
    PACKAGING = '包装费',
    PARTS = '配件费',
    PRODUCT = '产品采购费',
    MATERIAL = '材料采购费',
    PROMOTION = '推广费',
    LOSS = '损耗费'
}

// 价格变动日志
export interface PriceLog {
    date: string;
    type: 'online' | 'offline';
    oldPrice: number;
    newPrice: number;
}

// 库存商品
export interface InventoryItem {
    _id?: string;
    id?: string;
    image: string;
    category: Category;
    modelNumber: string;
    specification: string;
    color: string;
    quantity: number;
    warehouse: Warehouse;
    costPrice: number;
    onlinePrice: number;
    offlinePrice: number;
    priceLogs: PriceLog[];
    createdAt?: string;
    updatedAt?: string;
}

export type Product = InventoryItem;

// 交易记录
export interface TransactionRecord {
    _id?: string;
    id?: string;
    itemId: string;
    type: 'inbound' | 'outbound';
    method: OutboundType | InboundType;
    quantity: number;
    date: string;
    amount?: number;
    discount?: number;
    finalAmount?: number;
    currency?: Currency;
    source?: string;
    returnStatus?: ReturnStatus;
    linkedTransactionId?: string;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
}

// 成本项
export interface CostItem {
    _id?: string;
    id?: string;
    name: string;
    amount: number;
    category: CostCategory;
    date: string;
    note?: string;
    createdAt?: string;
}

// 财务指标
export interface FinancialMetric {
    salesTotal: Record<Currency, number>;
    costsTotal: number;
    costsByCategory: Record<CostCategory, number>;
}

// 类型别名
export type TransactionType = 'inbound' | 'outbound';
export type TransactionMethod = OutboundType | InboundType;

// 云函数响应
export interface CloudResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
