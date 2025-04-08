const Chat = require('../../models/chat.model')
const { uploadToCloudinary } = require('../../helpers/uploadToCloudinary')

module.exports = async (res) => {
    const userId = res.locals.user.id
    const fullName = res.locals.user.fullName

    _io.once('connection', (socket) => {
        socket.on('Client_Send_Message', async (data) => {
            
            let images = []
            for(const image of data.images) {
                const link = await uploadToCloudinary(image)
                images.push(link)
            }
            
            const chat = new Chat({
                user_id: userId,
                content: data.content,
                images: images
            })
            await chat.save()

            _io.emit('Server_Return_Message', {
                userId: userId,
                fullName: fullName,
                content: data.content,
                images: images
            })
        })

        socket.on('Client_Send_Typing', (type) => {
            socket.broadcast.emit('Server_Return_Typing', {
                userId: userId,
                fullName: fullName,
                type: type
            })
        })
    })
}