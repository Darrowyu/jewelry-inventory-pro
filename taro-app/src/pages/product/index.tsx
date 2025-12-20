import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { inventoryService, transactionService } from '../../services/cloud'
import { InventoryItem, TransactionRecord } from '../../types'
import './index.scss'

type DetailTab = 'info' | 'history'

export default function ProductDetail() {
    const router = useRouter()
    const { id } = router.params

    const [item, setItem] = useState<InventoryItem | null>(null)
    const [records, setRecords] = useState<TransactionRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<DetailTab>('info')

    useEffect(() => {
        if (id) {
            loadData(id)
        }
    }, [id])

    const loadData = async (itemId: string) => {
        try {
            setLoading(true)
            const [itemData, recordsData] = await Promise.all([
                inventoryService.get(itemId),
                transactionService.getByItem(itemId)
            ])
            setItem(itemData)
            setRecords(recordsData)
        } catch (error) {
            console.error('加载商品详情失败:', error)
            Taro.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    // 删除商品
    const handleDelete = () => {
        Taro.showModal({
            title: '确认删除',
            content: `确定要删除商品"${item?.modelNumber}"吗？此操作不可恢复。`,
            confirmColor: '#EF4444',
            success: async (res) => {
                if (res.confirm && id) {
                    try {
                        await inventoryService.delete(id)
                        Taro.showToast({ title: '删除成功', icon: 'success' })
                        setTimeout(() => Taro.navigateBack(), 1500)
                    } catch (error) {
                        console.error('删除失败:', error)
                        Taro.showToast({ title: '删除失败', icon: 'error' })
                    }
                }
            }
        })
    }

    // 编辑商品
    const handleEdit = () => {
        Taro.navigateTo({ url: `/pages/add-product/index?id=${id}` })
    }

    // 新增交易
    const handleAddTransaction = () => {
        Taro.navigateTo({ url: `/pages/add-transaction/index?itemId=${id}` })
    }

    if (loading || !item) {
        return (
            <View className='container'>
                <View className='empty'>
                    <Text className='empty-text'>加载中...</Text>
                </View>
            </View>
        )
    }

    return (
        <View className='detail-page'>
            {/* 商品图片 */}
            <View className='detail-image'>
                <Image src={item.image} mode='aspectFill' style={{ width: '100%', height: '100%' }} />
            </View>

            {/* 基本信息 */}
            <View className='detail-main'>
                <View className='detail-header'>
                    <View className='detail-title-area'>
                        <Text className='detail-title'>{item.modelNumber}</Text>
                        <View className='detail-tags'>
                            <View className='tag tag-gray'>
                                <Text>{item.category}</Text>
                            </View>
                            <View className='tag tag-pink'>
                                <Text>{item.warehouse} 仓</Text>
                            </View>
                        </View>
                    </View>
                    <View className='detail-stock'>
                        <Text className='stock-number'>{item.quantity}</Text>
                        <Text className='stock-label'>当前存量</Text>
                    </View>
                </View>

                {/* 价格卡片 */}
                <View className='price-row'>
                    <View className='price-card'>
                        <Text className='price-label'>进价</Text>
                        <Text className='price-value'>¥{item.costPrice}</Text>
                    </View>
                    <View className='price-card'>
                        <Text className='price-label'>线上</Text>
                        <Text className='price-value'>¥{item.onlinePrice}</Text>
                    </View>
                    <View className='price-card price-card-highlight'>
                        <Text className='price-label' style={{ color: '#F9A8D4' }}>线下</Text>
                        <Text className='price-value' style={{ color: '#DB2777' }}>¥{item.offlinePrice}</Text>
                    </View>
                </View>

                {/* Tab切换 */}
                <View className='tab-bar'>
                    <View
                        className={`tab-item ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        <Text>基本属性</Text>
                    </View>
                    <View
                        className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <Text>变动明细</Text>
                    </View>
                </View>

                {/* Tab内容 */}
                {activeTab === 'info' && (
                    <View className='info-list'>
                        <View className='info-item'>
                            <Text className='info-label'>⚙️ 规格 / 尺寸</Text>
                            <Text className='info-value'>{item.specification}</Text>
                        </View>
                        <View className='info-item'>
                            <Text className='info-label'>🎨 颜色 / 款式</Text>
                            <Text className='info-value'>{item.color}</Text>
                        </View>
                    </View>
                )}

                {activeTab === 'history' && (
                    <View className='history-list'>
                        {records.length === 0 ? (
                            <View className='empty' style={{ padding: '64px 0' }}>
                                <Text className='empty-text'>暂无变动记录</Text>
                            </View>
                        ) : (
                            records.map(rec => (
                                <View key={rec._id} className='history-item'>
                                    <View className='history-left'>
                                        <View className={`history-badge ${rec.type}`}>
                                            <Text>{rec.type === 'inbound' ? '入' : '出'}</Text>
                                        </View>
                                        <View className='history-info'>
                                            <Text className='history-method'>{rec.method}</Text>
                                            <Text className='history-date'>{rec.date}</Text>
                                        </View>
                                    </View>
                                    <View className='history-right'>
                                        <Text className={`history-qty ${rec.type}`}>
                                            {rec.type === 'inbound' ? '+' : '-'}{rec.quantity}
                                        </Text>
                                        {rec.finalAmount !== undefined && (
                                            <Text className='history-amount'>{rec.currency} {rec.finalAmount}</Text>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}
            </View>

            {/* 底部按钮 */}
            <View className='detail-footer'>
                <View className='btn btn-outline' onClick={handleDelete}>
                    <Text style={{ color: '#EF4444', fontSize: 26, fontWeight: 600 }}>删除</Text>
                </View>
                <View className='btn btn-secondary' onClick={handleEdit}>
                    <Text style={{ color: '#374151', fontSize: 26, fontWeight: 600 }}>编辑</Text>
                </View>
                <View className='btn btn-primary' onClick={handleAddTransaction}>
                    <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: 600 }}>出入库</Text>
                </View>
            </View>
        </View>
    )
}
