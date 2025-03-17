const db = require('../config/database');

/**
 * Model Banner sử dụng kết nối MySQL trực tiếp
 */
class Banner {
  // Lấy tất cả banner
  static async findAll(options = {}) {
    try {
      let sql = `
        SELECT 
          id, 
          title, 
          description, 
          image_url, 
          link, 
          position, 
          show_title, 
          new_tab, 
          order_index,
          status,
          start_date,
          end_date,
          created_at,
          updated_at
        FROM banners
      `;
      
      const whereConditions = [];
      
      // Thêm điều kiện lọc theo position nếu có
      if (options.position) {
        const positions = Array.isArray(options.position) 
          ? options.position 
          : [options.position];
        
        whereConditions.push(`position IN ('${positions.join("','")}')`);
      }
      
      // Thêm điều kiện lọc theo status nếu có
      if (options.status) {
        whereConditions.push(`status = '${options.status}'`);
      }
      
      // Thêm điều kiện về thời gian hiển thị
      if (options.activeOnly) {
        whereConditions.push(`
          (
            (start_date IS NULL OR start_date <= CURDATE())
            AND
            (end_date IS NULL OR end_date >= CURDATE())
          )
        `);
      }
      
      // Thêm where clause nếu có điều kiện
      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      // Thêm order by nếu có
      if (options.order) {
        sql += ` ORDER BY ${options.order}`;
      } else {
        sql += ` ORDER BY position, order_index`;
      }
      
      // Thực thi truy vấn
      const [results] = await db.execute(sql);
      
      return results;
    } catch (error) {
      console.error('Error in Banner.findAll:', error);
      throw error;
    }
  }
  
  // Tìm banner theo ID
  static async findByPk(id) {
    try {
      const [results] = await db.execute(
        'SELECT * FROM banners WHERE id = ?',
        [id]
      );
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error in Banner.findByPk:', error);
      throw error;
    }
  }
  
  // Tạo banner mới
  static async create(bannerData) {
    try {
      const {
        title, description, image_url, link, position,
        show_title, new_tab, status, order_index,
        start_date, end_date
      } = bannerData;
      
      const [result] = await db.execute(
        `INSERT INTO banners (
          title, description, image_url, link, position,
          show_title, new_tab, status, order_index,
          start_date, end_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          title, 
          description || null, 
          image_url, 
          link || '#', 
          position,
          show_title ? 1 : 0, 
          new_tab ? 1 : 0, 
          status || 'active', 
          order_index || 0,
          start_date || null, 
          end_date || null
        ]
      );
      
      // Trả về object với ID mới
      return {
        id: result.insertId,
        ...bannerData
      };
    } catch (error) {
      console.error('Error in Banner.create:', error);
      throw error;
    }
  }
  
  // Cập nhật banner
  static async update(id, bannerData) {
    try {
      const {
        title, description, image_url, link, position,
        show_title, new_tab, status, order_index,
        start_date, end_date
      } = bannerData;
      
      await db.execute(
        `UPDATE banners SET
          title = ?,
          description = ?,
          image_url = ?,
          link = ?,
          position = ?,
          show_title = ?,
          new_tab = ?,
          status = ?,
          order_index = ?,
          start_date = ?,
          end_date = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          title,
          description || null,
          image_url,
          link || '#',
          position,
          show_title ? 1 : 0,
          new_tab ? 1 : 0,
          status || 'active',
          order_index || 0,
          start_date || null,
          end_date || null,
          id
        ]
      );
      
      return { id, ...bannerData };
    } catch (error) {
      console.error('Error in Banner.update:', error);
      throw error;
    }
  }
  
  // Xóa banner
  static async destroy(id) {
    try {
      await db.execute('DELETE FROM banners WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error in Banner.destroy:', error);
      throw error;
    }
  }
}

module.exports = Banner; 