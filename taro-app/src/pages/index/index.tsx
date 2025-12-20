import { useState, useMemo } from 'react'
import { View, Text, Image, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { inventoryService } from '../../services/cloud'
import { Product } from '../../types'
import { CATEGORY_OPTIONS } from '../../constants'
import QuickAddSheet from '../../components/QuickAddSheet'
import './index.scss'

export default function Index() {
  const [inventory, setInventory] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useDidShow(() => {
    loadInventory()
    // 同步 TabBar 选中状态
    const page = Taro.getCurrentInstance().page
    const tabBar = page?.getTabBar?.() as any
    tabBar?.setSelected?.(1)
    // 监听弹窗显示/隐藏事件
    const showListener = () => setShowQuickAdd(true)
    const hideListener = () => setShowQuickAdd(false)
    Taro.eventCenter.on('showQuickAddSheet', showListener)
    Taro.eventCenter.on('hideQuickAddSheet', hideListener)
    return () => {
      Taro.eventCenter.off('showQuickAddSheet', showListener)
      Taro.eventCenter.off('hideQuickAddSheet', hideListener)
    }
  })

  const loadInventory = async () => {
    try {
      setLoading(true)
      const list = await inventoryService.list()
      setInventory(list)
    } catch (error) {
      console.error('加载库存失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/product/index?id=${id}` })
  }

  const handleAddProduct = () => {
    Taro.navigateTo({ url: '/pages/add-product/index' })
  }

  // 计算统计数据
  const stats = useMemo(() => {
    return inventory.reduce((acc, item) => ({
      totalCount: acc.totalCount + (item.quantity || 0),
      totalValue: acc.totalValue + ((item.quantity || 0) * (item.costPrice || 0))
    }), { totalCount: 0, totalValue: 0 })
  }, [inventory])

  // 搜索过滤
  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory
    const q = searchQuery.toLowerCase()
    return inventory.filter(item =>
      item.modelNumber.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.warehouse.toLowerCase().includes(q) ||
      (item.specification && item.specification.toLowerCase().includes(q))
    )
  }, [inventory, searchQuery])

  const getCategoryLabel = (val: string) => {
    return CATEGORY_OPTIONS.find(c => c.value === val)?.label || val
  }

  return (
    <View className='page-container'>
      <ScrollView scrollY className='scroll-content'>
        <View className='inner-content'>
          {/* 顶部 Header */}
          <View className='header'>
            <View className='header-left'>
              <View className='logo'>
                <Text className='logo-icon'>📦</Text>
              </View>
              <View className='header-text'>
                <Text className='header-title'>库存管家</Text>
                <Text className='header-subtitle'>努力的小常</Text>
              </View>
            </View>
            <View className='header-right'>
              <View className='notification-btn'>
                <Text className='bell-icon'>🔔</Text>
              </View>
            </View>
          </View>

          {/* 概览卡片 */}
          <View className='overview-cards'>
            <View className='stat-card pink'>
              <Text className='stat-label'>库存总量</Text>
              <View className='stat-value-row'>
                <Text className='stat-num'>{stats.totalCount}</Text>
                <Text className='stat-unit'>件</Text>
              </View>
            </View>
            <View className='stat-card gray'>
              <Text className='stat-label'>库存估值</Text>
              <View className='stat-value-row'>
                <Text className='stat-currency'>¥</Text>
                <Text className='stat-num sm'>{stats.totalValue.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* 搜索框 */}
          <View className='search-box'>
            <Text className='search-icon'>🔍</Text>
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

          {/* 分隔标题 + 添加按钮 */}
          <View className='section-header-row'>
            <View className='section-divider'>
              <View className='line' />
              <Text className='section-title'>
                {searchQuery ? `搜索结果 (${filteredInventory.length})` : '全部库存'}
              </Text>
              <View className='line' />
            </View>
            <View className='add-product-btn' onClick={handleAddProduct}>
              <Text className='add-icon'>+</Text>
              <Text className='add-text'>添加商品</Text>
            </View>
          </View>

          {/* 库存列表 */}
          <View className='inventory-list'>
            {loading ? (
              <View className='loading-state'>
                <Text>加载中...</Text>
              </View>
            ) : filteredInventory.length > 0 ? (
              filteredInventory.map(item => (
                <View key={item._id} className='inventory-card' onClick={() => handleItemClick(item._id!)}>
                  <Image
                    className='card-img'
                    src={item.image || 'https://via.placeholder.com/150'}
                    mode='aspectFill'
                  />
                  <View className='card-info'>
                    <View className='info-main'>
                      <Text className='item-code'>{item.modelNumber}</Text>
                      <Text className='item-desc'>
                        {getCategoryLabel(item.category)}
                        {item.specification ? ` · ${item.specification}` : ''}
                      </Text>
                      <View className='location-tag'>
                        <Text className='loc-icon'>📍</Text>
                        <Text className='loc-text'>{item.warehouse}</Text>
                      </View>
                    </View>
                    <View className='info-side'>
                      <View className='stock-badge'>
                        <Text className='stock-label'>库存</Text>
                        <Text className='stock-val'>{item.quantity}</Text>
                      </View>
                      <Text className='price'>¥{item.costPrice}</Text>
                    </View>
                  </View>
                  <Text className='arrow-right'>›</Text>
                </View>
              ))
            ) : (
              <View className='empty-state'>
                <Text>{searchQuery ? '未找到匹配商品' : '暂无库存数据'}</Text>
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
          loadInventory()
          setShowQuickAdd(false)
          Taro.showToast({ title: '登记成功' })
        }}
      />
    </View>
  )
}
