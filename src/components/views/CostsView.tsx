import React, { useState, useEffect } from 'react'
import { CostItem, CostCategory } from '../../types'
import { costApi } from '../../services/api'
import { COST_COLORS, COST_CATEGORY_OPTIONS } from '../../config'

// 日期格式化函数
const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    } catch {
        return dateStr
    }
}

const CostsView: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [costs, setCosts] = useState<CostItem[]>([])
    const [showModal, setShowModal] = useState(false)
    const [newCost, setNewCost] = useState({
        name: '',
        amount: 0,
        category: CostCategory.EQUIPMENT
    })

    useEffect(() => {
        loadCosts()
    }, [])

    const loadCosts = async () => {
        try {
            setLoading(true)
            const data = await costApi.list()
            setCosts(data)
        } catch (error) {
            console.error('加载成本数据失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddCost = async () => {
        if (!newCost.name || newCost.amount <= 0) return

        try {
            await costApi.add(newCost)
            setShowModal(false)
            setNewCost({ name: '', amount: 0, category: CostCategory.EQUIPMENT })
            loadCosts()
        } catch (error) {
            console.error('添加成本失败:', error)
        }
    }

    const handleDeleteCost = async (id: string) => {
        if (!confirm('确定删除此成本项？')) return

        try {
            await costApi.delete(id)
            loadCosts()
        } catch (error) {
            console.error('删除成本失败:', error)
        }
    }

    const totalCosts = costs.reduce((sum, c) => sum + (c.amount || 0), 0)

    const costsByCategory = COST_CATEGORY_OPTIONS.map(cat => ({
        ...cat,
        total: costs.filter(c => c.category === cat.value).reduce((sum, c) => sum + (c.amount || 0), 0),
        count: costs.filter(c => c.category === cat.value).length
    }))

    return (
        <div>
            {/* 工具栏 */}
            <div className="toolbar">
                <div className="toolbar-left">
                    <div style={{ padding: '12px 20px', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                        <span style={{ color: '#6B7280', marginRight: 8 }}>总成本</span>
                        <span style={{ fontWeight: 700, fontSize: 18 }}>¥{totalCosts.toLocaleString()}</span>
                    </div>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <span>+</span>
                        <span>添加成本</span>
                    </button>
                </div>
            </div>

            {/* 分类汇总 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 24 }}>
                {costsByCategory.map(cat => (
                    <div
                        key={cat.value}
                        className="card"
                        style={{ padding: 16, textAlign: 'center' }}
                    >
                        <div style={{
                            width: 40, height: 40,
                            background: COST_COLORS[cat.value],
                            borderRadius: 8,
                            margin: '0 auto 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700
                        }}>
                            {cat.count}
                        </div>
                        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{cat.label}</div>
                        <div style={{ fontWeight: 700 }}>¥{cat.total.toLocaleString()}</div>
                    </div>
                ))}
            </div>

            {/* 成本列表 */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">成本明细</h2>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>名称</th>
                                <th>分类</th>
                                <th>金额</th>
                                <th>日期</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: 60 }}>
                                        加载中...
                                    </td>
                                </tr>
                            ) : costs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
                                        暂无成本记录
                                    </td>
                                </tr>
                            ) : (
                                costs.map(cost => (
                                    <tr key={cost._id || cost.id}>
                                        <td style={{ fontWeight: 600 }}>{cost.name}</td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: COST_COLORS[cost.category] + '20',
                                                    color: COST_COLORS[cost.category]
                                                }}
                                            >
                                                {COST_CATEGORY_OPTIONS.find(c => c.value === cost.category)?.label || cost.category}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>¥{(cost.amount || 0).toLocaleString()}</td>
                                        <td style={{ color: '#6B7280', fontSize: 13 }}>{formatDate(cost.date)}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: '#FEE2E2', color: '#DC2626' }}
                                                onClick={() => handleDeleteCost(cost._id || cost.id || '')}
                                            >
                                                删除
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 添加成本模态框 */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">添加成本</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">名称</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="请输入成本名称"
                                    value={newCost.name}
                                    onChange={e => setNewCost({ ...newCost, name: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">金额</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        value={newCost.amount || ''}
                                        onChange={e => setNewCost({ ...newCost, amount: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">分类</label>
                                    <select
                                        className="form-select"
                                        value={newCost.category}
                                        onChange={e => setNewCost({ ...newCost, category: e.target.value as CostCategory })}
                                    >
                                        {COST_CATEGORY_OPTIONS.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                            <button className="btn btn-primary" onClick={handleAddCost}>确定添加</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CostsView
