import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import './app.scss'

// 检查用户登录状态
async function checkAuthStatus() {
  if (process.env.TARO_ENV !== 'weapp') return

  // 先检查本地存储
  const isLoggedIn = Taro.getStorageSync('isLoggedIn')
  if (!isLoggedIn) {
    Taro.redirectTo({ url: '/pages/login/index' })
    return
  }

  // 验证云端登录状态
  try {
    const res = await Taro.cloud.callFunction({
      name: 'user',
      data: { action: 'checkAuth' }
    }) as any

    if (!res.result?.success || !res.result?.data?.isRegistered) {
      Taro.removeStorageSync('isLoggedIn')
      Taro.removeStorageSync('currentUser')
      Taro.redirectTo({ url: '/pages/login/index' })
    } else if (res.result?.data?.user) {
      // 更新本地存储的用户信息
      Taro.setStorageSync('currentUser', res.result.data.user)
    }
  } catch (error) {
    console.error('Auth check failed:', error)
  }
}

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    // 初始化云开发
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud.init({
        env: 'cloud1-6go5u9dea0554e32',
        traceUser: true
      })
      // 延迟检查登录状态，确保云开发初始化完成
      setTimeout(() => {
        checkAuthStatus()
      }, 100)
    }
    console.log('App launched.')
  })

  return children
}

export default App
