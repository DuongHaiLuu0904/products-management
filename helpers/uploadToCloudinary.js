import { v2 as cloudinary } from 'cloudinary';
import { createReadStream } from 'streamifier';

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET
})

let streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
                resolve(result);
            } else {
                reject(error);
            }
        })

        createReadStream(buffer).pipe(stream);
    })
}

export const uploadToCloudinary = async (buffer) => {
    let result = await streamUpload(buffer)
    return {
        url: result.url,
        public_id: result.public_id
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.log("Error deleting image from Cloudinary:", error);
        return null;
    }
}

export default { uploadToCloudinary, deleteFromCloudinary };

