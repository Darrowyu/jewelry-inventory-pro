export const formatTime = (date: string | Date | undefined) => {
    if (!date) return '-'
    const d = new Date(date)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const hour = d.getHours().toString().padStart(2, '0')
    const minute = d.getMinutes().toString().padStart(2, '0')
    const second = d.getSeconds().toString().padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

export const formatNumber = (n: number | string) => {
    n = n.toString()
    return n[1] ? n : `0${n}`
}

export * from './upload'
