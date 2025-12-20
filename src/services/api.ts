import { InventoryItem, TransactionRecord, CostItem } from '../types'
import { API_BASE_URL } from '../config'

interface CloudResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

async function callApi<T>(endpoint: string, action: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: CloudResponse<T> = await response.json()

    if (!result.success) {
        throw new Error(result.error || 'API调用失败')
    }

    return result.data as T
}

// 库存服务
export const inventoryApi = {
    list: (params?: { keyword?: string; category?: string; warehouse?: string }) =>
        callApi<InventoryItem[]>('inventory', 'list', params),

    get: (id: string) =>
        callApi<InventoryItem>('inventory', 'get', { id }),

    add: (item: Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt'>) =>
        callApi<InventoryItem>('inventory', 'add', item),

    update: (id: string, data: Partial<InventoryItem>) =>
        callApi<void>('inventory', 'update', { id, ...data }),

    delete: (id: string) =>
        callApi<void>('inventory', 'delete', { id })
}

// 交易服务
export const transactionApi = {
    list: (params?: { type?: string; itemId?: string; limit?: number }) =>
        callApi<TransactionRecord[]>('transactions', 'list', params),

    add: (record: Omit<TransactionRecord, '_id' | 'date'>) =>
        callApi<TransactionRecord>('transactions', 'add', record),

    getByItem: (itemId: string) =>
        callApi<TransactionRecord[]>('transactions', 'getByItem', { itemId }),

    getStats: (params?: { startDate?: string; endDate?: string }) =>
        callApi<{ salesByCurrency: Record<string, number>; totalRecords: number }>('transactions', 'stats', params)
}

// 成本服务
export const costApi = {
    list: () =>
        callApi<CostItem[]>('costs', 'list'),

    add: (item: Omit<CostItem, '_id' | 'date'>) =>
        callApi<CostItem>('costs', 'add', item),

    update: (id: string, data: Partial<CostItem>) =>
        callApi<void>('costs', 'update', { id, ...data }),

    delete: (id: string) =>
        callApi<void>('costs', 'delete', { id }),

    getSummary: () =>
        callApi<{ byCategory: { name: string; value: number }[]; total: number }>('costs', 'summary')
}
