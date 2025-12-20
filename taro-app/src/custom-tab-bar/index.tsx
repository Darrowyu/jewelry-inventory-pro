import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Component } from 'react'
import './index.scss'

const tabs = [
    { pagePath: '/pages/home/index', text: '首页', type: 'home' },
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
        this.syncSelectedByRoute()
    }

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

    setSelected = (index: number) => {
        if (index !== this.state.selected) {
            this.setState({ selected: index })
        }
    }

    handleTabClick = (index: number) => {
        Taro.eventCenter.trigger('hideQuickAddSheet')
        if (index !== this.state.selected) {
            Taro.switchTab({ url: tabs[index].pagePath })
        }
    }

    handleAddClick = () => {
        Taro.eventCenter.trigger('showQuickAddSheet')
    }

    // 首页图标
    HomeIcon = ({ active }: { active: boolean }) => (
        <View className={`icon-home ${active ? 'active' : ''}`}>
            <View className='roof' />
            <View className='house' />
        </View>
    )

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
        const { HomeIcon, InventoryIcon, RecordsIcon, FinanceIcon, ProfileIcon } = this
        switch (type) {
            case 'home': return <HomeIcon active={active} />
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
            <View className='custom-tabbar-wrapper'>
                {/* 悬浮 + 按钮 */}
                <View className='fab-button' onClick={this.handleAddClick}>
                    <Text className='fab-plus'>+</Text>
                </View>

                {/* TabBar */}
                <View className='custom-tabbar'>
                    {/* 首页 */}
                    <View
                        className={`tab-item ${selected === 0 ? 'active' : ''}`}
                        onClick={() => this.handleTabClick(0)}
                    >
                        <View className={`tab-icon-bg ${selected === 0 ? 'active' : ''}`}>
                            {this.renderIcon('home', selected === 0)}
                        </View>
                        <Text className='tab-text'>首页</Text>
                    </View>

                    {/* 库存 */}
                    <View
                        className={`tab-item ${selected === 1 ? 'active' : ''}`}
                        onClick={() => this.handleTabClick(1)}
                    >
                        <View className={`tab-icon-bg ${selected === 1 ? 'active' : ''}`}>
                            {this.renderIcon('inventory', selected === 1)}
                        </View>
                        <Text className='tab-text'>库存</Text>
                    </View>

                    {/* 明细 */}
                    <View
                        className={`tab-item ${selected === 2 ? 'active' : ''}`}
                        onClick={() => this.handleTabClick(2)}
                    >
                        <View className={`tab-icon-bg ${selected === 2 ? 'active' : ''}`}>
                            {this.renderIcon('records', selected === 2)}
                        </View>
                        <Text className='tab-text'>明细</Text>
                    </View>

                    {/* 财务 */}
                    <View
                        className={`tab-item ${selected === 3 ? 'active' : ''}`}
                        onClick={() => this.handleTabClick(3)}
                    >
                        <View className={`tab-icon-bg ${selected === 3 ? 'active' : ''}`}>
                            {this.renderIcon('finance', selected === 3)}
                        </View>
                        <Text className='tab-text'>财务</Text>
                    </View>

                    {/* 我的 */}
                    <View
                        className={`tab-item ${selected === 4 ? 'active' : ''}`}
                        onClick={() => this.handleTabClick(4)}
                    >
                        <View className={`tab-icon-bg ${selected === 4 ? 'active' : ''}`}>
                            {this.renderIcon('profile', selected === 4)}
                        </View>
                        <Text className='tab-text'>我的</Text>
                    </View>
                </View>
            </View>
        )
    }
}

