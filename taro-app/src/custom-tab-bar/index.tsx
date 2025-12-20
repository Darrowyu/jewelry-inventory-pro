import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

const tabs = [
    { pagePath: '/pages/index/index', text: '库存', type: 'inventory' },
    { pagePath: '/pages/records/index', text: '明细', type: 'records' },
    { pagePath: '/pages/finance/index', text: '财务', type: 'finance' },
    { pagePath: '/pages/profile/index', text: '我的', type: 'profile' }
]

export default function CustomTabBar() {
    const [selected, setSelected] = useState(0)

    useEffect(() => {
        const pages = Taro.getCurrentPages()
        if (pages.length > 0) {
            const currentPage = pages[pages.length - 1]
            const path = '/' + currentPage.route
            const index = tabs.findIndex(t => t.pagePath === path)
            if (index !== -1) setSelected(index)
        }
    }, [])

    const handleTabClick = (index: number) => {
        setSelected(index)
        Taro.switchTab({ url: tabs[index].pagePath })
    }

    const handleAddClick = () => {
        // 触发全局事件显示快速登记弹窗
        Taro.eventCenter.trigger('showQuickAddSheet')
    }

    // 图标组件
    const InventoryIcon = ({ active }: { active: boolean }) => (
        <View className={`icon-inventory ${active ? 'active' : ''}`}>
            <View className='cell' /><View className='cell' />
            <View className='cell' /><View className='cell' />
        </View>
    )

    const RecordsIcon = ({ active }: { active: boolean }) => (
        <View className={`icon-records ${active ? 'active' : ''}`}>
            <View className='top' />
            <View className='body'>
                <View className='plus-v' />
                <View className='plus-h' />
            </View>
        </View>
    )

    const FinanceIcon = ({ active }: { active: boolean }) => (
        <View className={`icon-finance ${active ? 'active' : ''}`}>
            <View className='bar b1' />
            <View className='bar b2' />
            <View className='bar b3' />
        </View>
    )

    const ProfileIcon = ({ active }: { active: boolean }) => (
        <View className={`icon-profile ${active ? 'active' : ''}`}>
            <View className='head' />
            <View className='body-arc' />
        </View>
    )

    const renderIcon = (type: string, active: boolean) => {
        switch (type) {
            case 'inventory': return <InventoryIcon active={active} />
            case 'records': return <RecordsIcon active={active} />
            case 'finance': return <FinanceIcon active={active} />
            case 'profile': return <ProfileIcon active={active} />
            default: return null
        }
    }

    return (
        <View className='custom-tabbar'>
            {/* 库存 */}
            <View
                className={`tab-item ${selected === 0 ? 'active' : ''}`}
                onClick={() => handleTabClick(0)}
            >
                {renderIcon('inventory', selected === 0)}
                <Text className='tab-text'>库存</Text>
            </View>

            {/* 明细 */}
            <View
                className={`tab-item ${selected === 1 ? 'active' : ''}`}
                onClick={() => handleTabClick(1)}
            >
                {renderIcon('records', selected === 1)}
                <Text className='tab-text'>明细</Text>
            </View>

            {/* 中间+按钮 */}
            <View className='center-tab' onClick={handleAddClick}>
                <View className='btn-circle'>
                    <Text className='btn-plus'>+</Text>
                </View>
            </View>

            {/* 财务 */}
            <View
                className={`tab-item ${selected === 2 ? 'active' : ''}`}
                onClick={() => handleTabClick(2)}
            >
                {renderIcon('finance', selected === 2)}
                <Text className='tab-text'>财务</Text>
            </View>

            {/* 我的 */}
            <View
                className={`tab-item ${selected === 3 ? 'active' : ''}`}
                onClick={() => handleTabClick(3)}
            >
                {renderIcon('profile', selected === 3)}
                <Text className='tab-text'>我的</Text>
            </View>
        </View>
    )
}
