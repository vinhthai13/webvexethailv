const Schedule = require('../../models/Schedule');
// *** Không sử dụng model Route ***
// const Route = require('../../models/user/Route');
const { formatDate, formatCurrency } = require('../../helpers/format');
const db = require('../../config/database');

exports.index = async (req, res) => {
  try {
    // Lấy các tuyến xe phổ biến trực tiếp từ bảng routes
    const routeSql = `
      SELECT 
        id,
        from_location,
        to_location,
        distance,
        duration,
        description,
        price,
        image
      FROM routes
      ORDER BY id
      LIMIT 8
    `;
    
    const [routes] = await db.execute(routeSql);
    
    // Lấy các banner từ bảng banners
    const bannerSql = `
      SELECT 
        id, 
        title, 
        description, 
        image_url, 
        link, 
        position, 
        show_title, 
        new_tab, 
        order_index
      FROM banners 
      WHERE status = 'active' 
        AND (
          (start_date IS NULL OR start_date <= CURDATE()) 
          AND 
          (end_date IS NULL OR end_date >= CURDATE())
        )
      ORDER BY position, order_index
    `;
    
    let banners = [];
    try {
      const [bannerResults] = await db.execute(bannerSql);
      banners = bannerResults;
      
      console.log('===== BANNERS DATA FROM DATABASE =====');
      console.log(`Found ${banners.length} active banners`);
      console.log('======================================');
    } catch (bannerError) {
      console.error('Error fetching banners:', bannerError);
      // Không throw lỗi, chỉ log ra để trang chủ vẫn hoạt động nếu có lỗi với banner
    }
    
    // In ra toàn bộ dữ liệu routes để debug
    console.log('===== ROUTES DATA FROM DATABASE =====');
    routes.forEach(route => {
      console.log(JSON.stringify(route));
    });
    console.log('=====================================');
    
    // Phân loại banner theo vị trí
    const topBanners = banners.filter(banner => banner.position === 'home_top');
    const middleBanners = banners.filter(banner => banner.position === 'home_middle');
    const bottomBanners = banners.filter(banner => banner.position === 'home_bottom');
    
    // Truyền routes và banners trực tiếp đến template
    res.render('user/home', {
      title: 'Trang chủ',
      routes: routes, // Dữ liệu gốc từ database
      topBanners,
      middleBanners,
      bottomBanners,
      banners, // Tất cả banner
      formatDate,
      formatCurrency
    });
  } catch (error) {
    console.error('Error in home controller:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Tìm kiếm lịch trình
exports.searchSchedules = async (req, res) => {
  try {
    const { from, to, date } = req.query;
    res.redirect(`/lich-trinh?from=${from}&to=${to}&date=${date}`);
  } catch (error) {
    console.error('Error in searchSchedules:', error);
    res.status(500).send('Internal Server Error');
  }
}; 