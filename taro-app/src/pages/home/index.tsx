import { useState, useMemo } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { inventoryService, transactionService } from '../../services/cloud'
import { Product, TransactionRecord } from '../../types'
import { CATEGORY_OPTIONS } from '../../constants'
import QuickAddSheet from '../../components/QuickAddSheet'
import ActionScanIcon from '../../assets/icons/action-scan.svg'
import ActionAnalysisIcon from '../../assets/icons/action-analysis.svg'
import ActionStatementIcon from '../../assets/icons/action-statement.svg'
import FlashIcon from '../../assets/icons/flash.svg'
import WarningIcon from '../../assets/icons/warning.svg'
import TrendUpIcon from '../../assets/icons/trend-up.svg'
import ArrowOutboundIcon from '../../assets/icons/arrow-outbound.svg'
import ArrowInboundIcon from '../../assets/icons/arrow-inbound.svg'
import './index.scss'

export default function Home() {
    const [inventory, setInventory] = useState<Product[]>([])
    const [transactions, setTransactions] = useState<TransactionRecord[]>([])
    const [todaySales, setTodaySales] = useState(0)
    const [todayCount, setTodayCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [username, setUsername] = useState('')

    useDidShow(() => {
        loadData()
        // 获取当前登录用户
        const currentUser = Taro.getStorageSync('currentUser')
        if (currentUser) {
            setUsername(currentUser.nickname || currentUser.username || '')
        }
        /* 同步TabBar选中状态 */
        const page = Taro.getCurrentInstance().page
        if (page) {
            const tabBar = Taro.getTabBar<any>(page)
            tabBar?.setSelected?.(0)
        }
        const showListener = () => setShowQuickAdd(true)
        const hideListener = () => setShowQuickAdd(false)
        Taro.eventCenter.on('showQuickAddSheet', showListener)
        Taro.eventCenter.on('hideQuickAddSheet', hideListener)
        return () => {
            Taro.eventCenter.off('showQuickAddSheet', showListener)
            Taro.eventCenter.off('hideQuickAddSheet', hideListener)
        }
    })

    const loadData = async (showLoading = false) => {
        try {
            // 只在首次加载时显示loading，避免切换页面时闪烁
            if (showLoading || (inventory.length === 0 && transactions.length === 0)) {
                setLoading(true)
            }
            const today = new Date().toISOString().split('T')[0]
            const [list, txList] = await Promise.all([
                inventoryService.list(),
                transactionService.list({ limit: 10 })
            ])
            setInventory(list)
            setTransactions(txList)
            // 统计今日销售（出库金额 - 退货金额）
            const todayOutbound = txList.filter(t => t.date?.startsWith(today) && t.type === 'outbound')
            const todayReturns = txList.filter(t => t.date?.startsWith(today) && t.type === 'inbound' && t.method === '退货')
            const outboundTotal = todayOutbound.reduce((sum, t) => sum + (t.finalAmount || t.amount || 0), 0)
            const returnTotal = todayReturns.reduce((sum, t) => sum + (t.finalAmount || t.amount || 0), 0)
            setTodaySales(outboundTotal - returnTotal)
            setTodayCount(todayOutbound.length)
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
        let greeting = ''
        if (hour < 6) greeting = '凌晨好'
        else if (hour < 9) greeting = '早上好'
        else if (hour < 12) greeting = '上午好'
        else if (hour < 14) greeting = '中午好'
        else if (hour < 18) greeting = '下午好'
        else if (hour < 22) greeting = '晚上好'
        else greeting = '夜深了'
        return `${greeting}，${username || '用户'}`
    }

    return (
        <View className='home-container'>
            <ScrollView scrollY className='home-scroll'>
                <View className='home-content'>
                    {/* 今日概览卡片 */}
                    <View className='overview-card'>
                        <Text className='overview-tag'>今日概览</Text>
                        <View className='overview-header'>
                            <View className='greeting-box'>
                                <Text className='greeting'>{getGreeting()}</Text>
                                <Text className='greeting-sub'>今天也是充满希望的一天</Text>
                            </View>
                            <View className='flash-icon'>
                                <Image className='flash-img' src={FlashIcon} mode='aspectFit' />
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
                                <Image className='action-icon-img' src={ActionScanIcon} mode='aspectFit' />
                            </View>
                            <Text className='action-label'>扫码出库</Text>
                        </View>
                        <View className='action-item' onClick={() => handleQuickAction('analysis')}>
                            <View className='action-icon analysis'>
                                <Image className='action-icon-img' src={ActionAnalysisIcon} mode='aspectFit' />
                            </View>
                            <Text className='action-label'>库存分析</Text>
                        </View>
                        <View className='action-item' onClick={() => handleQuickAction('statement')}>
                            <View className='action-icon statement'>
                                <Image className='action-icon-img' src={ActionStatementIcon} mode='aspectFit' />
                            </View>
                            <Text className='action-label'>对账单</Text>
                        </View>
                    </View>

                    {/* 库存预警 */}
                    <View className='section'>
                        <View className='section-header'>
                            <View className='section-title-row'>
                                <Image className='warning-icon-img' src={WarningIcon} mode='aspectFit' />
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
                                <Image className='activity-icon-img' src={TrendUpIcon} mode='aspectFit' />
                                <Text className='section-title'>最近活动</Text>
                            </View>
                        </View>
                        {recentActivities.length > 0 ? (
                            recentActivities.map(tx => (
                                <View key={tx._id} className='activity-item'>
                                    <View className={`activity-badge ${tx.type === 'outbound' ? 'out' : 'in'}`}>
                                        <Image className='badge-icon-img' src={tx.type === 'outbound' ? ArrowOutboundIcon : ArrowInboundIcon} mode='aspectFit' />
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
                </View >
            </ScrollView >

            <QuickAddSheet
                visible={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                onSuccess={() => {
                    loadData()
                    setShowQuickAdd(false)
                    Taro.showToast({ title: '登记成功' })
                }}
            />
        </View >
    )
}
