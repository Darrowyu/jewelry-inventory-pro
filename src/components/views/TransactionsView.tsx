import React, { useState, useEffect } from 'react'
import { TransactionRecord, InventoryItem } from '../../types'
import { transactionApi, inventoryApi } from '../../services/api'
import AddTransactionModal from '../modals/AddTransactionModal'

type FilterType = 'all' | 'inbound' | 'outbound'

const TransactionsView: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [records, setRecords] = useState<TransactionRecord[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [filterType, setFilterType] = useState<FilterType>('all')
    const [showAddModal, setShowAddModal] = useState(false)

    useEffect(() => {
        loadData()
    }, [filterType])

    const loadData = async () => {
        try {
            setLoading(true)
            const [recordsData, inventoryData] = await Promise.all([
                transactionApi.list(filterType !== 'all' ? { type: filterType } : undefined),
                inventoryApi.list()
            ])
            setRecords(recordsData)
            setInventory(inventoryData)
        } catch (error) {
            console.error('加载数据失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const getItemName = (itemId: string) => {
        const item = inventory.find(i => (i._id || i.id) === itemId)
        return item?.modelNumber || itemId
    }

    const stats = {
        total: records.length,
        inbound: records.filter(r => r.type === 'inbound').length,
        outbound: records.filter(r => r.type === 'outbound').length,
        totalAmount: records
            .filter(r => r.type === 'outbound' && r.finalAmount && r.currency === 'CNY')
            .reduce((sum, r) => sum + (r.finalAmount || 0), 0)
    }

    return (
        <div>
            {/* 工具栏 */}
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                        >
                            全部 ({stats.total})
                        </button>
                        <button
                            className={`filter-tab ${filterType === 'inbound' ? 'active-green' : ''}`}
                            onClick={() => setFilterType('inbound')}
                        >
                            入库 ({stats.inbound})
                        </button>
                        <button
                            className={`filter-tab ${filterType === 'outbound' ? 'active' : ''}`}
                            onClick={() => setFilterType('outbound')}
                        >
                            出库 ({stats.outbound})
                        </button>
                    </div>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <span>+</span>
                        <span>新增交易</span>
                    </button>
                </div>
            </div>

            {/* 统计摘要 */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                <div style={{ padding: '12px 20px', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <span style={{ color: '#6B7280', marginRight: 8 }}>总销售额(CNY)</span>
                    <span style={{ fontWeight: 700, fontSize: 18 }}>¥{stats.totalAmount.toLocaleString()}</span>
                </div>
            </div>

            {/* 交易表格 */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>类型</th>
                                <th>商品</th>
                                <th>渠道</th>
                                <th>数量</th>
                                <th>原价</th>
                                <th>折扣</th>
                                <th>实收</th>
                                <th>币种</th>
                                <th>时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: 60 }}>
                                        加载中...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
                                        暂无交易记录
                                    </td>
                                </tr>
                            ) : (
                                records.map(rec => (
                                    <tr key={rec._id || rec.id}>
                                        <td>
                                            <span className={`badge ${rec.type === 'outbound' ? 'badge-pink' : 'badge-green'}`}>
                                                {rec.type === 'outbound' ? '出库' : '入库'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{getItemName(rec.itemId)}</td>
                                        <td>
                                            <span className="badge badge-gray">{rec.method}</span>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 700,
                                                color: rec.type === 'outbound' ? '#EC4899' : '#22C55E'
                                            }}>
                                                {rec.type === 'outbound' ? '-' : '+'}{rec.quantity}
                                            </span>
                                        </td>
                                        <td>{rec.amount !== undefined ? `${rec.amount}` : '-'}</td>
                                        <td style={{ color: rec.discount ? '#F59E0B' : '#9CA3AF' }}>
                                            {rec.discount ? `-${rec.discount}` : '-'}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>
                                            {rec.finalAmount !== undefined ? rec.finalAmount : '-'}
                                        </td>
                                        <td>
                                            <span className="badge badge-gray">{rec.currency || '-'}</span>
                                        </td>
                                        <td style={{ color: '#6B7280', fontSize: 13 }}>{rec.date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddTransactionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={loadData}
            />
        </div>
    )
}

export default TransactionsView
