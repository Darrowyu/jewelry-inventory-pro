import Taro from '@tarojs/taro'
import { InventoryItem, TransactionRecord, CostItem, CloudResponse } from '../types'

// 判断是否在小程序环境
const isWeapp = process.env.TARO_ENV === 'weapp'

// 统一ID字段：将_id复制到id，确保两个字段都可用
function normalizeId<T>(data: T): T {
    if (!data) return data
    if (Array.isArray(data)) {
        return data.map(item => normalizeId(item)) as T
    }
    if (typeof data === 'object' && data !== null) {
        const obj = data as Record<string, unknown>
        if (obj._id && !obj.id) {
            obj.id = obj._id
        }
        return obj as T
    }
    return data
}

// 云函数调用封装
async function callCloud<T>(name: string, action: string, data?: any): Promise<T> {
    if (isWeapp) {
        const res = await Taro.cloud.callFunction({
            name,
            data: { action, data }
        }) as unknown as { result: CloudResponse<T> }

        if (!res.result.success) {
            throw new Error(res.result.error || '云函数调用失败')
        }
        return normalizeId(res.result.data as T)
    } else {
        // H5环境通过HTTP调用
        const baseUrl = process.env.CLOUD_BASE_URL || ''
        const response = await fetch(`${baseUrl}/api/${name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, data })
        })
        const result: CloudResponse<T> = await response.json()
        if (!result.success) {
            throw new Error(result.error || 'API调用失败')
        }
        return normalizeId(result.data as T)
    }
}

// 库存服务
export const inventoryService = {
    async list(params?: { keyword?: string; category?: string; warehouse?: string }): Promise<InventoryItem[]> {
        return callCloud<InventoryItem[]>('inventory', 'list', params)
    },

    async get(id: string): Promise<InventoryItem> {
        return callCloud<InventoryItem>('inventory', 'get', { id })
    },

    async add(item: Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
        return callCloud<InventoryItem>('inventory', 'add', item)
    },

    async update(id: string, data: Partial<InventoryItem>): Promise<void> {
        return callCloud<void>('inventory', 'update', { id, ...data })
    },

    async delete(id: string): Promise<void> {
        return callCloud<void>('inventory', 'delete', { id })
    }
}

// 交易服务
export const transactionService = {
    async list(params?: { type?: string; itemId?: string; limit?: number }): Promise<TransactionRecord[]> {
        return callCloud<TransactionRecord[]>('transactions', 'list', params)
    },

    async add(record: Omit<TransactionRecord, '_id'>): Promise<TransactionRecord> {
        return callCloud<TransactionRecord>('transactions', 'add', record)
    },

    async getByItem(itemId: string): Promise<TransactionRecord[]> {
        return callCloud<TransactionRecord[]>('transactions', 'getByItem', { itemId })
    },

    async getStats(params?: { startDate?: string; endDate?: string }): Promise<{ salesByCurrency: Record<string, number>; totalRecords: number }> {
        return callCloud('transactions', 'stats', params)
    }
}

// 成本服务
export const costService = {
    async list(): Promise<CostItem[]> {
        return callCloud<CostItem[]>('costs', 'list')
    },

    async add(item: Omit<CostItem, '_id' | 'date' | 'createdAt'>): Promise<CostItem> {
        return callCloud<CostItem>('costs', 'add', item)
    },

    async update(id: string, data: Partial<CostItem>): Promise<void> {
        return callCloud<void>('costs', 'update', { id, ...data })
    },

    async delete(id: string): Promise<void> {
        return callCloud<void>('costs', 'delete', { id })
    },

    async getSummary(): Promise<{ byCategory: { name: string; value: number }[]; total: number }> {
        return callCloud('costs', 'summary')
    }
}
