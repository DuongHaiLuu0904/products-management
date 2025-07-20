import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Chat from '../models/chat.model.js'

dotenv.config()

// Kết nối database
mongoose.connect(process.env.MONGGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const fixChatImages = async () => {
    try {
        console.log('Bắt đầu fix dữ liệu chat images...')
        
        // Tìm tất cả chat có images
        const chats = await Chat.find({
            images: { $exists: true, $ne: [] }
        })
        
        console.log(`Tìm thấy ${chats.length} chat có images`)
        
        let updatedCount = 0
        
        for (const chat of chats) {
            let needUpdate = false
            const newImages = []
            
            for (const image of chat.images) {
                if (typeof image === 'object' && image.url) {
                    // Dữ liệu cũ dạng object, chuyển thành URL
                    newImages.push(image.url)
                    needUpdate = true
                } else if (typeof image === 'string') {
                    // Dữ liệu đã đúng dạng string URL
                    newImages.push(image)
                } else {
                    console.log('Dữ liệu image không hợp lệ:', image)
                    newImages.push(image) // Giữ nguyên để kiểm tra sau
                }
            }
            
            if (needUpdate) {
                await Chat.updateOne(
                    { _id: chat._id },
                    { images: newImages }
                )
                updatedCount++
                console.log(`Updated chat ${chat._id}`)
            }
        }
        
        console.log(`Đã cập nhật ${updatedCount} chat`)
        console.log('Hoàn thành fix dữ liệu!')
        
    } catch (error) {
        console.error('Lỗi khi fix dữ liệu:', error)
    } finally {
        mongoose.connection.close()
    }
}

fixChatImages()
