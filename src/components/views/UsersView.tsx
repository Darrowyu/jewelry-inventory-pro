import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../../config/api'

interface User {
    id: string
    username: string
    nickname: string
    role: string
    status: string
    createdAt: string
    lastLoginAt?: string
}

interface InviteCode {
    _id: string
    code: string
    status: string
    maxUses: number
    usedCount: number
    note?: string
    createdAt: string
}

interface UsersViewProps {
    currentUser: { username: string; role: string }
}

const UsersView: React.FC<UsersViewProps> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([])
    const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'users' | 'codes'>('users')
    const [newCodeUses, setNewCodeUses] = useState('1')
    const [newCodeNote, setNewCodeNote] = useState('')
    const [creating, setCreating] = useState(false)

    const fetchUsers = async () => {
        try {
            const response = await fetch(getApiUrl('/user'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'listUsers',
                    data: { adminUsername: currentUser.username }
                })
            })
            const result = await response.json()
            if (result.success) {
                setUsers(result.data)
            }
        } catch (err) {
            console.error('获取用户列表失败:', err)
        }
    }

    const fetchInviteCodes = async () => {
        try {
            const response = await fetch(getApiUrl('/user'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'listInviteCodes',
                    data: { adminUsername: currentUser.username }
                })
            })
            const result = await response.json()
            if (result.success) {
                setInviteCodes(result.data)
            }
        } catch (err) {
            console.error('获取邀请码列表失败:', err)
        }
    }

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            await Promise.all([fetchUsers(), fetchInviteCodes()])
            setLoading(false)
        }
        loadData()
    }, [currentUser.username])

    const handleCreateCode = async () => {
        setCreating(true)
        try {
            const response = await fetch(getApiUrl('/user'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'createInviteCode',
                    data: {
                        adminUsername: currentUser.username,
                        maxUses: parseInt(newCodeUses) || 1,
                        note: newCodeNote
                    }
                })
            })
            const result = await response.json()
            if (result.success) {
                alert(`邀请码创建成功: ${result.data.code}`)
                setNewCodeNote('')
                fetchInviteCodes()
            } else {
                alert(result.error || '创建失败')
            }
        } catch (err: any) {
            alert(err.message || '网络错误')
        } finally {
            setCreating(false)
        }
    }

    const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
        const action = newStatus === 'active' ? '启用' : '禁用'
        
        if (!confirm(`确定要${action}该用户吗？`)) return

        try {
            const response = await fetch(getApiUrl('/user'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggleUserStatus',
                    data: {
                        adminUsername: currentUser.username,
                        userId,
                        status: newStatus
                    }
                })
            })
            const result = await response.json()
            if (result.success) {
                fetchUsers()
            } else {
                alert(result.error || '操作失败')
            }
        } catch (err: any) {
            alert(err.message || '网络错误')
        }
    }

    const handleDeleteCode = async (codeId: string) => {
        if (!confirm('确定要删除该邀请码吗？')) return

        try {
            const response = await fetch(getApiUrl('/user'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'deleteInviteCode',
                    data: {
                        adminUsername: currentUser.username,
                        codeId
                    }
                })
            })
            const result = await response.json()
            if (result.success) {
                fetchInviteCodes()
            } else {
                alert(result.error || '删除失败')
            }
        } catch (err: any) {
            alert(err.message || '网络错误')
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert('已复制到剪贴板')
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('zh-CN')
    }

    if (currentUser.role !== 'admin') {
        return (
            <div className="users-view">
                <div className="no-permission">
                    <p>⚠️ 仅管理员可访问用户管理</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="users-view">
                <div className="loading">加载中...</div>
            </div>
        )
    }

    return (
        <div className="users-view">
            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    用户管理 ({users.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'codes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('codes')}
                >
                    邀请码 ({inviteCodes.length})
                </button>
            </div>

            {activeTab === 'users' && (
                <div className="users-list">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>用户名</th>
                                <th>昵称</th>
                                <th>角色</th>
                                <th>状态</th>
                                <th>注册时间</th>
                                <th>最后登录</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.username}</td>
                                    <td>{user.nickname}</td>
                                    <td>
                                        <span className={`role-badge ${user.role}`}>
                                            {user.role === 'admin' ? '管理员' : '用户'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.status}`}>
                                            {user.status === 'active' ? '正常' : '禁用'}
                                        </span>
                                    </td>
                                    <td>{formatDate(user.createdAt)}</td>
                                    <td>{formatDate(user.lastLoginAt || '')}</td>
                                    <td>
                                        {user.role !== 'admin' && (
                                            <button 
                                                className={`btn-small ${user.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                                                onClick={() => handleToggleUserStatus(user.id, user.status)}
                                            >
                                                {user.status === 'active' ? '禁用' : '启用'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'codes' && (
                <div className="codes-section">
                    <div className="create-code-form">
                        <h3>创建邀请码</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>可用次数</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={newCodeUses}
                                    onChange={(e) => setNewCodeUses(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>备注</label>
                                <input
                                    type="text"
                                    placeholder="可选备注"
                                    value={newCodeNote}
                                    onChange={(e) => setNewCodeNote(e.target.value)}
                                />
                            </div>
                            <button 
                                className="btn-primary"
                                onClick={handleCreateCode}
                                disabled={creating}
                            >
                                {creating ? '创建中...' : '生成邀请码'}
                            </button>
                        </div>
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>邀请码</th>
                                <th>使用情况</th>
                                <th>状态</th>
                                <th>备注</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inviteCodes.map(code => (
                                <tr key={code._id}>
                                    <td>
                                        <code className="invite-code">{code.code}</code>
                                        <button 
                                            className="btn-copy"
                                            onClick={() => copyToClipboard(code.code)}
                                        >
                                            复制
                                        </button>
                                    </td>
                                    <td>{code.usedCount} / {code.maxUses}</td>
                                    <td>
                                        <span className={`status-badge ${code.usedCount >= code.maxUses ? 'inactive' : 'active'}`}>
                                            {code.usedCount >= code.maxUses ? '已用完' : '可用'}
                                        </span>
                                    </td>
                                    <td>{code.note || '-'}</td>
                                    <td>{formatDate(code.createdAt)}</td>
                                    <td>
                                        <button 
                                            className="btn-small btn-danger"
                                            onClick={() => handleDeleteCode(code._id)}
                                        >
                                            删除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default UsersView
