import React, { useState } from 'react'
import { Category, Warehouse, InventoryItem } from '../../types'
import { inventoryApi } from '../../services/api'

interface AddProductModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const CATEGORIES = Object.values(Category)
const WAREHOUSES = Object.values(Warehouse)

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSuccess }) => {
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

    const resetForm = () => {
        setForm({
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
    }

    const handleSubmit = async () => {
        if (!form.modelNumber) {
            alert('请填写款号')
            return
        }

        try {
            setLoading(true)
            await inventoryApi.add({
                ...form,
                priceLogs: []
            } as Omit<InventoryItem, '_id' | 'id' | 'createdAt' | 'updatedAt'>)
            resetForm()
            onSuccess()
            onClose()
        } catch (error) {
            console.error('添加商品失败:', error)
            alert('添加失败')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
                <div className="modal-header">
                    <h3 className="modal-title">添加商品</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
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
                            <label className="form-label">初始数量</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0"
                                value={form.quantity || ''}
                                onChange={e => updateField('quantity', Number(e.target.value))}
                            />
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
                        {loading ? '保存中...' : '保存商品'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddProductModal
