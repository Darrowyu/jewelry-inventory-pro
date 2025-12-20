import { useState } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { inventoryService } from '../../services/cloud'
import { Category, Warehouse } from '../../types'
import { CATEGORY_OPTIONS, WAREHOUSE_OPTIONS } from '../../constants'
import './index.scss'

export default function AddProduct() {
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        modelNumber: '',
        category: Category.EAR_STUD,
        specification: '',
        color: '',
        quantity: 0,
        warehouse: Warehouse.SOHO,
        costPrice: 0,
        onlinePrice: 0,
        offlinePrice: 0,
        image: ''
    })

    const updateField = (field: string, value: string | number) => {
        setForm({ ...form, [field]: value })
    }

    const handleSubmit = async () => {
        if (!form.modelNumber) {
            Taro.showToast({ title: '请填写款号', icon: 'none' })
            return
        }
        if (form.quantity <= 0) {
            Taro.showToast({ title: '请填写数量', icon: 'none' })
            return
        }

        try {
            setLoading(true)
            await inventoryService.add({
                ...form,
                priceLogs: []
            })
            Taro.showToast({ title: '添加成功', icon: 'success' })
            setTimeout(() => {
                Taro.navigateBack()
            }, 1500)
        } catch (error) {
            console.error('添加商品失败:', error)
            Taro.showToast({ title: '添加失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className='add-page'>
            <View className='form-section'>
                <Text className='section-title'>基本信息</Text>

                <View className='form-item'>
                    <Text className='form-label'>款号 *</Text>
                    <Input
                        className='form-input'
                        placeholder='请输入款号'
                        value={form.modelNumber}
                        onInput={(e) => updateField('modelNumber', e.detail.value)}
                    />
                </View>

                <View className='form-item'>
                    <Text className='form-label'>分类</Text>
                    <Picker
                        mode='selector'
                        range={CATEGORY_OPTIONS.map(o => o.label)}
                        onChange={(e) => updateField('category', CATEGORY_OPTIONS[Number(e.detail.value)].value)}
                    >
                        <View className='form-picker'>
                            <Text>{form.category}</Text>
                            <Text className='picker-arrow'>›</Text>
                        </View>
                    </Picker>
                </View>

                <View className='form-item'>
                    <Text className='form-label'>规格</Text>
                    <Input
                        className='form-input'
                        placeholder='请输入规格'
                        value={form.specification}
                        onInput={(e) => updateField('specification', e.detail.value)}
                    />
                </View>

                <View className='form-item'>
                    <Text className='form-label'>颜色</Text>
                    <Input
                        className='form-input'
                        placeholder='请输入颜色'
                        value={form.color}
                        onInput={(e) => updateField('color', e.detail.value)}
                    />
                </View>
            </View>

            <View className='form-section'>
                <Text className='section-title'>库存信息</Text>

                <View className='form-item'>
                    <Text className='form-label'>初始数量 *</Text>
                    <Input
                        className='form-input'
                        type='number'
                        placeholder='0'
                        value={form.quantity ? String(form.quantity) : ''}
                        onInput={(e) => updateField('quantity', Number(e.detail.value))}
                    />
                </View>

                <View className='form-item'>
                    <Text className='form-label'>所属仓库</Text>
                    <Picker
                        mode='selector'
                        range={WAREHOUSE_OPTIONS.map(o => o.label)}
                        onChange={(e) => updateField('warehouse', WAREHOUSE_OPTIONS[Number(e.detail.value)].value)}
                    >
                        <View className='form-picker'>
                            <Text>{form.warehouse}</Text>
                            <Text className='picker-arrow'>›</Text>
                        </View>
                    </Picker>
                </View>
            </View>

            <View className='form-section'>
                <Text className='section-title'>价格信息</Text>

                <View className='form-row'>
                    <View className='form-item half'>
                        <Text className='form-label'>成本价</Text>
                        <Input
                            className='form-input'
                            type='digit'
                            placeholder='0.00'
                            value={form.costPrice ? String(form.costPrice) : ''}
                            onInput={(e) => updateField('costPrice', Number(e.detail.value))}
                        />
                    </View>
                    <View className='form-item half'>
                        <Text className='form-label'>线上价</Text>
                        <Input
                            className='form-input'
                            type='digit'
                            placeholder='0.00'
                            value={form.onlinePrice ? String(form.onlinePrice) : ''}
                            onInput={(e) => updateField('onlinePrice', Number(e.detail.value))}
                        />
                    </View>
                </View>

                <View className='form-item'>
                    <Text className='form-label'>线下价</Text>
                    <Input
                        className='form-input'
                        type='digit'
                        placeholder='0.00'
                        value={form.offlinePrice ? String(form.offlinePrice) : ''}
                        onInput={(e) => updateField('offlinePrice', Number(e.detail.value))}
                    />
                </View>
            </View>

            <View className='form-footer'>
                <View className='btn btn-dark' onClick={handleSubmit}>
                    <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 700 }}>
                        {loading ? '保存中...' : '保存商品'}
                    </Text>
                </View>
            </View>
        </View>
    )
}
