import { useState, useMemo } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { inventoryService, transactionService } from '../../services/cloud'
import { Product, TransactionRecord } from '../../types'
import { CATEGORY_OPTIONS } from '../../constants'
import QuickAddSheet from '../../components/QuickAddSheet'
import './index.scss'

export default function Home() {
    const [inventory, setInventory] = useState<Product[]>([])
    const [transactions, setTransactions] = useState<TransactionRecord[]>([])
    const [todaySales, setTodaySales] = useState(0)
    const [todayCount, setTodayCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showQuickAdd, setShowQuickAdd] = useState(false)

    useDidShow(() => {
        loadData()
        const page = Taro.getCurrentInstance().page
        const tabBar = page?.getTabBar?.() as any
        tabBar?.setSelected?.(0) // 首页是 index 0
        const showListener = () => setShowQuickAdd(true)
        const hideListener = () => setShowQuickAdd(false)
        Taro.eventCenter.on('showQuickAddSheet', showListener)
        Taro.eventCenter.on('hideQuickAddSheet', hideListener)
        return () => {
            Taro.eventCenter.off('showQuickAddSheet', showListener)
            Taro.eventCenter.off('hideQuickAddSheet', hideListener)
        }
    })

    const loadData = async () => {
        try {
            setLoading(true)
            const today = new Date().toISOString().split('T')[0]
            const [list, txList] = await Promise.all([
                inventoryService.list(),
                transactionService.list({ limit: 10 })
            ])
            setInventory(list)
            setTransactions(txList)
            // 统计今日销售
            const todayTx = txList.filter(t => t.date?.startsWith(today) && t.type === 'outbound')
            setTodaySales(todayTx.reduce((sum, t) => sum + (t.finalAmount || t.amount || 0), 0))
            setTodayCount(todayTx.length)
        } catch (error) {
            console.error('加载数据失败:', error)
            Taro.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    // 库存预警：库存量 <= 5 的商品
    const lowStockItems = useMemo(() => {
        return inventory.filter(item => item.quantity <= 5).slice(0, 3)
    }, [inventory])

    // 最近活动：取最近 5 条
    const recentActivities = useMemo(() => {
        return transactions.slice(0, 5)
    }, [transactions])

    const getCategoryLabel = (val: string) => {
        return CATEGORY_OPTIONS.find(c => c.value === val)?.label || val
    }

    const getMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            '他她直售': '他她仓位直接出售',
            'Shopee新加坡': 'Shopee 新加坡',
            'Shopee台湾': 'Shopee 台湾',
            '小红书': '小红书',
            '退货': '退货入库',
            '采购': '采购入库',
            '自制品': '自制品入库'
        }
        return labels[method] || method
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    const handleViewAllStock = () => {
        Taro.switchTab({ url: '/pages/index/index' })
    }

    const handleQuickAction = (action: string) => {
        switch (action) {
            case 'scan':
                Taro.showToast({ title: '扫码功能开发中', icon: 'none' })
                break
            case 'analysis':
                Taro.switchTab({ url: '/pages/index/index' })
                break
            case 'statement':
                Taro.switchTab({ url: '/pages/finance/index' })
                break
        }
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return '早安'
        if (hour < 18) return '午安'
        return '晚安'
    }

    return (
        <View className='home-container'>
            <ScrollView scrollY className='home-scroll'>
                <View className='home-content'>
                    {/* 今日概览卡片 */}
                    <View className='overview-card'>
                        <Text className='overview-tag'>今日概览</Text>
                        <View className='overview-header'>
                            <Text className='greeting'>{getGreeting()}，常老板</Text>
                            <View className='flash-icon'>
                                <Text className='flash'>⚡</Text>
                            </View>
                        </View>
                        <View className='overview-stats'>
                            <View className='stat-box'>
                                <Text className='stat-title'>今日销售</Text>
                                <Text className='stat-value'>¥ {todaySales}</Text>
                            </View>
                            <View className='stat-box'>
                                <Text className='stat-title'>变动笔数</Text>
                                <View className='stat-value-row'>
                                    <Text className='stat-value dark'>{todayCount}</Text>
                                    <Text className='stat-unit'>笔</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* 快捷功能入口 */}
                    <View className='quick-actions'>
                        <View className='action-item' onClick={() => handleQuickAction('scan')}>
                            <View className='action-icon scan'>
                                <Text className='icon-text'>⎔</Text>
                            </View>
                            <Text className='action-label'>扫码出库</Text>
                        </View>
                        <View className='action-item' onClick={() => handleQuickAction('analysis')}>
                            <View className='action-icon analysis'>
                                <Text className='icon-text'>◐</Text>
                            </View>
                            <Text className='action-label'>库存分析</Text>
                        </View>
                        <View className='action-item' onClick={() => handleQuickAction('statement')}>
                            <View className='action-icon statement'>
                                <Text className='icon-text'>☰</Text>
                            </View>
                            <Text className='action-label'>对账单</Text>
                        </View>
                    </View>

                    {/* 库存预警 */}
                    <View className='section'>
                        <View className='section-header'>
                            <View className='section-title-row'>
                                <Text className='warning-icon'>⚠</Text>
                                <Text className='section-title'>库存预警 ({lowStockItems.length})</Text>
                            </View>
                            <Text className='view-all' onClick={handleViewAllStock}>查看全部</Text>
                        </View>
                        {lowStockItems.length > 0 ? (
                            lowStockItems.map(item => (
                                <View key={item._id} className='stock-item' onClick={() => Taro.navigateTo({ url: `/pages/product/index?id=${item._id}` })}>
                                    <Image
                                        className='stock-img'
                                        src={item.image || 'https://via.placeholder.com/80'}
                                        mode='aspectFill'
                                    />
                                    <View className='stock-info'>
                                        <Text className='stock-code'>{item.modelNumber}</Text>
                                        <Text className='stock-desc'>{item.warehouse} · {getCategoryLabel(item.category)}</Text>
                                    </View>
                                    <View className='stock-right'>
                                        <Text className='stock-qty'>{item.quantity} 件</Text>
                                        <Text className='stock-status'>急需补货</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View className='empty-hint'>
                                <Text>暂无库存预警</Text>
                            </View>
                        )}
                    </View>

                    {/* 最近活动 */}
                    <View className='section'>
                        <View className='section-header'>
                            <View className='section-title-row'>
                                <Text className='activity-icon'>↗</Text>
                                <Text className='section-title'>最近活动</Text>
                            </View>
                        </View>
                        {recentActivities.length > 0 ? (
                            recentActivities.map(tx => (
                                <View key={tx._id} className='activity-item'>
                                    <View className={`activity-badge ${tx.type === 'outbound' ? 'out' : 'in'}`}>
                                        <Text className='badge-icon'>{tx.type === 'outbound' ? '↗' : '↙'}</Text>
                                    </View>
                                    <View className='activity-info'>
                                        <Text className='activity-title'>{getMethodLabel(tx.method)}</Text>
                                        <Text className='activity-date'>{formatDate(tx.date)}</Text>
                                    </View>
                                    <View className='activity-right'>
                                        <Text className={`activity-amount ${tx.type === 'outbound' ? 'out' : 'in'}`}>
                                            {tx.type === 'outbound' ? '' : '+'}¥{tx.finalAmount || tx.amount || 0}
                                        </Text>
                                        <Text className={`activity-qty ${tx.type === 'outbound' ? 'out' : 'in'}`}>
                                            {tx.type === 'outbound' ? '-' : '+'}{tx.quantity}PCS
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View className='empty-hint'>
                                <Text>暂无活动记录</Text>
                            </View>
                        )}
                    </View>

                    <View style={{ height: '140px' }} />
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
