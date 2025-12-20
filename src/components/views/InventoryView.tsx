import React, { useState, useEffect } from 'react'
import { InventoryItem, Category, Warehouse } from '../../types'
import { inventoryApi } from '../../services/api'
import ProductModal from '../modals/ProductModal'
import ProductDetailModal from '../modals/ProductDetailModal'
import AddTransactionModal from '../modals/AddTransactionModal'

const InventoryView: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('')
    const [filterWarehouse, setFilterWarehouse] = useState<string>('')

    // 弹窗状态
    const [showProductModal, setShowProductModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showTransactionModal, setShowTransactionModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
    const [editItem, setEditItem] = useState<InventoryItem | null>(null)

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

    // 打开添加商品弹窗
    const handleAddProduct = () => {
        setEditItem(null)
        setShowProductModal(true)
    }

    // 打开编辑商品弹窗
    const handleEditProduct = (item: InventoryItem) => {
        setEditItem(item)
        setShowProductModal(true)
        setShowDetailModal(false)
    }

    // 查看商品详情
    const handleViewDetail = (item: InventoryItem) => {
        setSelectedItem(item)
        setShowDetailModal(true)
    }

    // 删除商品
    const handleDeleteProduct = async (item: InventoryItem) => {
        if (!confirm(`确定要删除商品"${item.modelNumber}"吗？此操作不可恢复。`)) {
            return
        }
        try {
            const itemId = item._id || item.id || ''
            await inventoryApi.delete(itemId)
            setShowDetailModal(false)
            loadInventory()
        } catch (error) {
            console.error('删除商品失败:', error)
            alert('删除失败')
        }
    }

    // 打开出入库弹窗
    const handleAddTransaction = (item: InventoryItem) => {
        setSelectedItem(item)
        setShowTransactionModal(true)
        setShowDetailModal(false)
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
                    <button className="btn btn-primary" onClick={handleAddProduct}>
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
                                    <tr
                                        key={item._id || item.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleViewDetail(item)}
                                    >
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
                                        <td onClick={e => e.stopPropagation()}>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleEditProduct(item)}
                                                >
                                                    编辑
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: '#FEE2E2', color: '#DC2626' }}
                                                    onClick={() => handleDeleteProduct(item)}
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 商品编辑/添加弹窗 */}
            <ProductModal
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                onSuccess={loadInventory}
                editItem={editItem}
            />

            {/* 商品详情弹窗 */}
            <ProductDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                item={selectedItem}
                onEdit={() => selectedItem && handleEditProduct(selectedItem)}
                onDelete={() => selectedItem && handleDeleteProduct(selectedItem)}
                onAddTransaction={() => selectedItem && handleAddTransaction(selectedItem)}
            />

            {/* 出入库弹窗 */}
            <AddTransactionModal
                isOpen={showTransactionModal}
                onClose={() => setShowTransactionModal(false)}
                onSuccess={loadInventory}
                preselectedItemId={selectedItem?._id || selectedItem?.id}
            />
        </div>
    )
}

export default InventoryView
