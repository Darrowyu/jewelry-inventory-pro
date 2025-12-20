import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    // 初始化云开发
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud.init({
        env: 'cloud1-6go5u9dea0554e32', // 替换为您的云开发环境ID
        traceUser: true
      })
    }
    console.log('App launched.')
  })

  return children
}

export default App
