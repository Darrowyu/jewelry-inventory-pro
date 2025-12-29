import { useState, useEffect } from 'react'
import { View, Text, Input, Picker, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { transactionService, inventoryService } from '../../services/cloud'
import { InventoryItem, Currency, OutboundType, InboundType, TransactionRecord, ReturnStatus } from '../../types'
import {
    OUTBOUND_OPTIONS, INBOUND_OPTIONS, CURRENCY_OPTIONS,
    RETURN_STATUS_OPTIONS, METHOD_CURRENCY_MAP, CURRENCY_SYMBOLS
} from '../../constants'
import './index.scss'

type TransactionType = 'outbound' | 'inbound'

export default function AddTransaction() {
    const router = useRouter()
    const { itemId } = router.params

    const [loading, setLoading] = useState(false)
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [outboundRecords, setOutboundRecords] = useState<TransactionRecord[]>([]) // 用于退货关联
    const [type, setType] = useState<TransactionType>('outbound')

    const [form, setForm] = useState({
        itemId: itemId || '',
        method: '' as any,
        quantity: 1,
        amount: 0,
        discount: 0,
        currency: Currency.CNY,
        source: '',            // 来源（退货/采购来源）
        returnStatus: '' as ReturnStatus | '', // 退货状态
        linkedTransactionId: '', // 关联出库记录ID
        note: ''
    })

    useEffect(() => {
        loadInventory()
    }, [])

    useEffect(() => {
        // 类型切换时重置method
        setForm(prev => ({
            ...prev,
            method: '',
            source: '',
            returnStatus: '',
            linkedTransactionId: ''
        }))
    }, [type])

    useEffect(() => {
        // 当选择退货时，加载该商品的出库记录
        if (type === 'inbound' && form.method === InboundType.RETURN && form.itemId) {
            loadOutboundRecords(form.itemId)
        }
    }, [type, form.method, form.itemId])

    const loadInventory = async () => {
        try {
            const data = await inventoryService.list()
            setInventory(data)
            if (data.length > 0 && !form.itemId) {
                setForm(prev => ({ ...prev, itemId: data[0]._id || '' }))
            }
        } catch (error) {
            console.error('加载库存失败:', error)
        }
    }

    const loadOutboundRecords = async (productId: string) => {
        try {
            const records = await transactionService.getByItem(productId)
            const outbound = records.filter(r => r.type === 'outbound')
            setOutboundRecords(outbound)
        } catch (error) {
            console.error('加载出库记录失败:', error)
        }
    }

    const methodOptions = type === 'outbound' ? OUTBOUND_OPTIONS : INBOUND_OPTIONS
    const selectedItem = inventory.find(i => i._id === form.itemId)

    // 计算最终金额
    const finalAmount = form.amount - form.discount

    const updateField = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    // 选择出库方式时自动设置币种和默认价格
    const handleMethodChange = (methodValue: string) => {
        updateField('method', methodValue)

        if (type === 'outbound') {
            const currency = METHOD_CURRENCY_MAP[methodValue as OutboundType] || Currency.CNY
            updateField('currency', currency)

            // 根据渠道设置默认价格
            if (selectedItem) {
                if (methodValue === OutboundType.TATA_DIRECT) {
                    updateField('amount', selectedItem.offlinePrice)
                } else if (methodValue === OutboundType.RED) {
                    updateField('amount', selectedItem.onlinePrice)
                } else {
                    updateField('amount', 0) // Shopee需手动填写
                }
            }
        }
    }

    // 选择关联出库记录时自动填充信息
    const handleLinkedRecordChange = (recordId: string) => {
        updateField('linkedTransactionId', recordId)
        const record = outboundRecords.find(r => r._id === recordId)
        if (record) {
            setForm(prev => ({
                ...prev,
                linkedTransactionId: recordId,
                amount: record.finalAmount || record.amount || 0,
                currency: record.currency || Currency.CNY,
                quantity: Math.min(prev.quantity, record.quantity) // 不超过原出库数量
            }))
        }
    }

    const handleSubmit = async () => {
        if (!form.itemId) {
            Taro.showToast({ title: '请选择商品', icon: 'none' })
            return
        }
        if (!form.method) {
            Taro.showToast({ title: '请选择方式', icon: 'none' })
            return
        }
        if (form.quantity <= 0) {
            Taro.showToast({ title: '数量必须大于0', icon: 'none' })
            return
        }

        // 出库时前端预校验库存
        if (type === 'outbound' && selectedItem) {
            if (selectedItem.quantity < form.quantity) {
                Taro.showToast({ 
                    title: `库存不足，当前${selectedItem.quantity}件`, 
                    icon: 'none' 
                })
                return
            }
        }

        // 退货验证
        if (type === 'inbound' && form.method === InboundType.RETURN) {
            if (!form.returnStatus) {
                Taro.showToast({ title: '请选择退货状态', icon: 'none' })
                return
            }
            if (form.linkedTransactionId) {
                const linkedRecord = outboundRecords.find(r => r._id === form.linkedTransactionId)
                if (linkedRecord && form.quantity > linkedRecord.quantity) {
                    Taro.showToast({ title: `退货数量不能超过原出库数量(${linkedRecord.quantity})`, icon: 'none' })
                    return
                }
            }
        }

        try {
            setLoading(true)
            await transactionService.add({
                itemId: form.itemId,
                type,
                method: form.method,
                quantity: form.quantity,
                date: new Date().toISOString().split('T')[0],
                amount: form.amount,
                discount: form.discount,
                finalAmount,
                currency: form.currency,
                source: form.source || undefined,
                returnStatus: form.returnStatus || undefined,
                linkedTransactionId: form.linkedTransactionId || undefined,
                note: form.note || undefined
            })

            Taro.showToast({ title: type === 'outbound' ? '出库成功' : '入库成功', icon: 'success' })
            setTimeout(() => Taro.navigateBack(), 1500)
        } catch (error: any) {
            console.error('保存失败:', error)
            Taro.showToast({ title: error.message || '保存失败', icon: 'none', duration: 3000 })
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className='add-page'>
            <ScrollView scrollY showScrollbar={false} className='scroll-content'>
                <View className='inner-content'>
                    {/* 类型切换 */}
                    <View className='type-tabs'>
                        <View
                            className={`type-tab ${type === 'outbound' ? 'active outbound' : ''}`}
                            onClick={() => setType('outbound')}
                        >
                            <Text>出库</Text>
                        </View>
                        <View
                            className={`type-tab ${type === 'inbound' ? 'active inbound' : ''}`}
                            onClick={() => setType('inbound')}
                        >
                            <Text>入库</Text>
                        </View>
                    </View>

                    {/* 基本信息 */}
                    <View className='form-section'>
                        <Text className='section-title'>基本信息</Text>

                        {/* 选择商品 */}
                        <View className='form-item'>
                            <Text className='form-label'>商品 *</Text>
                            <Picker
                                mode='selector'
                                range={inventory.map(i => `${i.modelNumber} - ${i.color} (库存:${i.quantity})`)}
                                onChange={(e) => updateField('itemId', inventory[Number(e.detail.value)]._id || '')}
                            >
                                <View className='form-picker'>
                                    <Text>
                                        {selectedItem
                                            ? `${selectedItem.modelNumber} - ${selectedItem.color}`
                                            : '请选择商品'}
                                    </Text>
                                    <Text className='picker-arrow'>›</Text>
                                </View>
                            </Picker>
                        </View>

                        {/* 出入库方式 */}
                        <View className='form-item'>
                            <Text className='form-label'>{type === 'outbound' ? '出库方式' : '入库方式'} *</Text>
                            <Picker
                                mode='selector'
                                range={methodOptions.map(o => o.label)}
                                onChange={(e) => handleMethodChange(methodOptions[Number(e.detail.value)].value)}
                            >
                                <View className='form-picker'>
                                    <Text>
                                        {form.method
                                            ? methodOptions.find(o => o.value === form.method)?.label
                                            : '请选择方式'}
                                    </Text>
                                    <Text className='picker-arrow'>›</Text>
                                </View>
                            </Picker>
                        </View>

                        {/* 退货：关联出库记录 */}
                        {type === 'inbound' && form.method === InboundType.RETURN && (
                            <>
                                <View className='form-item'>
                                    <Text className='form-label'>关联出库记录（可选）</Text>
                                    <Picker
                                        mode='selector'
                                        range={['不关联', ...outboundRecords.map(r =>
                                            `${r.date} - ${r.method} x${r.quantity}`
                                        )]}
                                        onChange={(e) => {
                                            const index = Number(e.detail.value)
                                            if (index === 0) {
                                                updateField('linkedTransactionId', '')
                                            } else {
                                                handleLinkedRecordChange(outboundRecords[index - 1]._id || '')
                                            }
                                        }}
                                    >
                                        <View className='form-picker'>
                                            <Text>
                                                {form.linkedTransactionId
                                                    ? outboundRecords.find(r => r._id === form.linkedTransactionId)?.date
                                                    : '选择出库记录（数据可追溯）'}
                                            </Text>
                                            <Text className='picker-arrow'>›</Text>
                                        </View>
                                    </Picker>
                                </View>

                                <View className='form-item'>
                                    <Text className='form-label'>退货状态 *</Text>
                                    <Picker
                                        mode='selector'
                                        range={RETURN_STATUS_OPTIONS.map(o => o.label)}
                                        onChange={(e) => updateField('returnStatus', RETURN_STATUS_OPTIONS[Number(e.detail.value)].value)}
                                    >
                                        <View className='form-picker'>
                                            <Text>
                                                {form.returnStatus || '请选择退货状态'}
                                            </Text>
                                            <Text className='picker-arrow'>›</Text>
                                        </View>
                                    </Picker>
                                </View>

                                <View className='form-item'>
                                    <Text className='form-label'>退货来源</Text>
                                    <Input
                                        className='form-input'
                                        placeholder='如：Shopee新加坡退货'
                                        value={form.source}
                                        onInput={(e) => updateField('source', e.detail.value)}
                                    />
                                </View>
                            </>
                        )}

                        {/* 采购：来源 */}
                        {type === 'inbound' && form.method === InboundType.PROCUREMENT && (
                            <View className='form-item'>
                                <Text className='form-label'>采购来源</Text>
                                <Input
                                    className='form-input'
                                    placeholder='如：1688、义乌市场'
                                    value={form.source}
                                    onInput={(e) => updateField('source', e.detail.value)}
                                />
                            </View>
                        )}

                        {/* 数量 */}
                        <View className='form-item'>
                            <Text className='form-label'>数量 *</Text>
                            <Input
                                className='form-input'
                                type='number'
                                placeholder='1'
                                value={String(form.quantity)}
                                onInput={(e) => updateField('quantity', Number(e.detail.value) || 1)}
                            />
                        </View>
                    </View>

                    {/* 金额信息（出库时显示） */}
                    {type === 'outbound' && (
                        <View className='form-section'>
                            <Text className='section-title'>金额信息</Text>

                            <View className='form-item'>
                                <Text className='form-label'>币种</Text>
                                <Picker
                                    mode='selector'
                                    range={CURRENCY_OPTIONS.map(o => o.label)}
                                    value={CURRENCY_OPTIONS.findIndex(o => o.value === form.currency)}
                                    onChange={(e) => updateField('currency', CURRENCY_OPTIONS[Number(e.detail.value)].value)}
                                >
                                    <View className='form-picker'>
                                        <Text>{CURRENCY_OPTIONS.find(o => o.value === form.currency)?.label}</Text>
                                        <Text className='picker-arrow'>›</Text>
                                    </View>
                                </Picker>
                            </View>

                            <View className='form-row'>
                                <View className='form-item half'>
                                    <Text className='form-label'>售价</Text>
                                    <Input
                                        className='form-input'
                                        type='digit'
                                        placeholder='0.00'
                                        value={form.amount ? String(form.amount) : ''}
                                        onInput={(e) => updateField('amount', Number(e.detail.value) || 0)}
                                    />
                                </View>
                                <View className='form-item half'>
                                    <Text className='form-label'>优惠 (±)</Text>
                                    <Input
                                        className='form-input'
                                        type='digit'
                                        placeholder='0'
                                        value={form.discount ? String(form.discount) : ''}
                                        onInput={(e) => updateField('discount', Number(e.detail.value) || 0)}
                                    />
                                </View>
                            </View>

                            <View className='amount-summary'>
                                <Text className='summary-label'>最终金额</Text>
                                <Text className='summary-value'>
                                    {CURRENCY_SYMBOLS[form.currency]} {finalAmount.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* 备注 */}
                    <View className='form-section'>
                        <View className='form-item'>
                            <Text className='form-label'>备注</Text>
                            <Input
                                className='form-input'
                                placeholder='可选'
                                value={form.note}
                                onInput={(e) => updateField('note', e.detail.value)}
                            />
                        </View>
                    </View>

                    {/* 提交按钮 */}
                    <View className='form-footer'>
                        <View
                            className={`btn ${type === 'outbound' ? 'btn-pink' : 'btn-green'}`}
                            onClick={handleSubmit}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 700 }}>
                                {loading ? '保存中...' : (type === 'outbound' ? '确认出库' : '确认入库')}
                            </Text>
                        </View>
                    </View>

                    <View style={{ height: '120px' }} />
                </View>
            </ScrollView>
        </View>
    )
}
