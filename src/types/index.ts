
export enum Category {
    EAR_STUD = '耳饰',
    NECKLACE = '项链',
    BRACELET = '手链',
    RING = '戒指',
    OTHERS = '其他'
}

export enum Warehouse {
    SOHO = 'SOHO',
    TATA = '他她',
    YIFAN = '一番'
}

export enum OutboundType {
    TATA_DIRECT = '他她仓位直接出售',
    SHOPEE_SG = 'Shopee 新加坡',
    SHOPEE_TW = 'Shopee 台湾',
    RED = '小红书',
    OTHER = '其他'
}

export enum InboundType {
    RETURN = '退货',
    PROCUREMENT = '采购',
    HANDMADE = '自制品',
    OTHER = '其他'
}

export enum Currency {
    SGD = 'SGD',
    TWD = 'TWD',
    CNY = 'CNY'
}

export interface PriceLog {
    date: string;
    type: 'online' | 'offline';
    oldPrice: number;
    newPrice: number;
}

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

export interface TransactionRecord {
    _id?: string;
    id?: string;
    itemId: string;
    type: 'inbound' | 'outbound';
    method: OutboundType | InboundType;
    quantity: number;
    date: string;
    amount?: number;
    currency?: Currency;
    discount?: number;
    finalAmount?: number;
    source?: string;
    status?: '完好' | '损坏';
    linkedTransactionId?: string;
    note?: string;
}

export interface CostItem {
    _id?: string;
    id?: string;
    name: string;
    value: number;
    category: 'equipment' | 'packaging' | 'parts' | 'procurement' | 'promotion' | 'loss';
    date: string;
}

export interface FinancialMetric {
    salesTotal: Record<Currency, number>;
    costs: CostItem[];
}

export type TransactionType = 'inbound' | 'outbound';
export type TransactionMethod = OutboundType | InboundType;

export interface AppState {
    inventory: InventoryItem[];
    records: TransactionRecord[];
    costs: CostItem[];
}
