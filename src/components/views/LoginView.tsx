import React, { useState } from 'react'
import { getApiUrl } from '../../config/api'
import { DiamondIcon } from '../Icons'

interface LoginViewProps {
    onLogin: (user: { username: string; role: string }) => void
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!username.trim() || !password.trim()) {
            setError('请输入用户名和密码')
            return
        }

        setLoading(true)
        try {
            const response = await fetch(getApiUrl('/user'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'webLogin',
                    data: { username: username.trim(), password }
                })
            })

            const result = await response.json()
            if (result.success) {
                localStorage.setItem('currentUser', JSON.stringify(result.data.user))
                onLogin(result.data.user)
            } else {
                setError(result.error || '登录失败')
            }
        } catch (err: any) {
            setError(err.message || '网络错误')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <span className="login-logo">
                        <DiamondIcon size={48} color="#EC4899" />
                    </span>
                    <h1>珠宝库存管家</h1>
                    <p>Web 管理后台</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="login-error">{error}</div>}

                    <div className="form-group">
                        <label>用户名</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="请输入用户名"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? '登录中...' : '登 录'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>首次使用请在小程序端完成初始化</p>
                </div>
            </div>
        </div>
    )
}

export default LoginView
