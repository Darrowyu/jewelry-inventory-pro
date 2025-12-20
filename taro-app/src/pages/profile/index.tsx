import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Profile() {

    // 处理点击事件
    const handleMenuClick = (menu: string) => {
        Taro.showToast({ title: `即将开放: ${menu}`, icon: 'none' })
    }

    const handleSync = () => {
        Taro.showLoading({ title: '同步中...' })
        setTimeout(() => {
            Taro.hideLoading()
            Taro.showToast({ title: '同步成功', icon: 'success' })
        }, 1500)
    }

    return (
        <View className='profile-page'>
            {/* 顶部标题 */}
            <View className='page-header'>
                <Text className='header-title'>个人中心</Text>
                <View className='header-line' />
            </View>

            {/* 个人信息卡片 */}
            <View className='user-card'>
                <View className='card-top'>
                    <View className='avatar'>
                        <Text className='avatar-icon'>👤</Text>
                    </View>
                    <View className='user-info'>
                        <Text className='username'>努力的小常</Text>
                        <View className='pro-tag'>
                            <Text className='tag-text'>PRO 专业版</Text>
                        </View>
                    </View>
                    {/* 装饰性背景图 */}
                    <View className='bg-decoration'>
                        <Text className='star-icon'>✨</Text>
                    </View>
                </View>

                <View className='card-divider' />

                <View className='card-bottom'>
                    <View className='info-col'>
                        <Text className='label'>加入时间</Text>
                        <Text className='value'>2024-03-01</Text>
                    </View>
                    <View className='info-col align-right'>
                        <Text className='label'>数据同步</Text>
                        <View className='status-row'>
                            <Text className='status-icon'>✓</Text>
                            <Text className='value'>已加密</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* 业务工具 */}
            <View className='section'>
                <Text className='section-title'>业务工具</Text>
                <View className='tools-grid'>
                    <View className='tool-item' onClick={() => handleMenuClick('仓库管理')}>
                        <View className='tool-icon-bg'>
                            <Text className='tool-icon'>🏢</Text>
                        </View>
                        <Text className='tool-name'>仓库管理</Text>
                    </View>
                    <View className='tool-item' onClick={() => handleMenuClick('品类设置')}>
                        <View className='tool-icon-bg'>
                            <Text className='tool-icon'>🏷️</Text>
                        </View>
                        <Text className='tool-name'>品类设置</Text>
                    </View>
                    <View className='tool-item' onClick={() => handleMenuClick('导出报表')}>
                        <View className='tool-icon-bg'>
                            <Text className='tool-icon'>📊</Text>
                        </View>
                        <Text className='tool-name'>导出报表</Text>
                    </View>
                </View>
            </View>

            {/* 系统设置 */}
            <View className='section'>
                <Text className='section-title'>系统设置</Text>
                <View className='settings-list'>
                    <View className='setting-item' onClick={() => handleMenuClick('汇率设置')}>
                        <View className='item-left'>
                            <Text className='item-icon'>🌐</Text>
                            <Text className='item-name'>汇率与币种设置</Text>
                        </View>
                        <View className='item-right'>
                            <Text className='item-desc'>CNY / SGD / TWD</Text>
                            <Text className='arrow'>›</Text>
                        </View>
                    </View>

                    <View className='setting-item' onClick={handleSync}>
                        <View className='item-left'>
                            <Text className='item-icon'>🔄</Text>
                            <Text className='item-name'>手动同步云端数据</Text>
                        </View>
                        <View className='item-right'>
                            <Text className='arrow'>›</Text>
                        </View>
                    </View>

                    <View className='setting-item' onClick={() => handleMenuClick('隐私协议')}>
                        <View className='item-left'>
                            <Text className='item-icon'>🛡️</Text>
                            <Text className='item-name'>数据安全与隐私协议</Text>
                        </View>
                        <View className='item-right'>
                            <Text className='arrow'>›</Text>
                        </View>
                    </View>

                    <View className='setting-item' onClick={() => handleMenuClick('帮助反馈')}>
                        <View className='item-left'>
                            <Text className='item-icon'>❓</Text>
                            <Text className='item-name'>使用帮助与反馈</Text>
                        </View>
                        <View className='item-right'>
                            <Text className='arrow'>›</Text>
                        </View>
                    </View>

                    <View className='setting-item last' onClick={() => handleMenuClick('推荐')}>
                        <View className='item-left'>
                            <Text className='item-icon'>🔗</Text>
                            <Text className='item-name'>推荐给同行</Text>
                        </View>
                        <View className='item-right'>
                            <Text className='arrow'>›</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* 底部按钮 */}
            <View className='logout-btn'>
                <Text className='logout-icon'>↪</Text>
                <Text className='logout-text'>退出登录</Text>
            </View>

            <View className='version-info'>
                <Text>JEWELRY INVENTORY PRO V2.1.0</Text>
            </View>
        </View>
    )
}
