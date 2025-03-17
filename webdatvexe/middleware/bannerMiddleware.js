const db = require('../config/database');

/**
 * Middleware để tải banner từ database
 * và làm cho chúng khả dụng cho tất cả các trang trong ứng dụng
 */
const loadBanners = async (req, res, next) => {
  try {
    // Kiểm tra xem banners đã được lưu trong session chưa
    // Chỉ tải lại sau mỗi 15 phút để tối ưu hiệu suất
    const now = Date.now();
    const bannerCacheTime = 15 * 60 * 1000; // 15 phút

    if (
      !req.app.locals.banners || 
      !req.app.locals.lastBannerFetch || 
      (now - req.app.locals.lastBannerFetch) > bannerCacheTime
    ) {
      console.log('Tải lại banner từ database...');
      
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
      
      const [bannerResults] = await db.execute(bannerSql);
      
      // Phân loại banner theo vị trí
      const banners = bannerResults || [];
      const topBanners = banners.filter(banner => banner.position === 'home_top');
      const middleBanners = banners.filter(banner => banner.position === 'home_middle');
      const bottomBanners = banners.filter(banner => banner.position === 'home_bottom');
      const sidebarBanners = banners.filter(banner => banner.position === 'sidebar');
      
      // Lưu vào app.locals để tái sử dụng
      req.app.locals.banners = banners;
      req.app.locals.topBanners = topBanners;
      req.app.locals.middleBanners = middleBanners;
      req.app.locals.bottomBanners = bottomBanners;
      req.app.locals.sidebarBanners = sidebarBanners;
      req.app.locals.lastBannerFetch = now;
      
      console.log(`Đã tải ${banners.length} banner hoạt động`);
    }
    
    // Sao chép từ app.locals sang res.locals để views có thể truy cập
    res.locals.banners = req.app.locals.banners;
    res.locals.topBanners = req.app.locals.topBanners;
    res.locals.middleBanners = req.app.locals.middleBanners;
    res.locals.bottomBanners = req.app.locals.bottomBanners;
    res.locals.sidebarBanners = req.app.locals.sidebarBanners;
    
    next();
  } catch (error) {
    console.error('Lỗi khi tải banner:', error);
    // Không dừng request nếu có lỗi banner
    next();
  }
};

module.exports = loadBanners; 