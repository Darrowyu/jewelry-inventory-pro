import { useState, useEffect } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { transactionService } from '../../services/cloud'
import { TransactionRecord, Currency } from '../../types'
import { formatTime } from '../../utils'
import QuickAddSheet from '../../components/QuickAddSheet'
import './index.scss'

// 筛选类型
type FilterType = 'ALL' | 'IN' | 'OUT'

export default function Records() {
    const [records, setRecords] = useState<TransactionRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('ALL')
    const [showQuickAdd, setShowQuickAdd] = useState(false)

    useDidShow(() => {
        loadRecords()
        const eventListener = () => setShowQuickAdd(true)
        Taro.eventCenter.on('showQuickAddSheet', eventListener)
        return () => {
            Taro.eventCenter.off('showQuickAddSheet', eventListener)
        }
    })

    const loadRecords = async () => {
        try {
            setLoading(true)
            const list = await transactionService.list({ limit: 50 })
            // 需要关联商品信息，这里简化处理，假设后端返回了或直接显示itemId作为款号占位
            // 实际项目中可能需要在list接口做lookup，或者前端再根据itemId查一次
            // 为了性能，如果数据量大，建议后端lookup。这里我们先展示基本信息。
            setRecords(list)
        } catch (error) {
            console.error('加载记录失败:', error)
            Taro.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    // 过滤逻辑
    const filteredRecords = records.filter(item => {
        if (filter === 'ALL') return true
        if (filter === 'IN') return item.type === 'inbound'
        if (filter === 'OUT') return item.type === 'outbound'
        return true
    })

    const handleFilterChange = (type: FilterType) => {
        setFilter(type)
    }

    const getIcon = (type: string) => {
        return type === 'inbound' ? '↙' : '↗'
    }

    const getFormatCurrency = (amount: number, currency?: Currency) => {
        const symbol = currency === Currency.SGD ? 'S$' : (currency === Currency.TWD ? 'NT$' : '¥')
        return `${currency || 'CNY'} ${amount}`
    }

    return (
        <View className='page-container'>
            <ScrollView scrollY className='scroll-content'>
                {/* 搜索框 */}
                <View className='search-box'>
                    <Text className='search-icon'>🔍</Text>
                    <Input className='search-input' placeholder='搜索款号、品类...' disabled />
                </View>

                {/* header */}
                <View className='section-header'>
                    <Text className='title'>变动记录</Text>
                    <View className='line' />
                </View>

                {/* 筛选标签 */}
                <View className='filter-tabs'>
                    <View
                        className={`tab ${filter === 'ALL' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('ALL')}
                    >
                        <Text>全部</Text>
                    </View>
                    <View
                        className={`tab ${filter === 'IN' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('IN')}
                    >
                        <Text>入库</Text>
                    </View>
                    <View
                        className={`tab ${filter === 'OUT' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('OUT')}
                    >
                        <Text>出库</Text>
                    </View>
                </View>

                {/* 记录列表 */}
                <View className='record-list'>
                    {loading ? (
                        <View className='loading-state'><Text>加载中...</Text></View>
                    ) : filteredRecords.length > 0 ? (
                        filteredRecords.map(item => (
                            <View key={item._id} className='record-item'>
                                {/* 左侧图标 */}
                                <View className={`icon-wrapper ${item.type}`}>
                                    <Text className='type-icon'>{getIcon(item.type)}</Text>
                                </View>

                                {/* 中间信息 */}
                                <View className='info-col'>
                                    {/* 这里暂时显示itemId或者需要后端关联ModelNumber */}
                                    {/* 为了演示效果，先用假数据格式模拟，实际需字段支持 */}
                                    <Text className='item-code'>{item.itemId || '未知款号'}</Text>
                                    <View className='sub-info'>
                                        <Text className='method'>{item.method || '未知渠道'}</Text>
                                        <Text className='dot'>·</Text>
                                        <Text className='date'>{formatTime(item.date).split(' ')[0]}</Text>
                                    </View>
                                </View>

                                {/* 右侧数据 */}
                                <View className='data-col'>
                                    <Text className={`qty ${item.type}`}>
                                        {item.type === 'inbound' ? '+' : '-'}{item.quantity}
                                    </Text>
                                    <Text className='amount'>
                                        {item.finalAmount ? getFormatCurrency(item.finalAmount, item.currency) : (item.amount ? getFormatCurrency(item.amount, item.currency) : '-')}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View className='empty-state'><Text>暂无记录</Text></View>
                    )}
                </View>

                <View style={{ height: '120px' }} />
            </ScrollView>

            <QuickAddSheet
                visible={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                onSuccess={() => {
                    loadRecords()
                    setShowQuickAdd(false)
                    Taro.showToast({ title: '登记成功' })
                }}
            />
        </View>
    )
}
