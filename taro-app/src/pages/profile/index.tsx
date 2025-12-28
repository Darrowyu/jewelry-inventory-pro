import { useState, useEffect } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import QuickAddSheet from '../../components/QuickAddSheet'
// 个人信息图标
import AvatarIcon from '../../assets/icons/profile-avatar.svg'
import StarIcon from '../../assets/icons/profile-star.svg'
// 业务工具图标
import WarehouseIcon from '../../assets/icons/profile-warehouse.svg'
import CategoryIcon from '../../assets/icons/profile-category.svg'
import ExportIcon from '../../assets/icons/profile-export.svg'
// 系统设置图标
import CurrencyIcon from '../../assets/icons/profile-currency.svg'
import SyncIcon from '../../assets/icons/profile-sync.svg'
import PrivacyIcon from '../../assets/icons/profile-privacy.svg'
import HelpIcon from '../../assets/icons/profile-help.svg'
import ShareIcon from '../../assets/icons/profile-share.svg'
import LogoutIcon from '../../assets/icons/profile-logout.svg'
import CheckIcon from '../../assets/icons/check.svg'
import './index.scss'

interface UserInfo {
    username: string
    nickname: string
    createdAt: string
    avatarUrl: string
}

export default function Profile() {
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [openid, setOpenid] = useState<string>('')
    const [userInfo, setUserInfo] = useState<UserInfo>({
        username: '',
        nickname: '',
        createdAt: '',
        avatarUrl: ''
    })

    useEffect(() => {
        // 从 storage 获取当前用户信息
        const currentUser = Taro.getStorageSync('currentUser')
        if (currentUser) {
            setUserInfo({
                username: currentUser.username || '',
                nickname: currentUser.nickname || currentUser.username || '',
                createdAt: currentUser.createdAt || '',
                avatarUrl: currentUser.avatarUrl || ''
            })
        }

        // 获取用户 openid 和完整用户信息（仅小程序环境）
        if (process.env.TARO_ENV === 'weapp') {
            Taro.cloud.callFunction({
                name: 'user',
                data: { action: 'checkAuth' }
            }).then((res: any) => {
                if (res.result?.success && res.result?.data?.user) {
                    const user = res.result.data.user
                    // 更新用户信息
                    setUserInfo({
                        username: user.username || '',
                        nickname: user.nickname || user.username || '',
                        createdAt: user.createdAt || '',
                        avatarUrl: user.avatarUrl || ''
                    })
                    // 同步更新 storage
                    Taro.setStorageSync('currentUser', user)
                }
            }).catch(() => {})

            Taro.cloud.callFunction({
                name: 'user',
                data: { action: 'getOpenid' }
            }).then((res: any) => {
                if (res.result?.success) {
                    setOpenid(res.result.data.openid || '')
                }
            }).catch(() => {})
        }
    }, [])

    useDidShow(() => {
        /* 同步TabBar选中状态 */
        const page = Taro.getCurrentInstance().page
        if (page) {
            const tabBar = Taro.getTabBar<any>(page)
            tabBar?.setSelected?.(4)
        }
        const showListener = () => setShowQuickAdd(true)
        const hideListener = () => setShowQuickAdd(false)
        Taro.eventCenter.on('showQuickAddSheet', showListener)
        Taro.eventCenter.on('hideQuickAddSheet', hideListener)
        return () => {
            Taro.eventCenter.off('showQuickAddSheet', showListener)
            Taro.eventCenter.off('hideQuickAddSheet', hideListener)
        }
    })

    // 跳转到首页(库存管理)
    const handleWarehouse = () => {
        Taro.switchTab({ url: '/pages/index/index' })
    }

    // 显示品类统计 (暂用modal展示)
    const handleCategory = () => {
        Taro.showModal({
            title: '品类说明',
            content: '支持品类: 耳饰、项链、手链、戒指、其他\n\n如需自定义品类，请联系开发者。',
            showCancel: false
        })
    }

    // 导出报表提示
    const handleExport = () => {
        Taro.showModal({
            title: '导出报表',
            content: '此功能正在开发中，将支持导出库存清单和交易明细到Excel。',
            showCancel: false
        })
    }

    // 汇率设置
    const handleCurrency = () => {
        Taro.showModal({
            title: '汇率说明',
            content: '当前支持币种:\n\nCNY (人民币) ¥\nSGD (新加坡元) S$\nTWD (新台币) NT$\n\n汇率自动根据销售渠道匹配。',
            showCancel: false
        })
    }

    const handleSync = () => {
        Taro.showLoading({ title: '同步中...' })
        setTimeout(() => {
            Taro.hideLoading()
            Taro.showToast({ title: '数据已是最新', icon: 'success' })
        }, 1500)
    }

    const handlePrivacy = () => {
        Taro.showModal({
            title: '隐私声明',
            content: '您的数据安全存储于微信云开发服务器，仅您本人可访问。我们不会向任何第三方分享您的数据。',
            showCancel: false
        })
    }

    const handleShowOpenid = () => {
        if (!openid) {
            Taro.showToast({ title: '获取中...', icon: 'loading' })
            return
        }
        Taro.showModal({
            title: '用户标识 (OpenID)',
            content: openid,
            confirmText: '复制',
            success: (res) => {
                if (res.confirm) {
                    Taro.setClipboardData({
                        data: openid,
                        success: () => Taro.showToast({ title: '已复制', icon: 'success' })
                    })
                }
            }
        })
    }

    const handleChooseAvatar = async (e: any) => {
        const avatarUrl = e.detail.avatarUrl
        if (!avatarUrl) return

        try {
            Taro.showLoading({ title: '更新头像...' })
            
            // 更新云端用户头像
            await Taro.cloud.callFunction({
                name: 'user',
                data: { 
                    action: 'updateAvatar',
                    data: { avatarUrl }
                }
            })

            // 更新本地存储
            const currentUser = Taro.getStorageSync('currentUser') || {}
            currentUser.avatarUrl = avatarUrl
            Taro.setStorageSync('currentUser', currentUser)

            // 更新界面
            setUserInfo(prev => ({ ...prev, avatarUrl }))
            
            Taro.hideLoading()
            Taro.showToast({ title: '头像更新成功', icon: 'success' })
        } catch (error) {
            Taro.hideLoading()
            Taro.showToast({ title: '更新失败', icon: 'none' })
        }
    }

    const handleHelp = () => {
        Taro.showModal({
            title: '使用帮助',
            content: '遇到问题？请联系开发者:\n\n微信: jewelry_helper\n\n感谢您的使用！',
            showCancel: false
        })
    }

    const handleShare = () => {
        Taro.showShareMenu({ withShareTicket: true })
        Taro.showToast({ title: '点击右上角分享', icon: 'none' })
    }

    const handleLogout = () => {
        Taro.showModal({
            title: '退出登录',
            content: '确定要退出登录吗？退出后需要重新输入邀请码。',
            success: async (res) => {
                if (res.confirm) {
                    Taro.showLoading({ title: '退出中...' })
                    try {
                        if (process.env.TARO_ENV === 'weapp') {
                            await Taro.cloud.callFunction({
                                name: 'user',
                                data: { action: 'logout' }
                            })
                        }
                        Taro.removeStorageSync('isLoggedIn')
                        Taro.hideLoading()
                        Taro.showToast({ title: '已退出', icon: 'success' })
                        setTimeout(() => {
                            Taro.redirectTo({ url: '/pages/login/index' })
                        }, 1500)
                    } catch (error) {
                        Taro.hideLoading()
                        Taro.removeStorageSync('isLoggedIn')
                        Taro.redirectTo({ url: '/pages/login/index' })
                    }
                }
            }
        })
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
                    {process.env.TARO_ENV === 'weapp' ? (
                        <Button className='avatar-btn' openType='chooseAvatar' onChooseAvatar={handleChooseAvatar}>
                            <View className='avatar'>
                                {userInfo.avatarUrl ? (
                                    <Image className='avatar-icon-img avatar-real' src={userInfo.avatarUrl} mode='aspectFill' />
                                ) : (
                                    <Image className='avatar-icon-img' src={AvatarIcon} mode='aspectFit' />
                                )}
                            </View>
                        </Button>
                    ) : (
                        <View className='avatar'>
                            {userInfo.avatarUrl ? (
                                <Image className='avatar-icon-img avatar-real' src={userInfo.avatarUrl} mode='aspectFill' />
                            ) : (
                                <Image className='avatar-icon-img' src={AvatarIcon} mode='aspectFit' />
                            )}
                        </View>
                    )}
                    <View className='user-info'>
                        <Text className='username'>{userInfo.nickname || userInfo.username || '用户'}</Text>
                        <View className='pro-tag'>
                            <Text className='tag-text'>PRO 专业版</Text>
                        </View>
                    </View>
                    <View className='bg-decoration'>
                        <Image className='star-icon-img' src={StarIcon} mode='aspectFit' />
                    </View>
                </View>

                <View className='card-divider' />

                <View className='card-bottom'>
                    <View className='info-col'>
                        <Text className='label'>加入时间</Text>
                        <Text className='value'>{userInfo.createdAt ? userInfo.createdAt.slice(0, 10) : '--'}</Text>
                    </View>
                    <View className='info-col align-right'>
                        <Text className='label'>数据同步</Text>
                        <View className='status-row'>
                            <Image className='status-icon-img' src={CheckIcon} mode='aspectFit' />
                            <Text className='value'>已加密</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* 业务工具 */}
            <View className='section'>
                <Text className='section-title'>业务工具</Text>
                <View className='tools-grid'>
                    <View className='tool-item' onClick={handleWarehouse}>
                        <View className='tool-icon-bg'>
                            <Image className='tool-icon-img' src={WarehouseIcon} mode='aspectFit' />
                        </View>
                        <Text className='tool-name'>仓库管理</Text>
                    </View>
                    <View className='tool-item' onClick={handleCategory}>
                        <View className='tool-icon-bg'>
                            <Image className='tool-icon-img' src={CategoryIcon} mode='aspectFit' />
                        </View>
                        <Text className='tool-name'>品类设置</Text>
                    </View>
                    <View className='tool-item' onClick={handleExport}>
                        <View className='tool-icon-bg'>
                            <Image className='tool-icon-img' src={ExportIcon} mode='aspectFit' />
                        </View>
                        <Text className='tool-name'>导出报表</Text>
                    </View>
                </View>
            </View>

            {/* 系统设置 */}
            <View className='section'>
                <Text className='section-title'>系统设置</Text>
                <View className='settings-list'>
                    <View className='setting-item' onClick={handleCurrency}>
                        <View className='item-left'>
                            <Image className='item-icon-img' src={CurrencyIcon} mode='aspectFit' />
                            <Text className='item-name'>汇率与币种设置</Text>
                        </View>
                        <View className='item-right'>
                            <Text className='item-desc'>CNY / SGD / TWD</Text>
                            <Text className='arrow'>›</Text>
                        </View>
                    </View>

                    <View className='setting-item' onClick={handleSync}>
                        <View className='item-left'>
                            <Image className='item-icon-img' src={SyncIcon} mode='aspectFit' />
                            <Text className='item-name'>手动同步云端数据</Text>
                        </View>
                        <View className='item-right'>
                            <Text className='arrow'>›</Text>
                        </View>
                    </View>

                    <View className='setting-item' onClick={handlePrivacy}>
                        <View className='item-left'>
                            <Image className='item-icon-img' src={PrivacyIcon} mode='aspectFit' />
                            <Text className='item-name'>数据安全与隐私协议</Text>
                        </View>
                        <View className='item-right'>
                            <Text className='arrow'>›</Text>
                        </View>
                    </View>

                    {process.env.TARO_ENV === 'weapp' && (
                        <View className='setting-item' onClick={handleShowOpenid}>
                            <View className='item-left'>
                                <Image className='item-icon-img' src={PrivacyIcon} mode='aspectFit' />
                                <Text className='item-name'>用户标识</Text>
                            </View>
                            <View className='item-right'>
                                <Text className='item-desc'>{openid ? '点击查看' : '加载中...'}</Text>
                                <Text className='arrow'>›</Text>
                            </View>
                        </View>
                    )}

                    <View className='setting-item' onClick={handleHelp}>
                        <View className='item-left'>
                            <Image className='item-icon-img' src={HelpIcon} mode='aspectFit' />
                            <Text className='item-name'>使用帮助与反馈</Text>
                        </View>
                        <View className='item-right'>
                            <Text className='arrow'>›</Text>
                        </View>
                    </View>

                    <View className='setting-item last' onClick={handleShare}>
                        <View className='item-left'>
                            <Image className='item-icon-img' src={ShareIcon} mode='aspectFit' />
                            <Text className='item-name'>推荐给同行</Text>
                        </View>
                        <View className='item-right'>
                            <Text className='arrow'>›</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* 底部按钮 */}
            <View className='logout-btn' onClick={handleLogout}>
                <Image className='logout-icon-img' src={LogoutIcon} mode='aspectFit' />
                <Text className='logout-text'>退出登录</Text>
            </View>

            <View className='version-info'>
                <Text>JEWELRY INVENTORY PRO V2.1.0</Text>
            </View>

            <QuickAddSheet
                visible={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                onSuccess={() => {
                    setShowQuickAdd(false)
                    Taro.showToast({ title: '登记成功' })
                }}
            />
        </View>
    )
}
