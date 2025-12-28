import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Component } from 'react'
import './index.scss'

// 导入 SVG 图标
import TabHomeIcon from '../assets/icons/tab-home.svg'
import TabHomeActiveIcon from '../assets/icons/tab-home-active.svg'
import TabInventoryIcon from '../assets/icons/tab-inventory.svg'
import TabInventoryActiveIcon from '../assets/icons/tab-inventory-active.svg'
import TabRecordsIcon from '../assets/icons/tab-records.svg'
import TabRecordsActiveIcon from '../assets/icons/tab-records-active.svg'
import TabFinanceIcon from '../assets/icons/tab-finance.svg'
import TabFinanceActiveIcon from '../assets/icons/tab-finance-active.svg'
import TabProfileIcon from '../assets/icons/tab-profile.svg'
import TabProfileActiveIcon from '../assets/icons/tab-profile-active.svg'

const tabs = [
    { pagePath: '/pages/home/index', text: '首页', icon: TabHomeIcon, activeIcon: TabHomeActiveIcon },
    { pagePath: '/pages/index/index', text: '库存', icon: TabInventoryIcon, activeIcon: TabInventoryActiveIcon },
    { pagePath: '/pages/records/index', text: '明细', icon: TabRecordsIcon, activeIcon: TabRecordsActiveIcon },
    { pagePath: '/pages/finance/index', text: '财务', icon: TabFinanceIcon, activeIcon: TabFinanceActiveIcon },
    { pagePath: '/pages/profile/index', text: '我的', icon: TabProfileIcon, activeIcon: TabProfileActiveIcon }
]

interface TabBarState {
    selected: number
}

export default class CustomTabBar extends Component<{}, TabBarState> {
    state: TabBarState = { selected: this.getSelectedByRoute() }

    componentDidMount() {
        this.syncSelectedByRoute()
    }

    componentDidShow() {
        this.syncSelectedByRoute()
    }

    getSelectedByRoute(): number {
        try {
            const pages = Taro.getCurrentPages()
            if (pages.length > 0) {
                const currentPage = pages[pages.length - 1]
                const route = (currentPage as any)?.route || (currentPage as any)?.__route__
                const path = route ? (route.startsWith('/') ? route : '/' + route) : ''
                const index = tabs.findIndex(t => t.pagePath === path)
                if (index !== -1) return index
            }
        } catch (e) {
            /* ignore */
        }
        return 0
    }

    syncSelectedByRoute = () => {
        const index = this.getSelectedByRoute()
        if (index !== this.state.selected) {
            this.setState({ selected: index })
        }
    }

    setSelected = (index: number) => {
        if (index >= 0 && index < tabs.length) {
            this.setState({ selected: index })
        }
    }

    handleTabClick = (index: number) => {
        Taro.eventCenter.trigger('hideQuickAddSheet')
        if (index === this.state.selected) return
        this.setState({ selected: index })
        Taro.switchTab({ url: tabs[index].pagePath })
    }

    handleAddClick = () => {
        Taro.eventCenter.trigger('showQuickAddSheet')
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
                    {tabs.map((tab, index) => {
                        const isActive = selected === index
                        return (
                            <View
                                key={tab.pagePath}
                                className={`tab-item ${isActive ? 'active' : ''}`}
                                onClick={() => this.handleTabClick(index)}
                            >
                                <Image
                                    className='tab-icon-img'
                                    src={isActive ? tab.activeIcon : tab.icon}
                                    mode='aspectFit'
                                />
                                <Text className='tab-text'>{tab.text}</Text>
                            </View>
                        )
                    })}
                </View>
            </View>
        )
    }
}
