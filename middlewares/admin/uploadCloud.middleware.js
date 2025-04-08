const { uploadToCloudinary } = require('../../helpers/uploadToCloudinary')

module.exports.upload = async (req, res, next) => {
  try {
    if (req.file) {
      console.log("Đang tải lên hình ảnh lên Cloudinary...");
      const result = await uploadToCloudinary(req.file.buffer);
      
      if (result) {
        console.log("Tải lên thành công:", result);
        req.body[req.file.fieldname] = result;
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