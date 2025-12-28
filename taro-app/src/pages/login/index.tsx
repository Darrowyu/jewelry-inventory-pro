import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

type Mode = 'login' | 'register'

export default function Login() {
    const [mode, setMode] = useState<Mode>('login')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [nickname, setNickname] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!username.trim() || !password.trim()) {
            Taro.showToast({ title: '请输入用户名和密码', icon: 'none' })
            return
        }

        if (mode === 'register' && !inviteCode.trim()) {
            Taro.showToast({ title: '请输入邀请码', icon: 'none' })
            return
        }

        setLoading(true)
        try {
            const action = mode === 'login' ? 'login' : 'register'
            const requestData = mode === 'login' 
                ? { username: username.trim(), password }
                : { 
                    username: username.trim(), 
                    password, 
                    inviteCode: inviteCode.trim(),
                    nickname: nickname.trim() || username.trim()
                }

            const res = await Taro.cloud.callFunction({
                name: 'user',
                data: { action, data: requestData }
            }) as any

            if (res.result?.success) {
                // 保存登录状态
                Taro.setStorageSync('isLoggedIn', true)
                Taro.setStorageSync('currentUser', res.result.data.user || { username: username.trim() })
                
                const message = mode === 'login' ? '登录成功' : '注册成功'
                Taro.showToast({ title: message, icon: 'success' })
                
                setTimeout(() => {
                    Taro.switchTab({ url: '/pages/home/index' })
                }, 1500)
            } else {
                Taro.showToast({ title: res.result?.error || '操作失败', icon: 'none' })
            }
        } catch (error: any) {
            Taro.showToast({ title: error.message || '网络错误', icon: 'none' })
        } finally {
            setLoading(false)
        }
    }

    const switchMode = () => {
        setMode(mode === 'login' ? 'register' : 'login')
        setInviteCode('')
        setNickname('')
    }

    return (
        <View className='login-page'>
            <View className='login-header'>
                <View className='logo-container'>
                    <Text className='logo-icon'>💎</Text>
                </View>
                <Text className='app-name'>珠宝库存管家</Text>
                <Text className='app-desc'>专业的珠宝库存管理工具</Text>
            </View>

            <View className='login-form'>
                <View className='form-title'>
                    <Text>{mode === 'login' ? '用户登录' : '新用户注册'}</Text>
                </View>

                {mode === 'register' && (
                    <View className='input-group'>
                        <Text className='input-label'>邀请码 *</Text>
                        <Input
                            className='input-field'
                            placeholder='请输入邀请码'
                            value={inviteCode}
                            onInput={(e) => setInviteCode(e.detail.value)}
                            maxlength={20}
                        />
                    </View>
                )}

                <View className='input-group'>
                    <Text className='input-label'>用户名 *</Text>
                    <Input
                        className='input-field'
                        placeholder={mode === 'register' ? '请设置用户名（3-20位）' : '请输入用户名'}
                        value={username}
                        onInput={(e) => setUsername(e.detail.value)}
                        maxlength={20}
                    />
                </View>

                <View className='input-group'>
                    <Text className='input-label'>密码 *</Text>
                    <Input
                        className='input-field'
                        placeholder={mode === 'register' ? '请设置密码（至少6位）' : '请输入密码'}
                        password
                        value={password}
                        onInput={(e) => setPassword(e.detail.value)}
                        maxlength={32}
                    />
                </View>

                {mode === 'register' && (
                    <View className='input-group'>
                        <Text className='input-label'>昵称（选填）</Text>
                        <Input
                            className='input-field'
                            placeholder='请输入昵称'
                            value={nickname}
                            onInput={(e) => setNickname(e.detail.value)}
                            maxlength={20}
                        />
                    </View>
                )}

                <View
                    className={`login-btn ${loading ? 'disabled' : ''}`}
                    onClick={!loading ? handleSubmit : undefined}
                >
                    <Text className='btn-text'>
                        {loading ? '处理中...' : (mode === 'login' ? '登 录' : '注 册')}
                    </Text>
                </View>

                <View className='mode-switch' onClick={switchMode}>
                    <Text className='switch-text'>
                        {mode === 'login' ? '没有账号？使用邀请码注册' : '已有账号？直接登录'}
                    </Text>
                </View>
            </View>

            <View className='login-footer'>
                <Text className='footer-text'>JEWELRY INVENTORY PRO</Text>
            </View>
        </View>
    )
}
