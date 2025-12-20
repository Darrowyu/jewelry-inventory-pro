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
    TATA_DIRECT = '他她直售',      // 线下售价 - 优惠金额
    SHOPEE_SG = 'Shopee新加坡',   // 新元
    SHOPEE_TW = 'Shopee台湾',     // 新台币
    RED = '小红书',                // 线上售价 - 优惠金额
    OTHER = '其他'
}

// 入库方式
export enum InboundType {
    RETURN = '退货',      // 可关联出库记录
    PROCUREMENT = '采购', // 采购来源
    HANDMADE = '自制品',
    OTHER = '其他'
}

// 币种
export enum Currency {
    CNY = 'CNY',  // 人民币
    SGD = 'SGD',  // 新元
    TWD = 'TWD'   // 新台币
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
    image: string;               // 商品图片
    category: Category;          // 类目
    modelNumber: string;         // 款号
    specification: string;       // 规格（耳夹/耳针等）
    color: string;               // 颜色
    quantity: number;            // 在库数量
    warehouse: Warehouse;        // 仓位
    costPrice: number;           // 进货价
    onlinePrice: number;         // 线上售价
    offlinePrice: number;        // 线下售价
    priceLogs: PriceLog[];       // 价格变动日志
    createdAt?: string;
    updatedAt?: string;
}

export type Product = InventoryItem;

// 交易记录
export interface TransactionRecord {
    _id?: string;
    id?: string;
    itemId: string;                        // 关联商品ID
    type: 'inbound' | 'outbound';          // 出入库类型
    method: OutboundType | InboundType;    // 出入库方式
    quantity: number;                      // 数量
    date: string;                          // 日期

    // 金额相关
    amount?: number;                       // 原始金额/既定售价
    discount?: number;                     // 优惠金额（正负数均可）
    finalAmount?: number;                  // 最终金额 = amount - discount
    currency?: Currency;                   // 币种

    // 入库相关
    source?: string;                       // 来源（退货来源/采购来源）
    returnStatus?: ReturnStatus;           // 退货状态（完好/损坏）
    linkedTransactionId?: string;          // 关联的出库记录ID（退货时使用）

    // 其他
    note?: string;                         // 备注
    createdAt?: string;
    updatedAt?: string;
}

// 成本项
export interface CostItem {
    _id?: string;
    id?: string;
    name: string;                 // 成本名称
    amount: number;               // 金额
    category: CostCategory;       // 成本类目
    date: string;                 // 日期
    note?: string;                // 备注
    createdAt?: string;
}

// 财务指标
export interface FinancialMetric {
    salesTotal: Record<Currency, number>;  // 各币种销售额
    costsTotal: number;                    // 成本总计
    costsByCategory: Record<CostCategory, number>; // 分类成本
}

// 类型别名
export type TransactionType = 'inbound' | 'outbound';
export type TransactionMethod = OutboundType | InboundType;

// 应用状态
export interface AppState {
    inventory: InventoryItem[];
    records: TransactionRecord[];
    costs: CostItem[];
}

// 云函数响应
export interface CloudResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
