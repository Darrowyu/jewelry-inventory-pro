/**
 * 管理员密码重置工具
 * 使用方法: node reset-password.js <新密码>
 * 示例: node reset-password.js admin123
 */

const crypto = require('crypto')

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
}

function generateSalt() {
    return crypto.randomBytes(16).toString('hex')
}

const newPassword = process.argv[2] || 'admin123'

const salt = generateSalt()
const passwordHash = hashPassword(newPassword, salt)

console.log('\n========================================')
console.log('  管理员密码重置工具')
console.log('========================================\n')
console.log(`新密码: ${newPassword}`)
console.log('\n请在云开发控制台更新以下字段:\n')
console.log('----------------------------------------')
console.log(`"salt": "${salt}"`)
console.log('----------------------------------------')
console.log(`"passwordHash": "${passwordHash}"`)
console.log('----------------------------------------')
console.log('\n操作步骤:')
console.log('1. 打开微信开发者工具 → 云开发 → 数据库')
console.log('2. 选择 jewelry_users 集合')
console.log('3. 找到 role: "admin" 的记录')
console.log('4. 点击编辑，复制上面的 salt 和 passwordHash 替换原值')
console.log('5. 保存即可\n')
