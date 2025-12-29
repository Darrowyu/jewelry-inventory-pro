import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../../config/api'

interface User {
    id: string
    username: string
    nickname: string
    role: string
    status: string
    inviteCode?: string
    createdAt: string
    updatedAt?: string
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

    // 用户详情面板状态
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editMode, setEditMode] = useState(false)
    const [editNickname, setEditNickname] = useState('')
    const [editRole, setEditRole] = useState('')
    const [saving, setSaving] = useState(false)

    // 密码重置状态
    const [showResetPassword, setShowResetPassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [resetting, setResetting] = useState(false)

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

    const handleSelectUser = (user: User) => {
        setSelectedUser(user)
        setEditNickname(user.nickname)
        setEditRole(user.role)
        setEditMode(false)
        setShowResetPassword(false)
        setNewPassword('')
        setConfirmPassword('')
    }

    const handleClosePanel = () => {
        setSelectedUser(null)
        setEditMode(false)
        setShowResetPassword(false)
    }

    const handleSaveUser = async () => {
        if (!selectedUser) return
        setSaving(true)
        try {
            const response = await fetch(getApiUrl('/user'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateUser',
                    data: {
                        adminUsername: currentUser.username,
                        userId: selectedUser.id,
                        nickname: editNickname,
                        role: editRole
                    }
                })
            })
            const result = await response.json()
            if (result.success) {
                alert('保存成功')
                setEditMode(false)
                await fetchUsers()
                setSelectedUser(prev => prev ? { ...prev, nickname: editNickname, role: editRole } : null)
            } else {
                alert(result.error || '保存失败')
            }
        } catch (err: any) {
            alert(err.message || '网络错误')
        } finally {
            setSaving(false)
        }
    }

    const handleResetPassword = async () => {
        if (!selectedUser) return
        if (newPassword.length < 6) {
            alert('密码至少6位')
            return
        }
        if (newPassword !== confirmPassword) {
            alert('两次密码输入不一致')
            return
        }

        setResetting(true)
        try {
            const response = await fetch(getApiUrl('/user'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'resetPassword',
                    data: {
                        adminUsername: currentUser.username,
                        userId: selectedUser.id,
                        newPassword
                    }
                })
            })
            const result = await response.json()
            if (result.success) {
                alert('密码重置成功')
                setShowResetPassword(false)
                setNewPassword('')
                setConfirmPassword('')
            } else {
                alert(result.error || '重置失败')
            }
        } catch (err: any) {
            alert(err.message || '网络错误')
        } finally {
            setResetting(false)
        }
    }

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
                if (selectedUser?.id === userId) {
                    setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null)
                }
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
                    <p>仅管理员可访问用户管理</p>
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
                <div className={`users-container ${selectedUser ? 'with-panel' : ''}`}>
                    <div className="users-list">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>用户名</th>
                                    <th>昵称</th>
                                    <th>角色</th>
                                    <th>状态</th>
                                    <th>最后登录</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr
                                        key={user.id}
                                        className={`user-row ${selectedUser?.id === user.id ? 'selected' : ''}`}
                                        onClick={() => handleSelectUser(user)}
                                    >
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
                                        <td>{formatDate(user.lastLoginAt || '')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 用户详情面板 */}
                    {selectedUser && (
                        <div className="user-detail-panel">
                            <div className="panel-header">
                                <h3>用户详情</h3>
                                <button className="btn-close" onClick={handleClosePanel}>×</button>
                            </div>

                            <div className="panel-content">
                                {/* 用户头像区域 */}
                                <div className="user-avatar-section">
                                    <div className="avatar-circle">
                                        {selectedUser.nickname?.charAt(0) || selectedUser.username.charAt(0)}
                                    </div>
                                    <div className="user-name">{selectedUser.username}</div>
                                    <div className={`user-status-tag ${selectedUser.status}`}>
                                        {selectedUser.status === 'active' ? '正常' : '已禁用'}
                                    </div>
                                </div>

                                {/* 用户信息表单 */}
                                <div className="user-info-form">
                                    <div className="form-section">
                                        <label>昵称</label>
                                        {editMode ? (
                                            <input
                                                type="text"
                                                value={editNickname}
                                                onChange={(e) => setEditNickname(e.target.value)}
                                                className="edit-input"
                                            />
                                        ) : (
                                            <div className="info-value">{selectedUser.nickname}</div>
                                        )}
                                    </div>

                                    <div className="form-section">
                                        <label>角色</label>
                                        {editMode ? (
                                            <select
                                                value={editRole}
                                                onChange={(e) => setEditRole(e.target.value)}
                                                className="edit-select"
                                            >
                                                <option value="user">普通用户</option>
                                                <option value="admin">管理员</option>
                                            </select>
                                        ) : (
                                            <div className="info-value">
                                                <span className={`role-badge ${selectedUser.role}`}>
                                                    {selectedUser.role === 'admin' ? '管理员' : '普通用户'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-section">
                                        <label>注册时间</label>
                                        <div className="info-value">{formatDate(selectedUser.createdAt)}</div>
                                    </div>

                                    <div className="form-section">
                                        <label>最后登录</label>
                                        <div className="info-value">{formatDate(selectedUser.lastLoginAt || '')}</div>
                                    </div>

                                    {selectedUser.inviteCode && (
                                        <div className="form-section">
                                            <label>使用邀请码</label>
                                            <div className="info-value"><code>{selectedUser.inviteCode}</code></div>
                                        </div>
                                    )}
                                </div>

                                {/* 操作按钮 */}
                                <div className="panel-actions">
                                    {editMode ? (
                                        <>
                                            <button
                                                className="btn-primary"
                                                onClick={handleSaveUser}
                                                disabled={saving}
                                            >
                                                {saving ? '保存中...' : '保存修改'}
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => {
                                                    setEditMode(false)
                                                    setEditNickname(selectedUser.nickname)
                                                    setEditRole(selectedUser.role)
                                                }}
                                            >
                                                取消
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="btn-primary"
                                                onClick={() => setEditMode(true)}
                                            >
                                                编辑用户
                                            </button>
                                            <button
                                                className="btn-warning"
                                                onClick={() => setShowResetPassword(!showResetPassword)}
                                            >
                                                重置密码
                                            </button>
                                            {selectedUser.role !== 'admin' && (
                                                <button
                                                    className={selectedUser.status === 'active' ? 'btn-danger' : 'btn-success'}
                                                    onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.status)}
                                                >
                                                    {selectedUser.status === 'active' ? '禁用账号' : '启用账号'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* 密码重置区域 */}
                                {showResetPassword && (
                                    <div className="reset-password-section">
                                        <h4>重置密码</h4>
                                        <div className="form-section">
                                            <label>新密码</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="至少6位"
                                                className="edit-input"
                                            />
                                        </div>
                                        <div className="form-section">
                                            <label>确认密码</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="再次输入新密码"
                                                className="edit-input"
                                            />
                                        </div>
                                        <div className="reset-actions">
                                            <button
                                                className="btn-primary"
                                                onClick={handleResetPassword}
                                                disabled={resetting}
                                            >
                                                {resetting ? '重置中...' : '确认重置'}
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => {
                                                    setShowResetPassword(false)
                                                    setNewPassword('')
                                                    setConfirmPassword('')
                                                }}
                                            >
                                                取消
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
