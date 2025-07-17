import { uploadToCloudinary } from '../../helpers/uploadToCloudinary.js';

export async function upload(req, res, next) {
    try {
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);

            if (result) {
                req.body[req.file.fieldname] = result.url;
                req.body.public_id = result.public_id;
            } else {
                console.error("Không nhận được URL từ Cloudinary");
            }
        }
        next();
    } catch (error) {
        console.error("Lỗi khi tải ảnh lên Cloudinary:", error);
        next();
    }
}