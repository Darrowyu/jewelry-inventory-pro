import Taro from '@tarojs/taro'

/**
 * 上传图片到云存储
 * @param filePath 本地文件路径
 * @returns 云文件ID
 */
export const uploadImage = async (filePath: string): Promise<string> => {
    try {
        const cloudPath = `products/${Date.now()}-${Math.floor(Math.random() * 1000)}.png`

        const res = await Taro.cloud.uploadFile({
            cloudPath,
            filePath
        })

        return res.fileID
    } catch (error) {
        console.error('上传图片失败:', error)
        throw error
    }
}

/**
 * 选择图片
 * @returns 本地文件路径列表
 */
export const chooseImage = async (count: number = 1): Promise<string[]> => {
    try {
        const res = await Taro.chooseImage({
            count,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera']
        })
        return res.tempFilePaths
    } catch (error) {
        console.error('选择图片失败:', error)
        return []
    }
}
