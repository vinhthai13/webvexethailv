const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Tải lên file và lưu vào thư mục chỉ định
 * @param {Object} file - File object từ express-fileupload
 * @param {String} uploadDirectory - Đường dẫn đến thư mục lưu file
 * @returns {Object} Kết quả upload {success, filePath, error}
 */
exports.uploadFile = async (file, uploadDirectory) => {
  try {
    // Kiểm tra thư mục tồn tại
    if (!fs.existsSync(uploadDirectory)) {
      fs.mkdirSync(uploadDirectory, { recursive: true });
    }
    
    // Tạo tên file duy nhất
    const fileExt = path.extname(file.name).toLowerCase();
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDirectory, fileName);
    
    // Di chuyển file
    await file.mv(filePath);
    
    return {
      success: true,
      filePath,
      fileName
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Xóa file từ hệ thống
 * @param {String} filePath - Đường dẫn đến file cần xóa
 * @returns {Boolean} Kết quả xóa file
 */
exports.deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}; 