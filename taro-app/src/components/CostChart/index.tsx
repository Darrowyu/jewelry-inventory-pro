import { View } from '@tarojs/components'
import { memo } from 'react'
import { COST_COLORS } from '../../constants'
import './index.scss'

interface CostChartProps {
    data: { name: string; value: number; category?: string }[]
}

const CostChart = memo(({ data }: CostChartProps) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)

    // 计算渐变段
    let currentDeg = 0
    const gradients = data.map(item => {
        const percent = total > 0 ? item.value / total : 0
        const deg = percent * 360
        const color = COST_COLORS[item.category || ''] || '#CBD5E1'
        const segment = `${color} ${currentDeg}deg ${currentDeg + deg}deg`
        currentDeg += deg
        return segment
    }).join(', ')

    // 如果没有数据，显示灰色圆环
    const finalGradient = gradients || '#F3F4F6 0deg 360deg'

    return (
        <View className='chart-container'>
            <View
                className='donut-chart'
                style={{ background: `conic-gradient(${finalGradient})` }}
            >
                <View className='donut-hole' />
            </View>
        </View>
    )
})

export default CostChart
