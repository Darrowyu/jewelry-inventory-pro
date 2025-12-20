import React, { useState, useEffect } from 'react'
import { InventoryItem, Category, Warehouse } from '../../types'
import { inventoryApi } from '../../services/api'
import AddProductModal from '../modals/AddProductModal'

const InventoryView: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('')
    const [filterWarehouse, setFilterWarehouse] = useState<string>('')
    const [showAddModal, setShowAddModal] = useState(false)

    useEffect(() => {
        loadInventory()
    }, [])

    const loadInventory = async () => {
        try {
            setLoading(true)
            const data = await inventoryApi.list()
            setInventory(data)
        } catch (error) {
            console.error('加载库存失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredInventory = inventory.filter(item => {
        const matchSearch = !searchQuery ||
            item.modelNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.specification.toLowerCase().includes(searchQuery.toLowerCase())
        const matchCategory = !filterCategory || item.category === filterCategory
        const matchWarehouse = !filterWarehouse || item.warehouse === filterWarehouse
        return matchSearch && matchCategory && matchWarehouse
    })

    const stats = {
        total: filteredInventory.length,
        totalStock: filteredInventory.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: filteredInventory.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0),
        lowStock: filteredInventory.filter(item => item.quantity < 5).length
    }

    return (
        <div>
            {/* 工具栏 */}
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="搜索款号、规格..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-select"
                        style={{ width: 140 }}
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="">全部分类</option>
                        {Object.values(Category).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select
                        className="form-select"
                        style={{ width: 140 }}
                        value={filterWarehouse}
                        onChange={(e) => setFilterWarehouse(e.target.value)}
                    >
                        <option value="">全部仓库</option>
                        {Object.values(Warehouse).map(wh => (
                            <option key={wh} value={wh}>{wh}</option>
                        ))}
                    </select>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <span>+</span>
                        <span>添加商品</span>
                    </button>
                </div>
            </div>

            {/* 统计摘要 */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                <div style={{ padding: '12px 20px', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <span style={{ color: '#6B7280', marginRight: 8 }}>共</span>
                    <span style={{ fontWeight: 700, fontSize: 18 }}>{stats.total}</span>
                    <span style={{ color: '#6B7280', marginLeft: 4 }}>款</span>
                </div>
                <div style={{ padding: '12px 20px', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <span style={{ color: '#6B7280', marginRight: 8 }}>总库存</span>
                    <span style={{ fontWeight: 700, fontSize: 18 }}>{stats.totalStock}</span>
                    <span style={{ color: '#6B7280', marginLeft: 4 }}>件</span>
                </div>
                <div style={{ padding: '12px 20px', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <span style={{ color: '#6B7280', marginRight: 8 }}>库存估值</span>
                    <span style={{ fontWeight: 700, fontSize: 18 }}>¥{stats.totalValue.toLocaleString()}</span>
                </div>
                {stats.lowStock > 0 && (
                    <div style={{ padding: '12px 20px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA' }}>
                        <span style={{ color: '#DC2626', marginRight: 8 }}>库存预警</span>
                        <span style={{ fontWeight: 700, fontSize: 18, color: '#DC2626' }}>{stats.lowStock}</span>
                        <span style={{ color: '#DC2626', marginLeft: 4 }}>款</span>
                    </div>
                )}
            </div>

            {/* 库存表格 */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>图片</th>
                                <th>款号</th>
                                <th>分类</th>
                                <th>规格</th>
                                <th>颜色</th>
                                <th>仓库</th>
                                <th>库存</th>
                                <th>成本价</th>
                                <th>线上价</th>
                                <th>线下价</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: 'center', padding: 60 }}>
                                        加载中...
                                    </td>
                                </tr>
                            ) : filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
                                        暂无库存商品
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map(item => (
                                    <tr key={item._id || item.id}>
                                        <td>
                                            <img src={item.image} alt="" className="table-image" />
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{item.modelNumber}</td>
                                        <td>
                                            <span className="badge badge-gray">{item.category}</span>
                                        </td>
                                        <td>{item.specification}</td>
                                        <td>{item.color}</td>
                                        <td>
                                            <span className="badge badge-pink">{item.warehouse}</span>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 700,
                                                color: item.quantity < 5 ? '#DC2626' : item.quantity < 10 ? '#F59E0B' : '#111827'
                                            }}>
                                                {item.quantity}
                                            </span>
                                        </td>
                                        <td>¥{item.costPrice}</td>
                                        <td>¥{item.onlinePrice}</td>
                                        <td style={{ fontWeight: 600, color: '#EC4899' }}>¥{item.offlinePrice}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn btn-secondary btn-sm">编辑</button>
                                                <button className="btn btn-sm" style={{ background: '#FEE2E2', color: '#DC2626' }}>删除</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddProductModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={loadInventory}
            />
        </div>
    )
}

export default InventoryView
