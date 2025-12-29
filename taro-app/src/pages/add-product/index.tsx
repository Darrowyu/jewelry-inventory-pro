import { useState, useEffect } from 'react'
import { View, Text, Input, Picker, Image, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { inventoryService } from '../../services/cloud'
import { chooseImage, uploadImage } from '../../utils/upload'
import { Category, Warehouse } from '../../types'
import { CATEGORY_OPTIONS, WAREHOUSE_OPTIONS } from '../../constants'
import './index.scss'

export default function AddProduct() {
    const router = useRouter()
    const { id } = router.params
    const isEdit = !!id

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [form, setForm] = useState({
        modelNumber: '',
        category: Category.EAR,
        specification: '',
        color: '',
        quantity: 0,
        warehouse: Warehouse.SOHO,
        costPrice: 0,
        onlinePrice: 0,
        offlinePrice: 0,
        image: ''
    })

    useEffect(() => {
        if (isEdit && id) {
            loadProduct(id)
            Taro.setNavigationBarTitle({ title: '编辑商品' })
        }
    }, [id])

    const loadProduct = async (productId: string) => {
        try {
            const data = await inventoryService.get(productId)
            setForm({
                modelNumber: data.modelNumber,
                category: data.category as Category,
                specification: data.specification,
                color: data.color,
                quantity: data.quantity,
                warehouse: data.warehouse as Warehouse,
                costPrice: data.costPrice,
                onlinePrice: data.onlinePrice,
                offlinePrice: data.offlinePrice,
                image: data.image || ''
            })
        } catch (error) {
            console.error('加载商品失败:', error)
            Taro.showToast({ title: '加载失败', icon: 'error' })
        }
    }

    const updateField = (field: string, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleUpload = async () => {
        try {
            const tempFilePaths = await chooseImage(1)
            if (tempFilePaths.length === 0) return

            setUploading(true)
            const fileID = await uploadImage(tempFilePaths[0])
            updateField('image', fileID)
            Taro.showToast({ title: '上传成功', icon: 'success' })
        } catch (error) {
            Taro.showToast({ title: '上传失败', icon: 'error' })
        } finally {
            setUploading(false)
        }
    }

    // ...handleSubmit logic remains same...
    const handleSubmit = async () => {
        if (!form.modelNumber) {
            Taro.showToast({ title: '请填写款号', icon: 'none' })
            return
        }
        if (!isEdit && form.quantity <= 0) {
            Taro.showToast({ title: '请填写数量', icon: 'none' })
            return
        }

        try {
            setLoading(true)
            if (isEdit && id) {
                await inventoryService.update(id, form)
                Taro.showToast({ title: '更新成功', icon: 'success' })
            } else {
                await inventoryService.add({
                    ...form,
                    priceLogs: []
                })
                Taro.showToast({ title: '添加成功', icon: 'success' })
            }
            setTimeout(() => {
                Taro.navigateBack()
            }, 1500)
        } catch (error) {
            console.error(isEdit ? '更新商品失败:' : '添加商品失败:', error)
            Taro.showToast({ title: isEdit ? '更新失败' : '添加失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className='add-page'>
            <ScrollView scrollY showScrollbar={false} className='scroll-content'>
                <View className='inner-content'>
                    <View className='form-section'>
                        <Text className='section-title'>商品图片</Text>
                        <View className='image-uploader' onClick={handleUpload}>
                            {form.image ? (
                                <Image src={form.image} mode='aspectFill' className='uploaded-image' />
                            ) : (
                                <View className='upload-placeholder'>
                                    <Text className='upload-icon'>📷</Text>
                                    <Text className='upload-text'>{uploading ? '上传中...' : '点击上传图片'}</Text>
                                </View>
                            )}
                        </View>
                    </View>

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
                            <Text className='form-label'>{isEdit ? '当前数量' : '初始数量 *'}</Text>
                            <Input
                                className='form-input'
                                type='number'
                                placeholder='0'
                                value={form.quantity ? String(form.quantity) : ''}
                                onInput={(e) => updateField('quantity', Number(e.detail.value))}
                                disabled={isEdit}
                            />
                            {isEdit && (
                                <Text style={{ fontSize: 22, color: '#9CA3AF', marginTop: 8 }}>
                                    编辑模式下不能直接修改数量，请通过出入库操作
                                </Text>
                            )}
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

                    <View style={{ height: '200px' }} />
                </View>
            </ScrollView>

            <View className='form-footer'>
                <View className='btn btn-dark' onClick={handleSubmit}>
                    <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 700 }}>
                        {loading ? '保存中...' : (isEdit ? '更新商品' : '保存商品')}
                    </Text>
                </View>
            </View>
        </View>
    )
}
