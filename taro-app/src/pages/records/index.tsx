import { useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { transactionService, inventoryService } from '../../services/cloud'
import { TransactionRecord, InventoryItem } from '../../types'
import './index.scss'

type FilterType = 'all' | 'inbound' | 'outbound'

export default function Records() {
    const [records, setRecords] = useState<TransactionRecord[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState<FilterType>('all')

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const [recordsData, inventoryData] = await Promise.all([
                transactionService.list(filterType !== 'all' ? { type: filterType } : undefined),
                inventoryService.list()
            ])
            setRecords(recordsData)
            setInventory(inventoryData)
        } catch (error) {
            console.error('加载数据失败:', error)
            Taro.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }, [filterType])

    useEffect(() => {
        loadData()
    }, [loadData])

    const getItemName = (itemId: string) => {
        const item = inventory.find(i => i._id === itemId)
        return item?.modelNumber || '未知款'
    }

    const filters: { type: FilterType; label: string }[] = [
        { type: 'all', label: '全部' },
        { type: 'inbound', label: '入库' },
        { type: 'outbound', label: '出库' }
    ]

    return (
        <View className='container'>
            {/* 筛选按钮 */}
            <View className='filter-group'>
                {filters.map(f => (
                    <View
                        key={f.type}
                        className={`filter-btn ${filterType === f.type ? (f.type === 'inbound' ? 'active-green' : 'active') : ''}`}
                        onClick={() => setFilterType(f.type)}
                    >
                        <Text>{f.label}</Text>
                    </View>
                ))}
            </View>

            {/* 记录列表 */}
            {loading ? (
                <View className='empty'>
                    <Text className='empty-text'>加载中...</Text>
                </View>
            ) : records.length === 0 ? (
                <View className='empty'>
                    <Text className='empty-text'>暂无交易记录</Text>
                </View>
            ) : (
                <View className='record-list'>
                    {records.map(rec => {
                        const isOut = rec.type === 'outbound'
                        return (
                            <View key={rec._id} className='record-item'>
                                <View className={`record-icon ${rec.type}`}>
                                    <Text style={{ fontSize: 32 }}>{isOut ? '↗' : '↘'}</Text>
                                </View>
                                <View className='record-info'>
                                    <Text className='record-title'>{getItemName(rec.itemId)}</Text>
                                    <Text className='record-meta'>{rec.method} · {rec.date?.split(' ')[0]}</Text>
                                </View>
                                <View className='record-right'>
                                    <Text className={`record-quantity ${rec.type}`}>
                                        {isOut ? '-' : '+'}{rec.quantity}
                                    </Text>
                                    {rec.finalAmount !== undefined && (
                                        <Text className='record-amount'>{rec.currency} {rec.finalAmount}</Text>
                                    )}
                                </View>
                            </View>
                        )
                    })}
                </View>
            )}
        </View>
    )
}
