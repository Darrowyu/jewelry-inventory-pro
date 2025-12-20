import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Component } from 'react'
import './index.scss'

const tabs = [
    { pagePath: '/pages/index/index', text: '库存', type: 'inventory' },
    { pagePath: '/pages/records/index', text: '明细', type: 'records' },
    { pagePath: '/pages/finance/index', text: '财务', type: 'finance' },
    { pagePath: '/pages/profile/index', text: '我的', type: 'profile' }
]

interface TabBarState {
    selected: number
}

export default class CustomTabBar extends Component<{}, TabBarState> {
    state: TabBarState = { selected: this.getInitialSelected() }

    // 根据当前路由获取初始选中索引
    getInitialSelected(): number {
        try {
            const pages = Taro.getCurrentPages()
            if (pages.length > 0) {
                const currentPage = pages[pages.length - 1]
                const path = '/' + currentPage.route
                const index = tabs.findIndex(t => t.pagePath === path)
                if (index !== -1) return index
            }
        } catch (e) {
            console.log('TabBar getInitialSelected error:', e)
        }
        return 0
    }

    componentDidShow() {
        // 每次页面显示时同步选中状态
        this.syncSelectedByRoute()
    }

    // 根据当前路由同步选中状态
    syncSelectedByRoute = () => {
        const pages = Taro.getCurrentPages()
        if (pages.length > 0) {
            const currentPage = pages[pages.length - 1]
            const path = '/' + currentPage.route
            const index = tabs.findIndex(t => t.pagePath === path)
            if (index !== -1 && index !== this.state.selected) {
                this.setState({ selected: index })
            }
        }
    }

    // 供页面通过 getTabBar().setSelected(index) 调用
    setSelected = (index: number) => {
        if (index !== this.state.selected) {
            this.setState({ selected: index })
        }
    }

    handleTabClick = (index: number) => {
        // 切换页面前先关闭弹窗，避免闪烁
        Taro.eventCenter.trigger('hideQuickAddSheet')
        // 切换页面，让目标页面的 TabBar 实例通过 componentDidShow 自动同步状态
        if (index !== this.state.selected) {
            Taro.switchTab({ url: tabs[index].pagePath })
        }
    }

    handleAddClick = () => {
        Taro.eventCenter.trigger('showQuickAddSheet')
    }

    // 图标组件
    InventoryIcon = ({ active }: { active: boolean }) => (
        <View className={`icon-inventory ${active ? 'active' : ''}`}>
            <View className='cell' /><View className='cell' />
            <View className='cell' /><View className='cell' />
        </View>
    )

    RecordsIcon = ({ active }: { active: boolean }) => (
        <View className={`icon-records ${active ? 'active' : ''}`}>
            <View className='top' />
            <View className='body'>
                <View className='plus-v' />
                <View className='plus-h' />
            </View>
        </View>
    )

    FinanceIcon = ({ active }: { active: boolean }) => (
        <View className={`icon-finance ${active ? 'active' : ''}`}>
            <View className='bar b1' />
            <View className='bar b2' />
            <View className='bar b3' />
        </View>
    )

    ProfileIcon = ({ active }: { active: boolean }) => (
        <View className={`icon-profile ${active ? 'active' : ''}`}>
            <View className='head' />
            <View className='body-arc' />
        </View>
    )

    renderIcon = (type: string, active: boolean) => {
        const { InventoryIcon, RecordsIcon, FinanceIcon, ProfileIcon } = this
        switch (type) {
            case 'inventory': return <InventoryIcon active={active} />
            case 'records': return <RecordsIcon active={active} />
            case 'finance': return <FinanceIcon active={active} />
            case 'profile': return <ProfileIcon active={active} />
            default: return null
        }
    }

    render() {
        const { selected } = this.state

        return (
            <View className='custom-tabbar'>
                {/* 库存 */}
                <View
                    className={`tab-item ${selected === 0 ? 'active' : ''}`}
                    onClick={() => this.handleTabClick(0)}
                >
                    {this.renderIcon('inventory', selected === 0)}
                    <Text className='tab-text'>库存</Text>
                </View>

                {/* 明细 */}
                <View
                    className={`tab-item ${selected === 1 ? 'active' : ''}`}
                    onClick={() => this.handleTabClick(1)}
                >
                    {this.renderIcon('records', selected === 1)}
                    <Text className='tab-text'>明细</Text>
                </View>

                {/* 中间+按钮 */}
                <View className='center-tab' onClick={this.handleAddClick}>
                    <View className='btn-circle'>
                        <Text className='btn-plus'>+</Text>
                    </View>
                </View>

                {/* 财务 */}
                <View
                    className={`tab-item ${selected === 2 ? 'active' : ''}`}
                    onClick={() => this.handleTabClick(2)}
                >
                    {this.renderIcon('finance', selected === 2)}
                    <Text className='tab-text'>财务</Text>
                </View>

                {/* 我的 */}
                <View
                    className={`tab-item ${selected === 3 ? 'active' : ''}`}
                    onClick={() => this.handleTabClick(3)}
                >
                    {this.renderIcon('profile', selected === 3)}
                    <Text className='tab-text'>我的</Text>
                </View>
            </View>
        )
    }
}
