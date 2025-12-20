import { useState, useEffect } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { transactionService, inventoryService } from '../../services/cloud'
import { InventoryItem, Currency } from '../../types'
import { OUTBOUND_OPTIONS, INBOUND_OPTIONS, CURRENCY_OPTIONS } from '../../constants'
import './index.scss'

type TransactionType = 'outbound' | 'inbound'

export default function AddTransaction() {
    const router = useRouter()
    const { itemId } = router.params

    const [loading, setLoading] = useState(false)
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [type, setType] = useState<TransactionType>('outbound')
    const [form, setForm] = useState({
        itemId: itemId || '',
        method: '',
        quantity: 1,
        amount: 0,
        discount: 0,
        currency: Currency.CNY
    })

    useEffect(() => {
        loadInventory()
    }, [])

    const loadInventory = async () => {
        try {
            const data = await inventoryService.list()
            setInventory(data)
            if (data.length > 0 && !form.itemId) {
                setForm({ ...form, itemId: data[0]._id || '' })
            }
        } catch (error) {
            console.error('加载库存失败:', error)
        }
    }

    const methodOptions = type === 'outbound' ? OUTBOUND_OPTIONS : INBOUND_OPTIONS

    const updateField = (field: string, value: string | number) => {
        setForm({ ...form, [field]: value })
    }

    const selectedItem = inventory.find(i => i._id === form.itemId)
    const finalAmount = form.amount - form.discount

    const handleSubmit = async () => {
        if (!form.itemId) {
            Taro.showToast({ title: '请选择商品', icon: 'none' })
            return
        }
        if (!form.method) {
            Taro.showToast({ title: '请选择渠道', icon: 'none' })
            return
        }
        if (form.quantity <= 0) {
            Taro.showToast({ title: '请填写数量', icon: 'none' })
            return
        }

        try {
            setLoading(true)
            await transactionService.add({
                itemId: form.itemId,
                type,
                method: form.method as any,
                quantity: form.quantity,
                amount: form.amount,
                discount: form.discount,
                finalAmount,
                currency: form.currency
            })
            Taro.showToast({ title: '添加成功', icon: 'success' })
            setTimeout(() => {
                Taro.navigateBack()
            }, 1500)
        } catch (error) {
            console.error('添加交易失败:', error)
            Taro.showToast({ title: '添加失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className='add-page'>
            {/* 类型切换 */}
            <View className='type-switch'>
                <View
                    className={`type-btn ${type === 'outbound' ? 'active' : ''}`}
                    onClick={() => { setType('outbound'); setForm({ ...form, method: '' }) }}
                >
                    <Text>出库</Text>
                </View>
                <View
                    className={`type-btn inbound ${type === 'inbound' ? 'active' : ''}`}
                    onClick={() => { setType('inbound'); setForm({ ...form, method: '' }) }}
                >
                    <Text>入库</Text>
                </View>
            </View>

            <View className='form-section'>
                <Text className='section-title'>交易信息</Text>

                <View className='form-item'>
                    <Text className='form-label'>选择商品 *</Text>
                    <Picker
                        mode='selector'
                        range={inventory.map(i => i.modelNumber)}
                        onChange={(e) => {
                            const item = inventory[Number(e.detail.value)]
                            updateField('itemId', item._id || '')
                        }}
                    >
                        <View className='form-picker'>
                            <Text>{selectedItem?.modelNumber || '请选择商品'}</Text>
                            <Text className='picker-arrow'>›</Text>
                        </View>
                    </Picker>
                </View>

                <View className='form-item'>
                    <Text className='form-label'>{type === 'outbound' ? '销售渠道' : '入库方式'} *</Text>
                    <Picker
                        mode='selector'
                        range={methodOptions.map(o => o.label)}
                        onChange={(e) => updateField('method', methodOptions[Number(e.detail.value)].value)}
                    >
                        <View className='form-picker'>
                            <Text>{form.method || '请选择'}</Text>
                            <Text className='picker-arrow'>›</Text>
                        </View>
                    </Picker>
                </View>

                <View className='form-item'>
                    <Text className='form-label'>数量 *</Text>
                    <Input
                        className='form-input'
                        type='number'
                        placeholder='1'
                        value={String(form.quantity)}
                        onInput={(e) => updateField('quantity', Number(e.detail.value))}
                    />
                </View>
            </View>

            {type === 'outbound' && (
                <View className='form-section'>
                    <Text className='section-title'>金额信息</Text>

                    <View className='form-row'>
                        <View className='form-item half'>
                            <Text className='form-label'>原价</Text>
                            <Input
                                className='form-input'
                                type='digit'
                                placeholder='0.00'
                                value={form.amount ? String(form.amount) : ''}
                                onInput={(e) => updateField('amount', Number(e.detail.value))}
                            />
                        </View>
                        <View className='form-item half'>
                            <Text className='form-label'>折扣</Text>
                            <Input
                                className='form-input'
                                type='digit'
                                placeholder='0.00'
                                value={form.discount ? String(form.discount) : ''}
                                onInput={(e) => updateField('discount', Number(e.detail.value))}
                            />
                        </View>
                    </View>

                    <View className='form-item'>
                        <Text className='form-label'>币种</Text>
                        <Picker
                            mode='selector'
                            range={CURRENCY_OPTIONS.map(o => o.label)}
                            onChange={(e) => updateField('currency', CURRENCY_OPTIONS[Number(e.detail.value)].value)}
                        >
                            <View className='form-picker'>
                                <Text>{form.currency}</Text>
                                <Text className='picker-arrow'>›</Text>
                            </View>
                        </Picker>
                    </View>

                    <View className='total-row'>
                        <Text className='total-label'>实收金额</Text>
                        <Text className='total-value'>{form.currency} {finalAmount.toFixed(2)}</Text>
                    </View>
                </View>
            )}

            <View className='form-footer'>
                <View className='btn btn-dark' onClick={handleSubmit}>
                    <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 700 }}>
                        {loading ? '保存中...' : '确认提交'}
                    </Text>
                </View>
            </View>
        </View>
    )
}
