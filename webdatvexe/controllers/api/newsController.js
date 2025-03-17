const db = require('../../config/database');

// Lấy tất cả tin tức
exports.getAllNews = async (req, res) => {
  try {
    const [news] = await db.execute('SELECT * FROM news ORDER BY created_at DESC');
    return res.success(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    return res.error('Error fetching news', 500);
  }
};

// Lấy tin tức theo ID
exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const [news] = await db.execute('SELECT * FROM news WHERE id = ?', [id]);
    
    if (news.length === 0) {
      return res.error('News not found', 404);
    }
    
    return res.success(news[0]);
  } catch (error) {
    console.error('Error fetching news:', error);
    return res.error('Error fetching news', 500);
  }
};

// Tạo tin tức mới (admin only)
exports.createNews = async (req, res) => {
  try {
    const { title, content, image_url } = req.body;
    
    if (!title || !content) {
      return res.error('Title and content are required', 400);
    }
    
    const [result] = await db.execute(
      'INSERT INTO news (title, content, image_url) VALUES (?, ?, ?)',
      [title, content, image_url || null]
    );
    
    const [newNews] = await db.execute('SELECT * FROM news WHERE id = ?', [result.insertId]);
    
    return res.success(newNews[0], 'News created successfully', 201);
  } catch (error) {
    console.error('Error creating news:', error);
    return res.error('Error creating news', 500);
  }
};

// Cập nhật tin tức (admin only)
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image_url } = req.body;
    
    // Check if news exists
    const [news] = await db.execute('SELECT * FROM news WHERE id = ?', [id]);
    if (news.length === 0) {
      return res.error('News not found', 404);
    }
    
    // Prepare update data
    const updates = [];
    const params = [];
    
    if (title) {
      updates.push('title = ?');
      params.push(title);
    }
    
    if (content) {
      updates.push('content = ?');
      params.push(content);
    }
    
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url);
    }
    
    if (updates.length === 0) {
      return res.error('No fields to update', 400);
    }
    
    // Add id to params
    params.push(id);
    
    // Update news
    await db.execute(
      `UPDATE news SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Get updated news
    const [updatedNews] = await db.execute('SELECT * FROM news WHERE id = ?', [id]);
    
    return res.success(updatedNews[0], 'News updated successfully');
  } catch (error) {
    console.error('Error updating news:', error);
    return res.error('Error updating news', 500);
  }
};

// Xóa tin tức (admin only)
exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if news exists
    const [news] = await db.execute('SELECT * FROM news WHERE id = ?', [id]);
    if (news.length === 0) {
      return res.error('News not found', 404);
    }
    
    // Delete news
    await db.execute('DELETE FROM news WHERE id = ?', [id]);
    
    return res.success(null, 'News deleted successfully');
  } catch (error) {
    console.error('Error deleting news:', error);
    return res.error('Error deleting news', 500);
  }
}; 