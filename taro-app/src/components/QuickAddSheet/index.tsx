import { View, Text, Input, ScrollView, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { inventoryService, transactionService } from '../../services/cloud'
import { InventoryItem, Currency, OutboundType, InboundType } from '../../types'
import { OUTBOUND_OPTIONS, INBOUND_OPTIONS, CURRENCY_OPTIONS, METHOD_CURRENCY_MAP } from '../../constants'
import './index.scss'

interface QuickAddSheetProps {
    visible: boolean
    onClose: () => void
    onSuccess?: () => void
}

type SheetType = 'outbound' | 'inbound'

export default function QuickAddSheet({ visible, onClose, onSuccess }: QuickAddSheetProps) {
    const [type, setType] = useState<SheetType>('outbound')
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [showPicker, setShowPicker] = useState(false)
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        itemId: '',
        method: '',
        quantity: 1,
        amount: '' as string | number, // 允许空字符串以便显示placeholder
        currency: Currency.CNY
    })

    useEffect(() => {
        if (visible) {
            loadInventory()
        }
    }, [visible])

    const loadInventory = async () => {
        try {
            const data = await inventoryService.list()
            setInventory(data)
        } catch (error) {
            console.error('加载库存失败:', error)
        }
    }

    const selectedItem = inventory.find(i => i._id === form.itemId)
    const methodOptions = type === 'outbound' ? OUTBOUND_OPTIONS : INBOUND_OPTIONS

    const updateField = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleMethodSelect = (methodValue: string) => {
        updateField('method', methodValue)
        if (type === 'outbound') {
            const currency = METHOD_CURRENCY_MAP[methodValue as OutboundType] || Currency.CNY
            updateField('currency', currency)
            // 自动填充价格
            if (selectedItem) {
                if (methodValue === OutboundType.TATA_DIRECT) {
                    updateField('amount', selectedItem.offlinePrice)
                } else if (methodValue === OutboundType.RED) {
                    updateField('amount', selectedItem.onlinePrice)
                }
            }
        }
    }

    const handleSubmit = async () => {
        if (!form.itemId) {
            Taro.showToast({ title: '请选择商品', icon: 'none' })
            return
        }
        if (!form.method) {
            Taro.showToast({ title: '请选择渠道', icon: 'none' })
            return
        }

        try {
            setLoading(true)
            await transactionService.add({
                itemId: form.itemId,
                type,
                method: form.method as any,
                quantity: Number(form.quantity),
                date: new Date().toISOString().split('T')[0],
                amount: Number(form.amount),
                finalAmount: Number(form.amount),
                currency: form.currency
            })

            Taro.showToast({ title: '记录成功', icon: 'success' })
            resetForm()
            onSuccess?.()
            setTimeout(onClose, 1000)
        } catch (error) {
            console.error('保存失败:', error)
            Taro.showToast({ title: '保存失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setForm({
            itemId: '',
            method: '',
            quantity: 1,
            amount: '',
            currency: Currency.CNY
        })
    }

    const handleClose = () => {
        resetForm()
        Taro.eventCenter.trigger('hideQuickAddSheet')
        onClose()
    }

    if (!visible) return null

    return (
        <View className='sheet-overlay'>
            {/* 毛玻璃遮罩层 */}
            <View className='sheet-backdrop' onClick={handleClose} />

            <View className='sheet-container' onClick={e => e.stopPropagation()}>
                {/* 头部 */}
                <View className='sheet-header'>
                    <Text className='sheet-title'>快速登记</Text>
                    <View className='sheet-close' onClick={handleClose}>
                        <Text className='close-icon'>×</Text>
                    </View>
                </View>

                <ScrollView scrollY showScrollbar={false} className='sheet-body'>
                    {/* 类型切换 */}
                    <View className='type-switcher'>
                        <View
                            className={`type-option ${type === 'outbound' ? 'active outbound' : ''}`}
                            onClick={() => { setType('outbound'); updateField('method', '') }}
                        >
                            <Text>出库销售</Text>
                        </View>
                        <View
                            className={`type-option ${type === 'inbound' ? 'active inbound' : ''}`}
                            onClick={() => { setType('inbound'); updateField('method', '') }}
                        >
                            <Text>采购入库</Text>
                        </View>
                    </View>

                    {/* 选择款号 */}
                    <View className='form-section'>
                        <Text className='form-label'>选择款号</Text>
                        <View className='picker-trigger' onClick={() => setShowPicker(!showPicker)}>
                            <Text className={selectedItem ? 'picker-value' : 'picker-placeholder'}>
                                {selectedItem ? `${selectedItem.modelNumber} - ${selectedItem.color}` : '点击选择商品...'}
                            </Text>
                            <Text className={`picker-arrow ${showPicker ? 'up' : ''}`}>›</Text>
                        </View>
                    </View>

                    {/* 商品列表下拉 */}
                    {showPicker && (
                        <View className='item-dropdown'>
                            {inventory.map(item => (
                                <View
                                    key={item._id}
                                    className={`dropdown-item ${form.itemId === item._id ? 'selected' : ''}`}
                                    onClick={() => {
                                        updateField('itemId', item._id)
                                        setShowPicker(false)
                                    }}
                                >
                                    <View>
                                        <Text className='item-code'>{item.modelNumber}</Text>
                                        <Text className='item-desc'>{item.category} · {item.color}</Text>
                                    </View>
                                    <Text className='item-stock'>库存 {item.quantity}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* 业务渠道 */}
                    <View className='form-section'>
                        <Text className='form-label'>业务渠道</Text>
                        <View className='channel-grid'>
                            {methodOptions.map(opt => (
                                <View
                                    key={opt.value}
                                    className={`channel-btn ${form.method === opt.value ? 'active' : ''}`}
                                    onClick={() => handleMethodSelect(opt.value)}
                                >
                                    <Text>{opt.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 数量和金额 */}
                    <View className='form-row'>
                        <View className='form-col'>
                            <Text className='form-label'>数量</Text>
                            <View className='input-box'>
                                <Input
                                    className='custom-input'
                                    type='number'
                                    value={String(form.quantity)}
                                    onInput={e => updateField('quantity', Number(e.detail.value))}
                                />
                            </View>
                        </View>
                        <View className='form-col flex-2'>
                            <Text className='form-label'>单价 & 币种</Text>
                            <View className='input-box price-box'>
                                <Input
                                    className='custom-input italic'
                                    type='digit'
                                    placeholder='0'
                                    placeholderClass='italic-placeholder'
                                    value={String(form.amount)}
                                    onInput={e => updateField('amount', e.detail.value)}
                                />
                                <Picker
                                    mode='selector'
                                    range={CURRENCY_OPTIONS.map(c => c.label)}
                                    onChange={e => updateField('currency', CURRENCY_OPTIONS[Number(e.detail.value)].value)}
                                >
                                    <View className='currency-tag'>
                                        <Text>{form.currency}</Text>
                                        <Text className='arrow-down'>⌄</Text>
                                    </View>
                                </Picker>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* 底部按钮 */}
                <View className='sheet-footer'>
                    <View className='confirm-btn' onClick={handleSubmit}>
                        <Text>确认记录</Text>
                        <Text className='arrow-right'>→</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}
