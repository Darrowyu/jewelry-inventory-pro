import React, { useState, useEffect } from 'react'
import { InventoryItem, Currency, OutboundType, InboundType } from '../../types'
import { transactionApi, inventoryApi } from '../../services/api'

interface AddTransactionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    preselectedItemId?: string
}

const OUTBOUND_OPTIONS = Object.values(OutboundType)
const INBOUND_OPTIONS = Object.values(InboundType)
const CURRENCIES = Object.values(Currency)

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
    isOpen, onClose, onSuccess, preselectedItemId
}) => {
    const [loading, setLoading] = useState(false)
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [type, setType] = useState<'outbound' | 'inbound'>('outbound')
    const [form, setForm] = useState({
        itemId: preselectedItemId || '',
        method: '',
        quantity: 1,
        amount: 0,
        discount: 0,
        currency: Currency.CNY
    })

    useEffect(() => {
        if (isOpen) {
            loadInventory()
        }
    }, [isOpen])

    const loadInventory = async () => {
        try {
            const data = await inventoryApi.list()
            setInventory(data)
            if (data.length > 0 && !form.itemId) {
                setForm(prev => ({ ...prev, itemId: data[0]._id || data[0].id || '' }))
            }
        } catch (error) {
            console.error('加载库存失败:', error)
        }
    }

    const methodOptions = type === 'outbound' ? OUTBOUND_OPTIONS : INBOUND_OPTIONS

    const updateField = (field: string, value: string | number) => {
        setForm({ ...form, [field]: value })
    }

    const finalAmount = form.amount - form.discount

    const handleSubmit = async () => {
        if (!form.itemId) {
            alert('请选择商品')
            return
        }
        if (!form.method) {
            alert('请选择渠道')
            return
        }

        try {
            setLoading(true)
            await transactionApi.add({
                itemId: form.itemId,
                type,
                method: form.method as any,
                quantity: form.quantity,
                amount: form.amount,
                discount: form.discount,
                finalAmount,
                currency: form.currency
            })
            setForm({
                itemId: '',
                method: '',
                quantity: 1,
                amount: 0,
                discount: 0,
                currency: Currency.CNY
            })
            onSuccess()
            onClose()
        } catch (error) {
            console.error('添加交易失败:', error)
            alert('添加失败')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                <div className="modal-header">
                    <h3 className="modal-title">新增交易</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {/* 类型切换 */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                        <button
                            className={`btn ${type === 'outbound' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1 }}
                            onClick={() => { setType('outbound'); setForm({ ...form, method: '' }) }}
                        >
                            出库
                        </button>
                        <button
                            className={`btn ${type === 'inbound' ? 'btn-success' : 'btn-secondary'}`}
                            style={{ flex: 1 }}
                            onClick={() => { setType('inbound'); setForm({ ...form, method: '' }) }}
                        >
                            入库
                        </button>
                    </div>

                    <div className="form-group">
                        <label className="form-label">选择商品 *</label>
                        <select
                            className="form-select"
                            value={form.itemId}
                            onChange={e => updateField('itemId', e.target.value)}
                        >
                            <option value="">请选择商品</option>
                            {inventory.map(item => (
                                <option key={item._id || item.id} value={item._id || item.id}>
                                    {item.modelNumber} ({item.category})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{type === 'outbound' ? '销售渠道' : '入库方式'} *</label>
                        <select
                            className="form-select"
                            value={form.method}
                            onChange={e => updateField('method', e.target.value)}
                        >
                            <option value="">请选择</option>
                            {methodOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">数量 *</label>
                        <input
                            type="number"
                            className="form-input"
                            min="1"
                            value={form.quantity}
                            onChange={e => updateField('quantity', Number(e.target.value))}
                        />
                    </div>

                    {type === 'outbound' && (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">原价</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        value={form.amount || ''}
                                        onChange={e => updateField('amount', Number(e.target.value))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">折扣</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        value={form.discount || ''}
                                        onChange={e => updateField('discount', Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">币种</label>
                                <select
                                    className="form-select"
                                    value={form.currency}
                                    onChange={e => updateField('currency', e.target.value as Currency)}
                                >
                                    {CURRENCIES.map(curr => (
                                        <option key={curr} value={curr}>{curr}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{
                                padding: 16,
                                background: '#FDF2F8',
                                borderRadius: 8,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: 16
                            }}>
                                <span style={{ color: '#9CA3AF', fontWeight: 600 }}>实收金额</span>
                                <span style={{ fontSize: 24, fontWeight: 700, color: '#EC4899' }}>
                                    {form.currency} {finalAmount.toFixed(2)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>取消</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? '保存中...' : '确认提交'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddTransactionModal
