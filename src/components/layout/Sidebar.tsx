import React from 'react'
import { DiamondIcon, DashboardIcon, InventoryIcon, TransactionsIcon, FinanceIcon, CostsIcon, UsersIcon, LogoutIcon } from '../Icons'

interface CurrentUser {
    username: string
    nickname?: string
    role: string
}

interface SidebarProps {
    activeView: string
    onViewChange: (view: string) => void
    currentUser?: CurrentUser
    onLogout?: () => void
}

const menuItems = [
    { id: 'dashboard', label: '概览', Icon: DashboardIcon },
    { id: 'inventory', label: '库存管理', Icon: InventoryIcon },
    { id: 'transactions', label: '交易记录', Icon: TransactionsIcon },
    { id: 'finance', label: '财务分析', Icon: FinanceIcon },
    { id: 'costs', label: '成本管理', Icon: CostsIcon }
]

const adminMenuItems = [
    { id: 'users', label: '用户管理', Icon: UsersIcon }
]

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, currentUser, onLogout }) => {
    const isAdmin = currentUser?.role === 'admin'

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <DiamondIcon size={20} color="white" />
                    </div>
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
                            <span className="nav-item-icon">
                                <item.Icon size={20} color={activeView === item.id ? 'white' : '#9CA3AF'} />
                            </span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                {isAdmin && (
                    <div className="nav-section">
                        <div className="nav-section-title">管理</div>
                        {adminMenuItems.map(item => (
                            <div
                                key={item.id}
                                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                                onClick={() => onViewChange(item.id)}
                            >
                                <span className="nav-item-icon">
                                    <item.Icon size={20} color={activeView === item.id ? 'white' : '#9CA3AF'} />
                                </span>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </nav>

            {currentUser && (
                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {(currentUser.nickname || currentUser.username).charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <div className="user-name">{currentUser.nickname || currentUser.username}</div>
                            <div className="user-role">{isAdmin ? '管理员' : '用户'}</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={onLogout} title="退出登录">
                        <LogoutIcon size={16} color="#9CA3AF" />
                    </button>
                </div>
            )}
        </aside>
    )
}

export default Sidebar
