import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { transactionService, costService } from '../../services/cloud'
import { Currency } from '../../types'
import CostChart from '../../components/CostChart'
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
            // 过滤掉值为0的成本项进行显示
            setCostData(costSummary.byCategory.filter(i => i.value > 0))
            setTotalCosts(costSummary.total)
        } catch (error) {
            console.error('加载财务数据失败:', error)
            Taro.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const netProfit = (salesByCurrency.CNY || 0) - totalCosts

    return (
        <View className='container'>
            <View style={{ height: '32px' }} />

            <Text className='section-header'>财务看板</Text>
            <View className='divider-line' />

            <View className='main-content'>
                {/* 盈利总览卡片 */}
                <View className='profit-card'>
                    <View className='profit-header'>
                        <Text className='trend-icon'>↗</Text>
                        <Text className='profit-label'>盈利总览</Text>
                    </View>
                    <Text className='profit-value'>¥ {netProfit.toLocaleString()}</Text>
                    <Text className='profit-desc'>预估净利润（已扣除所有成本项）</Text>
                </View>

                {/* 收益列表 */}
                <View className='revenue-list'>
                    {Object.entries(salesByCurrency).map(([curr, value]) => {
                        // 过滤显示
                        if (value === 0 && curr !== 'CNY') return null
                        const symbol = curr === 'CNY' ? '¥' : (curr === 'SGD' ? 'S$' : 'NT$')
                        return (
                            <View key={curr} className='revenue-card'>
                                <View className='revenue-left'>
                                    <View className='currency-icon'>
                                        <Text>$</Text>
                                    </View>
                                    <View className='revenue-info'>
                                        <Text className='revenue-label'>{curr} 总收益</Text>
                                        <Text className='revenue-value'>{value.toLocaleString()}</Text>
                                    </View>
                                </View>
                                <Text className='arrow-right'>→</Text>
                            </View>
                        )
                    })}
                </View>

                {/* 成本构成分析 */}
                <View className='cost-section'>
                    <View className='cost-header'>
                        <Text className='cost-title'>成本构成分析</Text>
                        <Text className='calendar-icon'>📅</Text>
                    </View>

                    <CostChart data={costData} />

                    <View className='cost-grid'>
                        {costData.map((item, index) => (
                            <View key={index} className='cost-grid-item'>
                                <Text className='cost-name'>{item.name}</Text>
                                <Text className='cost-val'>¥{item.value.toLocaleString()}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    )
}
