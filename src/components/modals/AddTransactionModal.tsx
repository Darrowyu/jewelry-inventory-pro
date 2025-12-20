import React, { useState, useEffect } from 'react'
import { InventoryItem, Currency, OutboundType, InboundType, TransactionRecord, ReturnStatus } from '../../types'
import { transactionApi, inventoryApi } from '../../services/api'
import {
    OUTBOUND_OPTIONS, INBOUND_OPTIONS, CURRENCY_OPTIONS,
    RETURN_STATUS_OPTIONS, METHOD_CURRENCY_MAP, CURRENCY_SYMBOLS
} from '../../config'

interface AddTransactionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    preselectedItemId?: string
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
    isOpen, onClose, onSuccess, preselectedItemId
}) => {
    const [loading, setLoading] = useState(false)
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [outboundRecords, setOutboundRecords] = useState<TransactionRecord[]>([])
    const [type, setType] = useState<'outbound' | 'inbound'>('outbound')
    const [form, setForm] = useState({
        itemId: preselectedItemId || '',
        method: '',
        quantity: 1,
        amount: 0,
        discount: 0,
        currency: Currency.CNY,
        source: '',
        returnStatus: '' as ReturnStatus | '',
        linkedTransactionId: '',
        note: ''
    })

    useEffect(() => {
        if (isOpen) {
            loadInventory()
        }
    }, [isOpen])

    useEffect(() => {
        // 退货时加载出库记录
        if (type === 'inbound' && form.method === InboundType.RETURN && form.itemId) {
            loadOutboundRecords(form.itemId)
        }
    }, [type, form.method, form.itemId])

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

    const loadOutboundRecords = async (itemId: string) => {
        try {
            const records = await transactionApi.getByItem(itemId)
            setOutboundRecords(records.filter(r => r.type === 'outbound'))
        } catch (error) {
            console.error('加载出库记录失败:', error)
        }
    }

    const methodOptions = type === 'outbound' ? OUTBOUND_OPTIONS : INBOUND_OPTIONS
    const selectedItem = inventory.find(i => (i._id || i.id) === form.itemId)
    const finalAmount = form.amount - form.discount

    const updateField = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleMethodChange = (methodValue: string) => {
        updateField('method', methodValue)

        if (type === 'outbound') {
            const currency = METHOD_CURRENCY_MAP[methodValue as OutboundType] || Currency.CNY
            updateField('currency', currency)

            if (selectedItem) {
                if (methodValue === OutboundType.TATA_DIRECT) {
                    updateField('amount', selectedItem.offlinePrice)
                } else if (methodValue === OutboundType.RED) {
                    updateField('amount', selectedItem.onlinePrice)
                } else {
                    updateField('amount', 0)
                }
            }
        }
    }

    const handleSubmit = async () => {
        if (!form.itemId) {
            alert('请选择商品')
            return
        }
        if (!form.method) {
            alert('请选择方式')
            return
        }

        // 退货验证
        if (type === 'inbound' && form.method === InboundType.RETURN && !form.returnStatus) {
            alert('请选择退货状态')
            return
        }

        try {
            setLoading(true)
            await transactionApi.add({
                itemId: form.itemId,
                type,
                method: form.method as any,
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
            resetForm()
            onSuccess()
            onClose()
        } catch (error) {
            console.error('添加交易失败:', error)
            alert('添加失败')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setForm({
            itemId: '',
            method: '',
            quantity: 1,
            amount: 0,
            discount: 0,
            currency: Currency.CNY,
            source: '',
            returnStatus: '',
            linkedTransactionId: '',
            note: ''
        })
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
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
                                    {item.modelNumber} - {item.color} (库存:{item.quantity})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{type === 'outbound' ? '出库方式' : '入库方式'} *</label>
                        <select
                            className="form-select"
                            value={form.method}
                            onChange={e => handleMethodChange(e.target.value)}
                        >
                            <option value="">请选择</option>
                            {methodOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* 退货相关字段 */}
                    {type === 'inbound' && form.method === InboundType.RETURN && (
                        <>
                            <div className="form-group">
                                <label className="form-label">关联出库记录</label>
                                <select
                                    className="form-select"
                                    value={form.linkedTransactionId}
                                    onChange={e => updateField('linkedTransactionId', e.target.value)}
                                >
                                    <option value="">不关联（或无可关联记录）</option>
                                    {outboundRecords.map(r => (
                                        <option key={r._id || r.id} value={r._id || r.id}>
                                            {r.date} - {r.method} x{r.quantity}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">退货状态 *</label>
                                <select
                                    className="form-select"
                                    value={form.returnStatus}
                                    onChange={e => updateField('returnStatus', e.target.value)}
                                >
                                    <option value="">请选择</option>
                                    {RETURN_STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">退货来源</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="如：Shopee新加坡退货"
                                    value={form.source}
                                    onChange={e => updateField('source', e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* 采购来源 */}
                    {type === 'inbound' && form.method === InboundType.PROCUREMENT && (
                        <div className="form-group">
                            <label className="form-label">采购来源</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="如：1688、义乌市场"
                                value={form.source}
                                onChange={e => updateField('source', e.target.value)}
                            />
                        </div>
                    )}

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
                                    <label className="form-label">售价</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        value={form.amount || ''}
                                        onChange={e => updateField('amount', Number(e.target.value))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">优惠 (±)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
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
                                    {CURRENCY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                                <span style={{ color: '#9CA3AF', fontWeight: 600 }}>最终金额</span>
                                <span style={{ fontSize: 24, fontWeight: 700, color: '#EC4899' }}>
                                    {CURRENCY_SYMBOLS[form.currency]} {finalAmount.toFixed(2)}
                                </span>
                            </div>
                        </>
                    )}

                    <div className="form-group" style={{ marginTop: 16 }}>
                        <label className="form-label">备注</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="可选"
                            value={form.note}
                            onChange={e => updateField('note', e.target.value)}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>取消</button>
                    <button
                        className={`btn ${type === 'outbound' ? 'btn-primary' : 'btn-success'}`}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? '保存中...' : (type === 'outbound' ? '确认出库' : '确认入库')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddTransactionModal
