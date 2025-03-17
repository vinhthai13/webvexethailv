const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// List all tables
router.get('/', async (req, res) => {
  try {
    const [tables] = await db.execute('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    let currentTable = req.query.table;
    let columns = [];
    let rows = [];
    
    if (currentTable) {
      [columns] = await db.execute(`SHOW COLUMNS FROM ${currentTable}`);
      [rows] = await db.execute(`SELECT * FROM ${currentTable} LIMIT 100`);
    }

    res.render('admin/database/index', {
      title: 'Quản lý Cơ sở dữ liệu',
      tables: tableNames,
      currentTable,
      columns,
      rows
    });
  } catch (err) {
    console.error('Database management error:', err);
    res.status(500).render('error', {
      message: 'Có lỗi xảy ra khi tải thông tin cơ sở dữ liệu',
      error: {
        status: 500,
        stack: process.env.NODE_ENV === 'development' ? err.stack : ''
      }
    });
  }
});

// Get table structure
router.get('/:table/structure', async (req, res) => {
  try {
    const [columns] = await db.execute(`SHOW FULL COLUMNS FROM ${req.params.table}`);
    res.json(columns);
  } catch (err) {
    console.error('Error fetching table structure:', err);
    res.status(500).json({ error: 'Có lỗi xảy ra khi tải cấu trúc bảng' });
  }
});

// Create new table
router.post('/create', async (req, res) => {
  try {
    const { tableName, columns } = req.body;
    
    let columnDefinitions = columns.map(col => {
      let def = `${col.name} ${col.type}`;
      if (col.length) def += `(${col.length})`;
      if (!col.nullable) def += ' NOT NULL';
      return def;
    }).join(', ');

    await db.execute(`CREATE TABLE ${tableName} (${columnDefinitions})`);
    
    res.redirect('/admin/database?success=Tạo bảng thành công');
  } catch (err) {
    console.error('Error creating table:', err);
    res.redirect('/admin/database?error=Có lỗi xảy ra khi tạo bảng');
  }
});

// Delete table
router.delete('/:table', async (req, res) => {
  try {
    await db.execute(`DROP TABLE ${req.params.table}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting table:', err);
    res.status(500).json({ error: 'Có lỗi xảy ra khi xóa bảng' });
  }
});

// Execute custom query
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    const [results] = await db.execute(query);
    res.json(results);
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete row
router.delete('/:table/row', async (req, res) => {
  try {
    const conditions = Object.entries(req.body)
      .map(([key, value]) => `${key} = ?`)
      .join(' AND ');
    const values = Object.values(req.body);

    await db.execute(`DELETE FROM ${req.params.table} WHERE ${conditions}`, values);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting row:', err);
    res.status(500).json({ error: 'Có lỗi xảy ra khi xóa dữ liệu' });
  }
});

module.exports = router; 