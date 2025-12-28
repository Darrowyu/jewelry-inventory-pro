const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const crypto = require('crypto')

// 密码加密
function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
}

function generateSalt() {
    return crypto.randomBytes(16).toString('hex')
}

function verifyPassword(password, hash, salt) {
    const inputHash = hashPassword(password, salt)
    return inputHash === hash
}

// 生成随机邀请码
function generateInviteCode() {
    return 'INV' + crypto.randomBytes(4).toString('hex').toUpperCase()
}

exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { action, data } = event

    const usersCollection = db.collection('jewelry_users')
    const codesCollection = db.collection('jewelry_invite_codes')

    try {
        switch (action) {
            // 获取当前用户 openid
            case 'getOpenid': {
                return { success: true, data: { openid } }
            }

            // 检查用户是否已注册（小程序端用）
            case 'checkAuth': {
                if (!openid) {
                    return { success: true, data: { isRegistered: false } }
                }
                const userRes = await usersCollection.where({ openid, status: 'active' }).get()
                if (userRes.data.length > 0) {
                    const user = userRes.data[0]
                    return {
                        success: true,
                        data: {
                            isRegistered: true,
                            user: {
                                id: user._id,
                                username: user.username,
                                nickname: user.nickname,
                                role: user.role,
                                createdAt: user.createdAt,
                                avatarUrl: user.avatarUrl || ''
                            }
                        }
                    }
                }
                return { success: true, data: { isRegistered: false } }
            }

            // 使用邀请码注册新用户
            case 'register': {
                const { inviteCode, username, password, nickname } = data || {}
                
                if (!inviteCode || !username || !password) {
                    return { success: false, error: '请填写完整信息' }
                }

                if (username.length < 3 || username.length > 20) {
                    return { success: false, error: '用户名需3-20个字符' }
                }

                if (password.length < 6) {
                    return { success: false, error: '密码至少6位' }
                }

                // 检查用户名是否已存在
                const existingUser = await usersCollection.where({ username }).get()
                if (existingUser.data.length > 0) {
                    return { success: false, error: '用户名已被使用' }
                }

                // 验证邀请码
                const codeUpper = inviteCode.toUpperCase().trim()
                const codeRes = await codesCollection.where({
                    code: codeUpper,
                    status: 'active'
                }).get()

                if (codeRes.data.length === 0) {
                    return { success: false, error: '邀请码无效' }
                }

                const codeRecord = codeRes.data[0]
                if (codeRecord.maxUses && codeRecord.usedCount >= codeRecord.maxUses) {
                    return { success: false, error: '邀请码已达使用上限' }
                }

                const now = new Date().toISOString()
                const salt = generateSalt()
                const passwordHash = hashPassword(password, salt)

                // 创建用户
                const userResult = await usersCollection.add({
                    data: {
                        openid: openid || null,
                        username,
                        passwordHash,
                        salt,
                        nickname: nickname || username,
                        role: 'user',
                        inviteCode: codeUpper,
                        status: 'active',
                        createdAt: now,
                        updatedAt: now,
                        lastLoginAt: now
                    }
                })

                // 更新邀请码使用次数
                await codesCollection.doc(codeRecord._id).update({
                    data: {
                        usedCount: db.command.inc(1),
                        lastUsedAt: now,
                        lastUsedBy: username
                    }
                })

                return {
                    success: true,
                    data: { 
                        message: '注册成功',
                        userId: userResult._id,
                        user: {
                            id: userResult._id,
                            username,
                            nickname: nickname || username,
                            role: 'user',
                            createdAt: now,
                            avatarUrl: ''
                        }
                    }
                }
            }

            // 用户名密码登录
            case 'login': {
                const { username, password } = data || {}
                
                if (!username || !password) {
                    return { success: false, error: '请输入用户名和密码' }
                }

                const userRes = await usersCollection.where({ username, status: 'active' }).get()
                if (userRes.data.length === 0) {
                    return { success: false, error: '用户名或密码错误' }
                }

                const user = userRes.data[0]
                if (!verifyPassword(password, user.passwordHash, user.salt)) {
                    return { success: false, error: '用户名或密码错误' }
                }

                // 更新 openid 和最后登录时间
                const updateData = { lastLoginAt: new Date().toISOString() }
                if (openid && !user.openid) {
                    updateData.openid = openid
                }
                await usersCollection.doc(user._id).update({ data: updateData })

                return {
                    success: true,
                    data: {
                        user: {
                            id: user._id,
                            username: user.username,
                            nickname: user.nickname,
                            role: user.role,
                            createdAt: user.createdAt,
                            avatarUrl: user.avatarUrl || ''
                        }
                    }
                }
            }

            // 退出登录
            case 'logout': {
                // 仅清除本地状态，不改变用户数据
                return { success: true, data: { message: '已退出登录' } }
            }

            // 更新用户头像
            case 'updateAvatar': {
                const { avatarUrl } = data || {}
                if (!openid) {
                    return { success: false, error: '未登录' }
                }
                if (!avatarUrl) {
                    return { success: false, error: '头像地址为空' }
                }
                
                const userRes = await usersCollection.where({ openid, status: 'active' }).get()
                if (userRes.data.length === 0) {
                    return { success: false, error: '用户不存在' }
                }
                
                await usersCollection.doc(userRes.data[0]._id).update({
                    data: {
                        avatarUrl,
                        updatedAt: new Date().toISOString()
                    }
                })
                
                return { success: true, data: { message: '头像更新成功' } }
            }

            // ===== 以下为管理员功能 =====

            // Web端登录验证（无需openid）
            case 'webLogin': {
                const { username, password } = data || {}
                
                if (!username || !password) {
                    return { success: false, error: '请输入用户名和密码' }
                }

                const userRes = await usersCollection.where({ username, status: 'active' }).get()
                if (userRes.data.length === 0) {
                    return { success: false, error: '用户名或密码错误' }
                }

                const user = userRes.data[0]
                if (!verifyPassword(password, user.passwordHash, user.salt)) {
                    return { success: false, error: '用户名或密码错误' }
                }

                await usersCollection.doc(user._id).update({ 
                    data: { lastLoginAt: new Date().toISOString() } 
                })

                return {
                    success: true,
                    data: {
                        user: {
                            id: user._id,
                            username: user.username,
                            nickname: user.nickname,
                            role: user.role
                        }
                    }
                }
            }

            // 获取用户列表（管理员）
            case 'listUsers': {
                const { adminUsername } = data || {}
                
                // 简单验证：检查请求者是否是管理员
                if (adminUsername) {
                    const adminRes = await usersCollection.where({ 
                        username: adminUsername, 
                        role: 'admin',
                        status: 'active'
                    }).get()
                    if (adminRes.data.length === 0) {
                        return { success: false, error: '无权限' }
                    }
                } else if (openid) {
                    const adminRes = await usersCollection.where({ 
                        openid, 
                        role: 'admin',
                        status: 'active'
                    }).get()
                    if (adminRes.data.length === 0) {
                        return { success: false, error: '无权限' }
                    }
                } else {
                    return { success: false, error: '无权限' }
                }

                const users = await usersCollection.orderBy('createdAt', 'desc').get()
                return { 
                    success: true, 
                    data: users.data.map(u => ({
                        id: u._id,
                        username: u.username,
                        nickname: u.nickname,
                        role: u.role,
                        status: u.status,
                        createdAt: u.createdAt,
                        lastLoginAt: u.lastLoginAt
                    }))
                }
            }

            // 创建邀请码（管理员）
            case 'createInviteCode': {
                const { adminUsername, maxUses = 10, note, code: customCode } = data || {}
                
                if (adminUsername) {
                    const adminRes = await usersCollection.where({ 
                        username: adminUsername, 
                        role: 'admin',
                        status: 'active'
                    }).get()
                    if (adminRes.data.length === 0) {
                        return { success: false, error: '无权限' }
                    }
                } else if (openid) {
                    const adminRes = await usersCollection.where({ 
                        openid, 
                        role: 'admin',
                        status: 'active'
                    }).get()
                    if (adminRes.data.length === 0) {
                        return { success: false, error: '无权限' }
                    }
                } else {
                    return { success: false, error: '无权限' }
                }

                const code = customCode ? customCode.toUpperCase() : generateInviteCode()
                
                // 检查邀请码是否已存在
                const existingCode = await codesCollection.where({ code }).get()
                if (existingCode.data.length > 0) {
                    return { success: false, error: '邀请码已存在' }
                }

                await codesCollection.add({
                    data: {
                        code,
                        status: 'active',
                        maxUses: parseInt(maxUses) || 10,
                        usedCount: 0,
                        note: note || '',
                        createdBy: adminUsername || openid,
                        createdAt: new Date().toISOString()
                    }
                })

                return { success: true, data: { code } }
            }

            // 获取邀请码列表（管理员）
            case 'listInviteCodes': {
                const { adminUsername } = data || {}
                
                if (adminUsername) {
                    const adminRes = await usersCollection.where({ 
                        username: adminUsername, 
                        role: 'admin',
                        status: 'active'
                    }).get()
                    if (adminRes.data.length === 0) {
                        return { success: false, error: '无权限' }
                    }
                } else if (openid) {
                    const adminRes = await usersCollection.where({ 
                        openid, 
                        role: 'admin',
                        status: 'active'
                    }).get()
                    if (adminRes.data.length === 0) {
                        return { success: false, error: '无权限' }
                    }
                } else {
                    return { success: false, error: '无权限' }
                }

                const codes = await codesCollection.orderBy('createdAt', 'desc').get()
                return { success: true, data: codes.data }
            }

            // 禁用/启用用户（管理员）
            case 'toggleUserStatus': {
                const { adminUsername, userId, status } = data || {}
                
                if (adminUsername) {
                    const adminRes = await usersCollection.where({ 
                        username: adminUsername, 
                        role: 'admin',
                        status: 'active'
                    }).get()
                    if (adminRes.data.length === 0) {
                        return { success: false, error: '无权限' }
                    }
                } else {
                    return { success: false, error: '无权限' }
                }

                await usersCollection.doc(userId).update({
                    data: { 
                        status: status,
                        updatedAt: new Date().toISOString()
                    }
                })

                return { success: true, data: { message: '操作成功' } }
            }

            // 删除邀请码（管理员）
            case 'deleteInviteCode': {
                const { adminUsername, codeId } = data || {}
                
                if (adminUsername) {
                    const adminRes = await usersCollection.where({ 
                        username: adminUsername, 
                        role: 'admin',
                        status: 'active'
                    }).get()
                    if (adminRes.data.length === 0) {
                        return { success: false, error: '无权限' }
                    }
                } else {
                    return { success: false, error: '无权限' }
                }

                await codesCollection.doc(codeId).remove()
                return { success: true, data: { message: '删除成功' } }
            }

            // 初始化管理员账号（仅首次使用）
            case 'initAdmin': {
                const { username, password, inviteCodes } = data || {}
                
                // 检查是否已有管理员
                const existingAdmin = await usersCollection.where({ role: 'admin' }).get()
                if (existingAdmin.data.length > 0) {
                    return { success: false, error: '管理员已存在' }
                }

                if (!username || !password) {
                    return { success: false, error: '请填写用户名和密码' }
                }

                const now = new Date().toISOString()
                const salt = generateSalt()
                const passwordHash = hashPassword(password, salt)

                // 创建管理员
                await usersCollection.add({
                    data: {
                        openid: openid || null,
                        username,
                        passwordHash,
                        salt,
                        nickname: '管理员',
                        role: 'admin',
                        status: 'active',
                        createdAt: now,
                        updatedAt: now
                    }
                })

                // 创建邀请码（支持预设或自动生成）
                const codesToCreate = inviteCodes && inviteCodes.length > 0 
                    ? inviteCodes 
                    : [{ code: generateInviteCode(), maxUses: 10, note: '初始邀请码' }]

                const createdCodes = []
                for (const codeConfig of codesToCreate) {
                    const code = (codeConfig.code || generateInviteCode()).toUpperCase()
                    await codesCollection.add({
                        data: {
                            code,
                            status: 'active',
                            maxUses: codeConfig.maxUses || 10,
                            usedCount: 0,
                            note: codeConfig.note || '',
                            createdBy: username,
                            createdAt: now
                        }
                    })
                    createdCodes.push(code)
                }

                return { 
                    success: true, 
                    data: { 
                        message: '管理员创建成功',
                        inviteCodes: createdCodes
                    } 
                }
            }

            default:
                return { success: false, error: `Unknown action: ${action}` }
        }
    } catch (error) {
        console.error('User function error:', error)
        return { success: false, error: error.message }
    }
}
