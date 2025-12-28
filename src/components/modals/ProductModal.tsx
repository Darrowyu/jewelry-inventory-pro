import React, { useState, useEffect, useRef } from 'react'
import { Category, Warehouse, InventoryItem } from '../../types'
import { inventoryApi } from '../../services/api'

interface ProductModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    editItem?: InventoryItem | null
}

const CATEGORIES = Object.values(Category)
const WAREHOUSES = Object.values(Warehouse)

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSuccess, editItem }) => {
    const isEdit = !!editItem
    const [loading, setLoading] = useState(false)
    const [imagePreview, setImagePreview] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)
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
        if (isOpen && editItem) {
            setForm({
                modelNumber: editItem.modelNumber || '',
                category: editItem.category || Category.EAR,
                specification: editItem.specification || '',
                color: editItem.color || '',
                quantity: editItem.quantity || 0,
                warehouse: editItem.warehouse || Warehouse.SOHO,
                costPrice: editItem.costPrice || 0,
                onlinePrice: editItem.onlinePrice || 0,
                offlinePrice: editItem.offlinePrice || 0,
                image: editItem.image || ''
            })
            setImagePreview(editItem.image || '')
        } else if (isOpen && !editItem) {
            resetForm()
        }
    }, [isOpen, editItem])

    useEffect(() => {
        if (form.image && form.image.startsWith('http')) {
            setImagePreview(form.image)
        }
    }, [form.image])

    const updateField = (field: string, value: string | number) => {
        setForm({ ...form, [field]: value })
    }

    const resetForm = () => {
        setForm({
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
        setImagePreview('')
    }

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            alert('图片大小不能超过2MB')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string
            setImagePreview(dataUrl)
            updateField('image', dataUrl)
        }
        reader.readAsDataURL(file)
    }

    const handleRemoveImage = () => {
        setImagePreview('')
        updateField('image', '')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleSubmit = async () => {
        if (!form.modelNumber) {
            alert('请填写款号')
            return
        }

        try {
            setLoading(true)
            if (isEdit && editItem) {
                const itemId = editItem._id || editItem.id || ''
                // 编辑模式下不提交quantity，避免覆盖通过出入库操作修改的库存
                const { quantity, ...updateData } = form
                await inventoryApi.update(itemId, updateData)
            } else {
                await inventoryApi.add({
                    ...form,
                    priceLogs: []
                } as Omit<InventoryItem, '_id' | 'id' | 'createdAt' | 'updatedAt'>)
            }
            resetForm()
            onSuccess()
            onClose()
        } catch (error) {
            console.error(isEdit ? '更新商品失败:' : '添加商品失败:', error)
            alert(isEdit ? '更新失败' : '添加失败')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
                <div className="modal-header">
                    <h3 className="modal-title">{isEdit ? '编辑商品' : '添加商品'}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {/* 商品图片 */}
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label className="form-label">商品图片</label>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{
                                width: 100, height: 100, border: '2px dashed #E5E7EB', borderRadius: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', background: '#F9FAFB', position: 'relative', flexShrink: 0
                            }}>
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="预览" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button
                                            onClick={handleRemoveImage}
                                            style={{
                                                position: 'absolute', top: 4, right: 4, width: 20, height: 20,
                                                borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)',
                                                color: 'white', cursor: 'pointer', fontSize: 12, lineHeight: 1
                                            }}
                                        >×</button>
                                    </>
                                ) : (
                                    <span style={{ fontSize: 32, color: '#9CA3AF' }}>📷</span>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleImageFileChange}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ marginBottom: 8 }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    上传图片
                                </button>
                                <div style={{ fontSize: 12, color: '#9CA3AF' }}>支持JPG、PNG格式，不超过2MB</div>
                                <div style={{ marginTop: 8 }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="或输入图片URL"
                                        value={form.image.startsWith('data:') ? '' : form.image}
                                        onChange={e => updateField('image', e.target.value)}
                                        style={{ fontSize: 13 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">款号 *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="请输入款号"
                                value={form.modelNumber}
                                onChange={e => updateField('modelNumber', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">分类</label>
                            <select
                                className="form-select"
                                value={form.category}
                                onChange={e => updateField('category', e.target.value)}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">规格</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="请输入规格"
                                value={form.specification}
                                onChange={e => updateField('specification', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">颜色</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="请输入颜色"
                                value={form.color}
                                onChange={e => updateField('color', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{isEdit ? '当前数量' : '初始数量'}</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0"
                                value={form.quantity || ''}
                                onChange={e => updateField('quantity', Number(e.target.value))}
                                disabled={isEdit}
                            />
                            {isEdit && (
                                <span style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'block' }}>
                                    编辑模式下请通过出入库操作修改数量
                                </span>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">所属仓库</label>
                            <select
                                className="form-select"
                                value={form.warehouse}
                                onChange={e => updateField('warehouse', e.target.value)}
                            >
                                {WAREHOUSES.map(wh => (
                                    <option key={wh} value={wh}>{wh}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">成本价</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0.00"
                                value={form.costPrice || ''}
                                onChange={e => updateField('costPrice', Number(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">线上价</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0.00"
                                value={form.onlinePrice || ''}
                                onChange={e => updateField('onlinePrice', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">线下价</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="0.00"
                            value={form.offlinePrice || ''}
                            onChange={e => updateField('offlinePrice', Number(e.target.value))}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>取消</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? '保存中...' : (isEdit ? '更新商品' : '保存商品')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductModal
