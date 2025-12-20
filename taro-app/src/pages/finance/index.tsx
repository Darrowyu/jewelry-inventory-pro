import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { transactionService, costService } from '../../services/cloud'
import { Currency } from '../../types'
import { COST_COLORS } from '../../constants'
import './index.scss'

interface CostSummaryItem {
    name: string
    value: number
    category?: string
}

export default function Finance() {
    const [salesByCurrency, setSalesByCurrency] = useState<Record<string, number>>({ CNY: 0, SGD: 0, TWD: 0 })
    const [costData, setCostData] = useState<CostSummaryItem[]>([])
    const [totalCosts, setTotalCosts] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [statsResult, costSummary] = await Promise.all([
                transactionService.getStats(),
                costService.getSummary()
            ])
            setSalesByCurrency(statsResult.salesByCurrency)
            setCostData(costSummary.byCategory)
            setTotalCosts(costSummary.total)
        } catch (error) {
            console.error('加载财务数据失败:', error)
            Taro.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const netProfit = (salesByCurrency.CNY || 0) - totalCosts

    if (loading) {
        return (
            <View className='container'>
                <View className='empty'>
                    <Text className='empty-text'>加载中...</Text>
                </View>
            </View>
        )
    }

    return (
        <View className='container'>
            {/* 盈利总览 */}
            <View className='profit-card'>
                <View className='profit-header'>
                    <Text className='profit-icon'>📈</Text>
                    <Text className='profit-label'>盈利总览</Text>
                </View>
                <Text className='profit-value'>¥ {netProfit.toLocaleString()}</Text>
                <Text className='profit-desc'>预估净利润（已扣除所有成本项）</Text>
            </View>

            {/* 收益列表 */}
            <View className='revenue-list'>
                {Object.entries(salesByCurrency).map(([curr, value]) => (
                    <View key={curr} className='revenue-item'>
                        <View className='revenue-left'>
                            <View className='revenue-icon'>
                                <Text style={{ fontSize: 32 }}>💰</Text>
                            </View>
                            <View className='revenue-info'>
                                <Text className='revenue-label'>{curr} 总收益</Text>
                                <Text className='revenue-value'>{value.toLocaleString()}</Text>
                            </View>
                        </View>
                        <Text className='revenue-arrow'>›</Text>
                    </View>
                ))}
            </View>

            {/* 成本构成 */}
            <View className='cost-card'>
                <View className='cost-header'>
                    <Text className='cost-title'>成本构成分析</Text>
                    <Text style={{ fontSize: 32 }}>👜</Text>
                </View>

                {costData.length > 0 ? (
                    <>
                        {/* 简化版图表 - 使用进度条代替饼图 */}
                        <View className='cost-bars'>
                            {costData.map((item, index) => {
                                const percentage = totalCosts > 0 ? (item.value / totalCosts) * 100 : 0
                                const color = COST_COLORS[item.category || ''] || '#CBD5E1'
                                return (
                                    <View key={index} className='cost-bar-item'>
                                        <View className='cost-bar-header'>
                                            <Text className='cost-bar-name'>{item.name}</Text>
                                            <Text className='cost-bar-value'>¥{item.value}</Text>
                                        </View>
                                        <View className='cost-bar-track'>
                                            <View
                                                className='cost-bar-fill'
                                                style={{ width: `${percentage}%`, backgroundColor: color }}
                                            />
                                        </View>
                                    </View>
                                )
                            })}
                        </View>

                        {/* 成本汇总 */}
                        <View className='cost-total'>
                            <Text className='cost-total-label'>总成本</Text>
                            <Text className='cost-total-value'>¥{totalCosts.toLocaleString()}</Text>
                        </View>
                    </>
                ) : (
                    <View className='empty' style={{ padding: '64px 0' }}>
                        <Text className='empty-text'>暂无成本数据</Text>
                    </View>
                )}
            </View>
        </View>
    )
}
