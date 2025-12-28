import React, { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import DashboardView from './components/views/DashboardView'
import InventoryView from './components/views/InventoryView'
import TransactionsView from './components/views/TransactionsView'
import FinanceView from './components/views/FinanceView'
import CostsView from './components/views/CostsView'
import LoginView from './components/views/LoginView'
import UsersView from './components/views/UsersView'
import './index.css'

interface CurrentUser {
    username: string
    nickname?: string
    role: string
}

const viewTitles: Record<string, string> = {
    dashboard: '概览',
    inventory: '库存管理',
    transactions: '交易记录',
    finance: '财务分析',
    costs: '成本管理',
    users: '用户管理'
}

const App: React.FC = () => {
    const [activeView, setActiveView] = useState('dashboard')
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // 检查本地登录状态
        const savedUser = localStorage.getItem('currentUser')
        if (savedUser) {
            try {
                setCurrentUser(JSON.parse(savedUser))
            } catch {
                localStorage.removeItem('currentUser')
            }
        }
        setLoading(false)
    }, [])

    const handleLogin = (user: CurrentUser) => {
        setCurrentUser(user)
        setActiveView('dashboard')
    }

    const handleLogout = () => {
        localStorage.removeItem('currentUser')
        setCurrentUser(null)
        setActiveView('dashboard')
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <span className="loading-icon">💎</span>
                    <p>加载中...</p>
                </div>
            </div>
        )
    }

    if (!currentUser) {
        return <LoginView onLogin={handleLogin} />
    }

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardView />
            case 'inventory':
                return <InventoryView />
            case 'transactions':
                return <TransactionsView />
            case 'finance':
                return <FinanceView />
            case 'costs':
                return <CostsView />
            case 'users':
                return <UsersView currentUser={currentUser} />
            default:
                return <DashboardView />
        }
    }

    return (
        <div className="app-layout">
            <Sidebar 
                activeView={activeView} 
                onViewChange={setActiveView}
                currentUser={currentUser}
                onLogout={handleLogout}
            />
            <div className="main-content">
                <Header 
                    title={viewTitles[activeView] || '库存管家'} 
                    currentUser={currentUser}
                />
                <main className="page-content">
                    {renderView()}
                </main>
            </div>
        </div>
    )
}

export default App
