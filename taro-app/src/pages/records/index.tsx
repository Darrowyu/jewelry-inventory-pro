import { useState, useMemo, useEffect } from 'react'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { transactionService, inventoryService } from '../../services/cloud'
import { TransactionRecord, Currency, InventoryItem } from '../../types'
import { formatTime } from '../../utils'
import QuickAddSheet from '../../components/QuickAddSheet'
import SearchIcon from '../../assets/icons/search.svg'
import ArrowOutboundIcon from '../../assets/icons/arrow-outbound.svg'
import ArrowInboundIcon from '../../assets/icons/arrow-inbound.svg'
import './index.scss'

type FilterType = 'ALL' | 'IN' | 'OUT'

export default function Records() {
    const router = useRouter()
    const [records, setRecords] = useState<TransactionRecord[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('ALL')
    const [currencyFilter, setCurrencyFilter] = useState<string | null>(null)
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useDidShow(() => {
        // 处理URL参数中的currency筛选
        const { currency } = router.params
        if (currency) {
            setCurrencyFilter(currency)
        }
        loadData()
        /* 同步TabBar选中状态 */
        const page = Taro.getCurrentInstance().page
        if (page) {
            const tabBar = Taro.getTabBar<any>(page)
            tabBar?.setSelected?.(2)
        }
    })

    useEffect(() => {
        const showListener = () => setShowQuickAdd(true)
        const hideListener = () => setShowQuickAdd(false)
        const currencyListener = (currency: string) => setCurrencyFilter(currency)
        Taro.eventCenter.on('showQuickAddSheet', showListener)
        Taro.eventCenter.on('hideQuickAddSheet', hideListener)
        Taro.eventCenter.on('setCurrencyFilter', currencyListener)
        return () => {
            Taro.eventCenter.off('showQuickAddSheet', showListener)
            Taro.eventCenter.off('hideQuickAddSheet', hideListener)
            Taro.eventCenter.off('setCurrencyFilter', currencyListener)
        }
    }, [])

    const loadData = async (showLoading = false) => {
        try {
            // 只在首次加载时显示loading，避免切换页面时闪烁
            if (showLoading || records.length === 0) {
                setLoading(true)
            }
            const [recordList, invList] = await Promise.all([
                transactionService.list({ limit: 100 }),
                inventoryService.list()
            ])
            setRecords(recordList)
            setInventory(invList)
        } catch (error) {
            console.error('加载记录失败:', error)
            Taro.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    // 获取商品款号
    const getModelNumber = (itemId: string) => {
        const item = inventory.find(i => i._id === itemId)
        return item?.modelNumber || itemId.slice(-8) // 如果找不到，显示ID后8位
    }

    // 过滤和搜索
    const filteredRecords = useMemo(() => {
        return records.filter(item => {
            // 类型过滤
            if (filter === 'IN' && item.type !== 'inbound') return false
            if (filter === 'OUT' && item.type !== 'outbound') return false
            // 币种过滤
            if (currencyFilter && item.currency !== currencyFilter) return false
            // 搜索过滤
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const modelNum = getModelNumber(item.itemId).toLowerCase()
                const method = (item.method || '').toLowerCase()
                return modelNum.includes(q) || method.includes(q)
            }
            return true
        })
    }, [records, filter, currencyFilter, searchQuery, inventory])

    const clearCurrencyFilter = () => {
        setCurrencyFilter(null)
    }

    const handleFilterChange = (type: FilterType) => {
        setFilter(type)
    }

    const getIcon = (type: string) => {
        return type === 'inbound' ? ArrowInboundIcon : ArrowOutboundIcon
    }

    const getFormatCurrency = (amount: number, currency?: Currency) => {
        return `${currency || 'CNY'} ${amount}`
    }

    return (
        <View className='page-container'>
            <ScrollView scrollY showScrollbar={false} className='scroll-content'>
                <View className='inner-content'>
                    {/* 搜索框 */}
                    <View className='search-box'>
                        <Image className='search-icon-img' src={SearchIcon} mode='aspectFit' />
                        <Input
                            className='search-input'
                            placeholder='搜索款号、品类...'
                            value={searchQuery}
                            onInput={e => setSearchQuery(e.detail.value)}
                        />
                        {searchQuery && (
                            <Text className='clear-btn' onClick={() => setSearchQuery('')}>×</Text>
                        )}
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
                        {currencyFilter && (
                            <View className='currency-tag' onClick={clearCurrencyFilter}>
                                <Text>{currencyFilter}</Text>
                                <Text className='close'>×</Text>
                            </View>
                        )}
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
                                        <Image className='type-icon-img' src={getIcon(item.type)} mode='aspectFit' />
                                    </View>

                                    {/* 中间信息 */}
                                    <View className='info-col'>
                                        <Text className='item-code'>{getModelNumber(item.itemId)}</Text>
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
                            <View className='empty-state'>
                                <Text>{searchQuery ? '未找到匹配记录' : '暂无记录'}</Text>
                            </View>
                        )}
                    </View>

                    <View style={{ height: '120px' }} />
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
