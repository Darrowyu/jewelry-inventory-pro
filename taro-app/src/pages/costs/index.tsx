import { useState, useMemo } from 'react'
import { View, Text, Input, Picker, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { costService } from '../../services/cloud'
import { CostItem, CostCategory } from '../../types'
import { COST_CATEGORY_OPTIONS, COST_COLORS } from '../../constants'
import CostMoneyIcon from '../../assets/icons/cost-money.svg'
import EditIcon from '../../assets/icons/edit.svg'
import DeleteIcon from '../../assets/icons/delete.svg'
import EmptyDocIcon from '../../assets/icons/empty-doc.svg'
import LoadingIcon from '../../assets/icons/loading.svg'
import './index.scss'

export default function Costs() {
    const [costs, setCosts] = useState<CostItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [activeItemId, setActiveItemId] = useState<string | null>(null)
    const [form, setForm] = useState({
        name: '',
        amount: 0,
        category: CostCategory.EQUIPMENT
    })

    useDidShow(() => {
        loadCosts()
    })

    const loadCosts = async () => {
        try {
            setLoading(true)
            const data = await costService.list()
            setCosts(data)
        } catch (error) {
            console.error('加载成本失败:', error)
            Taro.showToast({ title: '加载失败', icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const totalCosts = useMemo(() => {
        return costs.reduce((sum, c) => sum + (c.amount || 0), 0)
    }, [costs])

    const costsByCategory = useMemo(() => {
        return COST_CATEGORY_OPTIONS.map(cat => ({
            ...cat,
            total: costs.filter(c => c.category === cat.value).reduce((sum, c) => sum + (c.amount || 0), 0),
            count: costs.filter(c => c.category === cat.value).length
        }))
    }, [costs])

    const resetForm = () => {
        setForm({ name: '', amount: 0, category: CostCategory.EQUIPMENT })
        setEditingId(null)
    }

    const handleOpenModal = (cost?: CostItem) => {
        if (cost) {
            setEditingId(cost._id || null)
            setForm({
                name: cost.name,
                amount: cost.amount,
                category: cost.category
            })
        } else {
            resetForm()
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        resetForm()
    }

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            Taro.showToast({ title: '请输入名称', icon: 'none' })
            return
        }
        if (form.amount <= 0) {
            Taro.showToast({ title: '请输入金额', icon: 'none' })
            return
        }

        try {
            setSubmitting(true)
            if (editingId) {
                await costService.update(editingId, {
                    name: form.name,
                    amount: form.amount,
                    category: form.category
                })
                Taro.showToast({ title: '更新成功', icon: 'success' })
            } else {
                await costService.add({
                    name: form.name,
                    amount: form.amount,
                    category: form.category
                })
                Taro.showToast({ title: '添加成功', icon: 'success' })
            }
            handleCloseModal()
            loadCosts()
        } catch (error) {
            console.error('保存成本失败:', error)
            Taro.showToast({ title: '保存失败', icon: 'error' })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteCost = (cost: CostItem) => {
        Taro.showModal({
            title: '确认删除',
            content: `确定要删除"${cost.name}"吗？`,
            confirmColor: '#DC2626',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await costService.delete(cost._id || '')
                        Taro.showToast({ title: '删除成功', icon: 'success' })
                        loadCosts()
                    } catch (error) {
                        console.error('删除失败:', error)
                        Taro.showToast({ title: '删除失败', icon: 'error' })
                    }
                }
            }
        })
    }

    const getCategoryLabel = (category: string) => {
        return COST_CATEGORY_OPTIONS.find(c => c.value === category)?.label || category
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return ''
        return dateStr.split('T')[0]
    }

    const handleItemClick = (costId: string) => {
        setActiveItemId(activeItemId === costId ? null : costId)
    }

    return (
        <View className='costs-page'>
            <ScrollView scrollY showScrollbar={false} className='scroll-content'>
                {/* 总成本卡片 */}
                <View className='total-card'>
                    <View className='total-header'>
                        <Image className='total-icon-img' src={CostMoneyIcon} mode='aspectFit' />
                        <Text className='total-label'>累计成本</Text>
                    </View>
                    <Text className='total-value'>¥ {totalCosts.toLocaleString()}</Text>
                    <Text className='total-desc'>共 {costs.length} 笔支出记录</Text>
                </View>

                {/* 分类汇总 */}
                {costsByCategory.filter(c => c.count > 0).length > 0 && (
                    <View className='section'>
                        <View className='section-header'>
                            <Text className='section-title'>分类汇总</Text>
                            <View className='section-line' />
                        </View>
                        <ScrollView scrollX showScrollbar={false} className='category-scroll'>
                            <View className='category-list'>
                                {costsByCategory.filter(c => c.count > 0).map(cat => (
                                    <View key={cat.value} className='category-card'>
                                        <View className='category-dot' style={{ background: COST_COLORS[cat.value] }} />
                                        <Text className='category-name'>{cat.label}</Text>
                                        <Text className='category-amount'>¥{cat.total.toLocaleString()}</Text>
                                        <Text className='category-count'>{cat.count}笔</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* 成本明细 */}
                <View className='section'>
                    <View className='section-header'>
                        <Text className='section-title'>成本明细</Text>
                        <View className='section-line' />
                    </View>
                    <View className='cost-list'>
                        {loading ? (
                            <View className='empty-state'>
                                <Image className='empty-icon-img' src={LoadingIcon} mode='aspectFit' />
                                <Text>加载中...</Text>
                            </View>
                        ) : costs.length === 0 ? (
                            <View className='empty-state'>
                                <Image className='empty-icon-img' src={EmptyDocIcon} mode='aspectFit' />
                                <Text>暂无成本记录</Text>
                                <Text className='empty-hint'>点击下方按钮添加第一笔成本</Text>
                            </View>
                        ) : (
                            costs.map(cost => (
                                <View
                                    key={cost._id}
                                    className={`cost-item ${activeItemId === cost._id ? 'active' : ''}`}
                                    onClick={() => handleItemClick(cost._id || '')}
                                >
                                    <View className='cost-main'>
                                        <View className='cost-badge' style={{ background: COST_COLORS[cost.category] + '15' }}>
                                            <Text className='badge-icon' style={{ color: COST_COLORS[cost.category] }}>¥</Text>
                                        </View>
                                        <View className='cost-info'>
                                            <Text className='cost-name'>{cost.name}</Text>
                                            <View className='cost-meta'>
                                                <Text className='cost-category' style={{ color: COST_COLORS[cost.category] }}>{getCategoryLabel(cost.category)}</Text>
                                                <Text className='cost-dot'>·</Text>
                                                <Text className='cost-date'>{formatDate(cost.date)}</Text>
                                            </View>
                                        </View>
                                        <Text className='cost-amount'>¥{(cost.amount || 0).toLocaleString()}</Text>
                                    </View>
                                    {activeItemId === cost._id && (
                                        <View className='cost-actions'>
                                            <View className='action-btn edit' onClick={(e) => { e.stopPropagation(); handleOpenModal(cost) }}>
                                                <Image className='action-icon-img' src={EditIcon} mode='aspectFit' />
                                                <Text>编辑</Text>
                                            </View>
                                            <View className='action-btn delete' onClick={(e) => { e.stopPropagation(); handleDeleteCost(cost) }}>
                                                <Image className='action-icon-img' src={DeleteIcon} mode='aspectFit' />
                                                <Text>删除</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View style={{ height: '180px' }} />
            </ScrollView>

            {/* 添加按钮 */}
            <View className='add-btn' onClick={() => handleOpenModal()}>
                <Text className='add-icon'>+</Text>
                <Text>添加成本</Text>
            </View>

            {/* 添加/编辑成本弹窗 */}
            {
                showModal && (
                    <View className='modal-mask' onClick={handleCloseModal}>
                        <View className='modal-content' onClick={e => e.stopPropagation()}>
                            <View className='modal-header'>
                                <Text className='modal-title'>{editingId ? '编辑成本' : '添加成本'}</Text>
                                <View className='modal-close' onClick={handleCloseModal}>
                                    <Text>×</Text>
                                </View>
                            </View>

                            <View className='form-item'>
                                <Text className='form-label'>名称</Text>
                                <Input
                                    className='form-input'
                                    placeholder='请输入成本名称'
                                    value={form.name}
                                    onInput={e => setForm({ ...form, name: e.detail.value })}
                                />
                            </View>

                            <View className='form-item'>
                                <Text className='form-label'>金额</Text>
                                <Input
                                    className='form-input'
                                    type='digit'
                                    placeholder='0.00'
                                    value={form.amount ? String(form.amount) : ''}
                                    onInput={e => setForm({ ...form, amount: Number(e.detail.value) || 0 })}
                                />
                            </View>

                            <View className='form-item'>
                                <Text className='form-label'>分类</Text>
                                <Picker
                                    mode='selector'
                                    range={COST_CATEGORY_OPTIONS.map(o => o.label)}
                                    onChange={e => setForm({ ...form, category: COST_CATEGORY_OPTIONS[Number(e.detail.value)].value })}
                                >
                                    <View className='form-picker'>
                                        <Text>{getCategoryLabel(form.category)}</Text>
                                        <Text className='picker-arrow'>›</Text>
                                    </View>
                                </Picker>
                            </View>

                            <View
                                className={`submit-btn ${submitting ? 'disabled' : ''}`}
                                onClick={submitting ? undefined : handleSubmit}
                            >
                                <Text>{submitting ? '提交中...' : (editingId ? '确认修改' : '确认添加')}</Text>
                            </View>
                        </View>
                    </View>
                )
            }
        </View >
    )
}
