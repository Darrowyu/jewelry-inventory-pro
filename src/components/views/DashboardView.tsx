import React, { useState, useEffect, useMemo } from 'react'
import { InventoryItem, TransactionRecord, Currency } from '../../types'
import { inventoryApi, transactionApi, costApi } from '../../services/api'

interface Stats {
    totalStock: number
    totalValue: number
    totalSales: number
    totalCosts: number
    recentTransactions: TransactionRecord[]
}

const DashboardView: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [transactions, setTransactions] = useState<TransactionRecord[]>([])
    const [salesByCurrency, setSalesByCurrency] = useState<Record<string, number>>({})
    const [totalCosts, setTotalCosts] = useState(0)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [inv, trans, stats, costSummary] = await Promise.all([
                inventoryApi.list(),
                transactionApi.list({ limit: 10 }),
                transactionApi.getStats(),
                costApi.getSummary()
            ])
            setInventory(inv)
            setTransactions(trans)
            setSalesByCurrency(stats.salesByCurrency)
            setTotalCosts(costSummary.total)
        } catch (error) {
            console.error('加载数据失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const stats = useMemo(() => ({
        totalStock: inventory.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: inventory.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0),
        totalSales: salesByCurrency.CNY || 0,
        netProfit: (salesByCurrency.CNY || 0) - totalCosts
    }), [inventory, salesByCurrency, totalCosts])

    if (loading) {
        return <div className="loading">加载中...</div>
    }

    return (
        <div>
            {/* 统计卡片 */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-label">在库总量</div>
                    <div className="stat-value">{stats.totalStock} 件</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">库存估值</div>
                    <div className="stat-value">¥{stats.totalValue.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">销售总额 (CNY)</div>
                    <div className="stat-value">¥{stats.totalSales.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">预估净利润</div>
                    <div className="stat-value" style={{ color: stats.netProfit >= 0 ? '#22C55E' : '#EF4444' }}>
                        ¥{stats.netProfit.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* 多币种收益 */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <h2 className="card-title">多币种收益</h2>
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                        {Object.entries(salesByCurrency).map(([currency, value]) => (
                            <div key={currency} style={{ padding: 16, background: '#F9FAFB', borderRadius: 8 }}>
                                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{currency}</div>
                                <div style={{ fontSize: 24, fontWeight: 700 }}>{value.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 最近交易 */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">最近交易</h2>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>类型</th>
                                <th>商品ID</th>
                                <th>数量</th>
                                <th>渠道</th>
                                <th>金额</th>
                                <th>时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                                        暂无交易记录
                                    </td>
                                </tr>
                            ) : (
                                transactions.map(rec => (
                                    <tr key={rec._id}>
                                        <td>
                                            <span className={`badge ${rec.type === 'outbound' ? 'badge-pink' : 'badge-green'}`}>
                                                {rec.type === 'outbound' ? '出库' : '入库'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{rec.itemId}</td>
                                        <td>
                                            <span style={{ color: rec.type === 'outbound' ? '#EC4899' : '#22C55E', fontWeight: 600 }}>
                                                {rec.type === 'outbound' ? '-' : '+'}{rec.quantity}
                                            </span>
                                        </td>
                                        <td>{rec.method}</td>
                                        <td style={{ fontWeight: 500 }}>
                                            {rec.finalAmount !== undefined ? `${rec.currency} ${rec.finalAmount}` : '-'}
                                        </td>
                                        <td style={{ color: '#6B7280' }}>{rec.date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default DashboardView
