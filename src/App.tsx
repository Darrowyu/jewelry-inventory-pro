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
import { getApiUrl } from './config/api'
import './index.css'

interface CurrentUser {
    id?: string
    username: string
    nickname?: string
    role: string
    tokenIssuedAt?: string
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

    // 验证会话有效性
    const validateSession = async (user: CurrentUser) => {
        if (!user.id || !user.tokenIssuedAt) {
            return true // 旧版本登录数据，不验证
        }

        try {
            const response = await fetch(getApiUrl('/user'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'validateSession',
                    data: {
                        userId: user.id,
                        tokenIssuedAt: user.tokenIssuedAt
                    }
                })
            })
            const result = await response.json()
            if (!result.success && result.requireRelogin) {
                alert(result.error || '会话已失效，请重新登录')
                return false
            }
            return true
        } catch (err) {
            console.error('会话验证失败:', err)
            return true // 网络错误时不强制退出
        }
    }

    useEffect(() => {
        const checkAuth = async () => {
            const savedUser = localStorage.getItem('currentUser')
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser)
                    const isValid = await validateSession(user)
                    if (isValid) {
                        setCurrentUser(user)
                    } else {
                        localStorage.removeItem('currentUser')
                    }
                } catch {
                    localStorage.removeItem('currentUser')
                }
            }
            setLoading(false)
        }
        checkAuth()
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

