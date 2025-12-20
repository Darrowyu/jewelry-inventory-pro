import React from 'react'

interface SidebarProps {
    activeView: string
    onViewChange: (view: string) => void
}

const menuItems = [
    { id: 'dashboard', label: '概览', icon: '📊' },
    { id: 'inventory', label: '库存管理', icon: '📦' },
    { id: 'transactions', label: '交易记录', icon: '📋' },
    { id: 'finance', label: '财务分析', icon: '💰' },
    { id: 'costs', label: '成本管理', icon: '📉' }
]

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">💎</div>
                    <span className="sidebar-logo-text">库存管家</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">菜单</div>
                    {menuItems.map(item => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                            onClick={() => onViewChange(item.id)}
                        >
                            <span className="nav-item-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </nav>
        </aside>
    )
}

export default Sidebar
