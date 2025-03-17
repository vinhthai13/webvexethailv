// Script để thêm và cập nhật cột image trong bảng routes
const db = require('../config/database');

async function fixRoutesImage() {
  try {
    console.log('Bắt đầu cập nhật cột image cho bảng routes...');
    
    // Kiểm tra xem cột image đã tồn tại trong bảng routes chưa
    const [columns] = await db.execute(`
      SHOW COLUMNS FROM routes LIKE 'image'
    `);
    
    // Nếu cột image chưa tồn tại, thêm nó vào bảng
    if (columns.length === 0) {
      console.log('Cột image chưa tồn tại. Đang thêm cột...');
      await db.execute(`
        ALTER TABLE routes ADD COLUMN image VARCHAR(255) DEFAULT NULL COMMENT 'Link hình ảnh tuyến xe'
      `);
      console.log('Đã thêm cột image vào bảng routes.');
    } else {
      console.log('Cột image đã tồn tại trong bảng routes.');
    }
    
    // Cập nhật hình ảnh mặc định cho tất cả các tuyến xe chưa có hình ảnh
    console.log('Đang cập nhật hình ảnh mặc định cho các tuyến xe...');
    const [result] = await db.execute(`
      UPDATE routes 
      SET image = CONCAT('https://via.placeholder.com/800x400?text=', REPLACE(CONCAT(from_location, ' - ', to_location), ' ', '+')) 
      WHERE image IS NULL OR image = ''
    `);
    
    console.log(`Đã cập nhật ${result.affectedRows} tuyến xe với hình ảnh mặc định.`);
    
    // Kiểm tra kết quả
    const [routes] = await db.execute(`
      SELECT id, from_location, to_location, image 
      FROM routes 
      LIMIT 5
    `);
    
    console.log('Mẫu dữ liệu sau khi cập nhật:');
    console.table(routes);
    
    console.log('Hoàn tất cập nhật cột image cho bảng routes!');
  } catch (error) {
    console.error('Lỗi khi cập nhật cột image:', error);
  } finally {
    // Đóng kết nối
    process.exit();
  }
}

// Chạy hàm
fixRoutesImage(); 