import React, { useState, useEffect } from 'react'
import { InventoryItem, TransactionRecord } from '../../types'
import { transactionApi } from '../../services/api'

interface ProductDetailModalProps {
    isOpen: boolean
    onClose: () => void
    item: InventoryItem | null
    onEdit: () => void
    onDelete: () => void
    onAddTransaction: () => void
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
    isOpen, onClose, item, onEdit, onDelete, onAddTransaction
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'history'>('info')
    const [records, setRecords] = useState<TransactionRecord[]>([])
    const [loadingRecords, setLoadingRecords] = useState(false)

    useEffect(() => {
        if (isOpen && item && activeTab === 'history') {
            loadRecords()
        }
    }, [isOpen, item, activeTab])

    const loadRecords = async () => {
        if (!item) return
        try {
            setLoadingRecords(true)
            const itemId = item._id || item.id || ''
            const data = await transactionApi.getByItem(itemId)
            setRecords(data)
        } catch (error) {
            console.error('加载记录失败:', error)
        } finally {
            setLoadingRecords(false)
        }
    }

    if (!isOpen || !item) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                <div className="modal-header">
                    <h3 className="modal-title">商品详情</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body" style={{ padding: 0 }}>
                    {/* 商品基本信息卡片 */}
                    <div style={{ padding: 24, background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', gap: 24 }}>
                            <div style={{
                                width: 120, height: 120, background: '#E5E7EB', borderRadius: 12,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', flexShrink: 0
                            }}>
                                {item.image ? (
                                    <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: 40, color: '#9CA3AF' }}>📦</span>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
                                            {item.modelNumber}
                                        </h2>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                            <span className="badge badge-gray">{item.category}</span>
                                            <span className="badge badge-pink">{item.warehouse} 仓</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 32, fontWeight: 800, color: '#EC4899' }}>
                                            {item.quantity}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>当前库存</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                                    <div>
                                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>成本价</span>
                                        <div style={{ fontWeight: 600 }}>¥{item.costPrice}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>线上价</span>
                                        <div style={{ fontWeight: 600 }}>¥{item.onlinePrice}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>线下价</span>
                                        <div style={{ fontWeight: 700, color: '#EC4899' }}>¥{item.offlinePrice}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab 切换 */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
                        <button
                            style={{
                                flex: 1, padding: '12px 0', border: 'none', background: 'none',
                                fontWeight: 600, cursor: 'pointer',
                                color: activeTab === 'info' ? '#EC4899' : '#9CA3AF',
                                borderBottom: activeTab === 'info' ? '2px solid #EC4899' : 'none'
                            }}
                            onClick={() => setActiveTab('info')}
                        >
                            基本属性
                        </button>
                        <button
                            style={{
                                flex: 1, padding: '12px 0', border: 'none', background: 'none',
                                fontWeight: 600, cursor: 'pointer',
                                color: activeTab === 'history' ? '#EC4899' : '#9CA3AF',
                                borderBottom: activeTab === 'history' ? '2px solid #EC4899' : 'none'
                            }}
                            onClick={() => setActiveTab('history')}
                        >
                            变动明细
                        </button>
                    </div>

                    {/* Tab 内容 */}
                    <div style={{ padding: 24, maxHeight: 300, overflowY: 'auto' }}>
                        {activeTab === 'info' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: 8 }}>
                                    <span style={{ color: '#6B7280' }}>规格 / 尺寸</span>
                                    <span style={{ fontWeight: 600 }}>{item.specification || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: 8 }}>
                                    <span style={{ color: '#6B7280' }}>颜色 / 款式</span>
                                    <span style={{ fontWeight: 600 }}>{item.color || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: 8 }}>
                                    <span style={{ color: '#6B7280' }}>库存估值</span>
                                    <span style={{ fontWeight: 600 }}>¥{(item.quantity * item.costPrice).toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div>
                                {loadingRecords ? (
                                    <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>加载中...</div>
                                ) : records.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>暂无变动记录</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {records.map(rec => (
                                            <div key={rec._id || rec.id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '12px 16px', background: '#F9FAFB', borderRadius: 8
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span style={{
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 12, fontWeight: 700,
                                                        background: rec.type === 'inbound' ? '#ECFDF5' : '#FDF2F8',
                                                        color: rec.type === 'inbound' ? '#16A34A' : '#DB2777'
                                                    }}>
                                                        {rec.type === 'inbound' ? '入' : '出'}
                                                    </span>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{rec.method}</div>
                                                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{rec.date}</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{
                                                        fontWeight: 700,
                                                        color: rec.type === 'inbound' ? '#16A34A' : '#DB2777'
                                                    }}>
                                                        {rec.type === 'inbound' ? '+' : '-'}{rec.quantity}
                                                    </div>
                                                    {rec.finalAmount !== undefined && (
                                                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                                                            {rec.currency} {rec.finalAmount}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', gap: 12 }}>
                    <button
                        className="btn"
                        style={{ background: '#FEE2E2', color: '#DC2626' }}
                        onClick={onDelete}
                    >
                        删除
                    </button>
                    <button className="btn btn-secondary" onClick={onEdit}>
                        编辑
                    </button>
                    <button className="btn btn-primary" onClick={onAddTransaction}>
                        出入库
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductDetailModal
