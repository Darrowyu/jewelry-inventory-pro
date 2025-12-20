import React, { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import DashboardView from './components/views/DashboardView'
import InventoryView from './components/views/InventoryView'
import TransactionsView from './components/views/TransactionsView'
import FinanceView from './components/views/FinanceView'
import CostsView from './components/views/CostsView'
import './index.css'

const viewTitles: Record<string, string> = {
    dashboard: '概览',
    inventory: '库存管理',
    transactions: '交易记录',
    finance: '财务分析',
    costs: '成本管理'
}

const App: React.FC = () => {
    const [activeView, setActiveView] = useState('dashboard')

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
            default:
                return <DashboardView />
        }
    }

    return (
        <div className="app-layout">
            <Sidebar activeView={activeView} onViewChange={setActiveView} />
            <div className="main-content">
                <Header title={viewTitles[activeView] || '库存管家'} />
                <main className="page-content">
                    {renderView()}
                </main>
            </div>
        </div>
    )
}

export default App
