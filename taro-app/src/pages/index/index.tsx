import { useState, useEffect, useCallback } from 'react'
import { View, Text, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { inventoryService } from '../../services/cloud'
import { InventoryItem } from '../../types'
import './index.scss'

export default function Index() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // 加载库存数据
  const loadInventory = useCallback(async () => {
    try {
      setLoading(true)
      const data = await inventoryService.list(searchQuery ? { keyword: searchQuery } : undefined)
      setInventory(data)
    } catch (error) {
      console.error('加载库存失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  // 计算统计数据
  const stats = {
    totalStock: inventory.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: inventory.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0)
  }

  // 点击商品
  const handleProductClick = (item: InventoryItem) => {
    Taro.navigateTo({
      url: `/pages/product/index?id=${item._id}`
    })
  }

  // 添加交易
  const handleAddTransaction = () => {
    Taro.navigateTo({
      url: '/pages/add-transaction/index'
    })
  }

  // 添加商品
  const handleAddProduct = () => {
    Taro.navigateTo({
      url: '/pages/add-product/index'
    })
  }

  return (
    <View className='container'>
      {/* 头部 */}
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
      </View>

      {/* 统计卡片 */}
      <View className='stats-row'>
        <View className='stat-card primary'>
          <Text className='stat-label' style={{ color: '#F472B6' }}>在库总量</Text>
          <View className='stat-bottom'>
            <Text className='stat-value' style={{ color: '#DB2777' }}>{stats.totalStock}</Text>
            <Text className='stat-unit' style={{ color: '#F9A8D4' }}>件</Text>
          </View>
        </View>
        <View className='stat-card secondary'>
          <Text className='stat-label' style={{ color: '#9CA3AF' }}>库存估值</Text>
          <View className='stat-bottom'>
            <Text className='stat-value-small' style={{ color: '#1F2937' }}>¥{stats.totalValue.toLocaleString()}</Text>
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
          onInput={(e) => setSearchQuery(e.detail.value)}
          onConfirm={() => loadInventory()}
        />
      </View>

      {/* 分隔线 */}
      <View className='divider'>
        <Text className='divider-text'>全部库存</Text>
        <View className='divider-line' />
      </View>

      {/* 商品列表 */}
      {loading ? (
        <View className='empty'>
          <Text className='empty-text'>加载中...</Text>
        </View>
      ) : inventory.length === 0 ? (
        <View className='empty'>
          <Text className='empty-text'>暂无库存商品</Text>
        </View>
      ) : (
        <View className='product-list'>
          {inventory.map(item => (
            <View
              key={item._id}
              className='product-card'
              onClick={() => handleProductClick(item)}
            >
              <View className='product-image'>
                <Image src={item.image} mode='aspectFill' style={{ width: '100%', height: '100%' }} />
              </View>
              <View className='product-info'>
                <View className='product-header'>
                  <Text className='product-name'>{item.modelNumber}</Text>
                  <View className='product-stock'>
                    <Text className='stock-label'>库存</Text>
                    <Text className='stock-value'>{item.quantity}</Text>
                  </View>
                </View>
                <View className='product-tags'>
                  <Text>{item.category}</Text>
                  <View className='tag-dot' />
                  <Text>{item.specification}</Text>
                </View>
                <View className='product-footer'>
                  <View className='product-location'>
                    <Text>📍</Text>
                    <Text>{item.warehouse}</Text>
                  </View>
                  <Text className='product-price'>¥{item.offlinePrice}</Text>
                </View>
              </View>
              <Text className='product-arrow'>›</Text>
            </View>
          ))}
        </View>
      )}

      {/* 浮动添加按钮 */}
      <View className='fab fab-secondary' onClick={handleAddProduct}>
        <Text className='fab-icon'>📦</Text>
      </View>
      <View className='fab' onClick={handleAddTransaction}>
        <Text className='fab-icon'>+</Text>
      </View>
    </View>
  )
}
