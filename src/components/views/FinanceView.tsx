import React, { useState, useEffect } from 'react'
import { transactionApi, costApi } from '../../services/api'
import { COST_COLORS } from '../../config'

interface CostSummaryItem {
    name: string
    value: number
    category?: string
}

const FinanceView: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [salesByCurrency, setSalesByCurrency] = useState<Record<string, number>>({})
    const [costData, setCostData] = useState<CostSummaryItem[]>([])
    const [totalCosts, setTotalCosts] = useState(0)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [statsResult, costSummary] = await Promise.all([
                transactionApi.getStats(),
                costApi.getSummary()
            ])
            setSalesByCurrency(statsResult.salesByCurrency)
            setCostData(costSummary.byCategory)
            setTotalCosts(costSummary.total)
        } catch (error) {
            console.error('加载财务数据失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const netProfit = (salesByCurrency.CNY || 0) - totalCosts
    const profitMargin = salesByCurrency.CNY ? ((netProfit / salesByCurrency.CNY) * 100).toFixed(1) : '0'

    if (loading) {
        return <div className="loading">加载中...</div>
    }

    return (
        <div>
            {/* 盈利概览 */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-label">预估净利润</div>
                    <div className="stat-value">¥{netProfit.toLocaleString()}</div>
                    <div className="stat-change" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        利润率 {profitMargin}%
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">总销售额 (CNY)</div>
                    <div className="stat-value">¥{(salesByCurrency.CNY || 0).toLocaleString()}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">总成本</div>
                    <div className="stat-value">¥{totalCosts.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">成本占比</div>
                    <div className="stat-value">
                        {salesByCurrency.CNY ? ((totalCosts / salesByCurrency.CNY) * 100).toFixed(1) : '0'}%
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* 多币种收益 */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">多币种收益明细</h2>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {Object.entries(salesByCurrency).map(([currency, value]) => (
                                <div key={currency} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 16,
                                    background: '#F9FAFB',
                                    borderRadius: 8
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 40, height: 40,
                                            background: '#EC4899',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: 12
                                        }}>
                                            {currency}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{currency} 总收益</div>
                                            <div style={{ fontSize: 12, color: '#6B7280' }}>销售总额</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 24, fontWeight: 700 }}>
                                        {value.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 成本构成 */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">成本构成分析</h2>
                    </div>
                    <div className="card-body">
                        {costData.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-text">暂无成本数据</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {costData.map((item, index) => {
                                    const percentage = totalCosts > 0 ? (item.value / totalCosts) * 100 : 0
                                    const color = COST_COLORS[item.category || ''] || '#CBD5E1'
                                    return (
                                        <div key={index}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ fontWeight: 500 }}>{item.name}</span>
                                                <span style={{ fontWeight: 600 }}>¥{item.value.toLocaleString()}</span>
                                            </div>
                                            <div style={{
                                                height: 8,
                                                background: '#F3F4F6',
                                                borderRadius: 4,
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${percentage}%`,
                                                    height: '100%',
                                                    background: color,
                                                    borderRadius: 4,
                                                    transition: 'width 0.3s'
                                                }} />
                                            </div>
                                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                                                占比 {percentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* 总计 */}
                                <div style={{
                                    marginTop: 16,
                                    paddingTop: 16,
                                    borderTop: '1px solid #E5E7EB',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontWeight: 600, color: '#6B7280' }}>总成本</span>
                                    <span style={{ fontSize: 20, fontWeight: 700 }}>¥{totalCosts.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FinanceView
