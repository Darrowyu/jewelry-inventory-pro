import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { transactionService, costService } from '../../services/cloud'
import CostChart from '../../components/CostChart'
import QuickAddSheet from '../../components/QuickAddSheet'
import TrendUpIcon from '../../assets/icons/trend-up.svg'
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
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [selectedCurrency, setSelectedCurrency] = useState<string>('CNY')

    useDidShow(() => {
        loadData()
        /* 同步TabBar选中状态 */
        const page = Taro.getCurrentInstance().page
        if (page) {
            const tabBar = Taro.getTabBar<any>(page)
            tabBar?.setSelected?.(3)
        }
    })

    useEffect(() => {
        const showListener = () => setShowQuickAdd(true)
        const hideListener = () => setShowQuickAdd(false)
        Taro.eventCenter.on('showQuickAddSheet', showListener)
        Taro.eventCenter.on('hideQuickAddSheet', hideListener)
        return () => {
            Taro.eventCenter.off('showQuickAddSheet', showListener)
            Taro.eventCenter.off('hideQuickAddSheet', hideListener)
        }
    }, [])

    const loadData = async (showLoading = false) => {
        try {
            // 只在首次加载时显示loading，避免切换页面时闪烁
            const isFirstLoad = salesByCurrency.CNY === 0 && totalCosts === 0
            if (showLoading || isFirstLoad) {
                setLoading(true)
            }
            const [statsResult, costSummary] = await Promise.all([
                transactionService.getStats(),
                costService.getSummary()
            ])
            setSalesByCurrency(statsResult.salesByCurrency)
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

    const handleRevenueClick = (currency: string) => {
        setSelectedCurrency(currency)
        // TabBar 页面不能用 navigateTo，使用事件传递参数
        Taro.eventCenter.trigger('setCurrencyFilter', currency)
        Taro.switchTab({
            url: '/pages/records/index'
        })
    }

    const handleCostClick = () => {
        Taro.navigateTo({
            url: '/pages/costs/index'
        })
    }

    return (
        <View className='container'>
            <ScrollView scrollY showScrollbar={false} className='scroll-content'>
                <View className='inner-content'>
                    <View style={{ height: '32px' }} />

                    <Text className='section-header'>财务看板</Text>
                    <View className='divider-line' />

                    <View className='main-content'>
                        {/* 盈利总览卡片 */}
                        <View className='profit-card'>
                            <View className='profit-header'>
                                <Image className='trend-icon-img' src={TrendUpIcon} mode='aspectFit' />
                                <Text className='profit-label'>盈利总览 (CNY)</Text>
                            </View>
                            <Text className='profit-value'>¥ {netProfit.toLocaleString()}</Text>
                            <Text className='profit-desc'>CNY收益减去所有成本项的预估净利润</Text>
                        </View>

                        {/* 收益列表 */}
                        <View className='revenue-list'>
                            {Object.entries(salesByCurrency).map(([curr, value]) => {
                                if (value === 0 && curr !== 'CNY') return null
                                const isSelected = selectedCurrency === curr
                                return (
                                    <View key={curr} className={`revenue-card ${isSelected ? 'selected' : ''}`} onClick={() => handleRevenueClick(curr)}>
                                        <View className='revenue-left'>
                                            <View className={`currency-icon ${isSelected ? 'selected' : ''}`}>
                                                <Text>$</Text>
                                            </View>
                                            <View className='revenue-info'>
                                                <Text className='revenue-label'>{curr} 总收益</Text>
                                                <Text className='revenue-value'>{value.toLocaleString()}</Text>
                                            </View>
                                        </View>
                                        <Text className={`arrow-right ${isSelected ? 'selected' : ''}`}>→</Text>
                                    </View>
                                )
                            })}
                        </View>

                        {/* 成本构成分析 */}
                        <View className='cost-section' onClick={handleCostClick}>
                            <View className='cost-header'>
                                <Text className='cost-title'>成本构成分析</Text>
                                <Text className='cost-manage'>管理 →</Text>
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

                    <View style={{ height: '200px' }} />
                </View>
            </ScrollView>

            <QuickAddSheet
                visible={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                onSuccess={() => {
                    loadData()
                    setShowQuickAdd(false)
                    Taro.showToast({ title: '登记成功' })
                }}
            />
        </View>
    )
}
