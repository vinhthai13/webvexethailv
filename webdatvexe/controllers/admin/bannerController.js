const { Banner } = require('../../models');
const path = require('path');
const fs = require('fs');
const { uploadFile, deleteFile } = require('../../helpers/fileHelper');

// Hiển thị danh sách banner
exports.index = async (req, res) => {
  try {
    const banners = await Banner.findAll();
    
    res.render('admin/banners/index', {
      title: 'Quản lý Banner',
      banners,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách banner:', error);
    req.flash('error', 'Có lỗi xảy ra khi lấy danh sách banner');
    res.redirect('/admin/dashboard');
  }
};

// Hiển thị form tạo banner mới
exports.create = (req, res) => {
  res.render('admin/banners/create', {
    title: 'Thêm Banner mới',
    banner: {},
    messages: req.flash()
  });
};

// Lưu banner mới
exports.store = async (req, res) => {
  try {
    let bannerData = {
      title: req.body.title,
      description: req.body.description,
      link: req.body.link || '#',
      position: req.body.position,
      show_title: req.body.show_title === 'on',
      new_tab: req.body.new_tab === 'on',
      order_index: parseInt(req.body.order_index || 0),
      status: req.body.status || 'active',
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null
    };
    
    // Kiểm tra nếu có URL hình ảnh được cung cấp
    if (req.body.image_url && req.body.image_url.trim() !== '') {
      bannerData.image_url = req.body.image_url.trim();
    }
    // Nếu không có URL, kiểm tra file tải lên
    else if (req.files && req.files.image) {
      const uploadPath = 'public/uploads/banners/';
      const result = await uploadFile(req.files.image, uploadPath);
      
      if (result.success) {
        bannerData.image_url = result.filePath.replace('public/', '');
      } else {
        req.flash('error', 'Có lỗi khi tải lên hình ảnh: ' + result.error);
        return res.redirect('/admin/banners/create');
      }
    } else {
      req.flash('error', 'Vui lòng cung cấp hình ảnh hoặc URL hình ảnh');
      return res.redirect('/admin/banners/create');
    }
    
    // Lưu vào database
    await Banner.create(bannerData);
    
    req.flash('success', 'Thêm banner thành công');
    res.redirect('/admin/banners');
  } catch (error) {
    console.error('Lỗi khi tạo banner:', error);
    req.flash('error', 'Có lỗi xảy ra khi tạo banner');
    res.redirect('/admin/banners/create');
  }
};

// Hiển thị form chỉnh sửa banner
exports.edit = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    
    if (!banner) {
      req.flash('error', 'Không tìm thấy banner');
      return res.redirect('/admin/banners');
    }
    
    res.render('admin/banners/edit', {
      title: 'Chỉnh sửa Banner',
      banner,
      messages: req.flash()
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin banner:', error);
    req.flash('error', 'Có lỗi xảy ra khi lấy thông tin banner');
    res.redirect('/admin/banners');
  }
};

// Cập nhật banner
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      req.flash('error', 'Không tìm thấy banner');
      return res.redirect('/admin/banners');
    }
    
    let bannerData = {
      title: req.body.title,
      description: req.body.description,
      link: req.body.link || '#',
      position: req.body.position,
      show_title: req.body.show_title === 'on',
      new_tab: req.body.new_tab === 'on',
      order_index: parseInt(req.body.order_index || 0),
      status: req.body.status || 'active',
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null
    };
    
    // Kiểm tra nếu có URL hình ảnh được cung cấp
    if (req.body.image_url && req.body.image_url.trim() !== '') {
      // Kiểm tra xem URL có thay đổi so với URL hiện tại không
      if (banner.image_url !== req.body.image_url.trim()) {
        // Nếu URL cũ là file đã tải lên, xóa file cũ
        if (banner.image_url && !banner.image_url.startsWith('http')) {
          const oldImagePath = path.join('public', banner.image_url);
          deleteFile(oldImagePath);
        }
        
        bannerData.image_url = req.body.image_url.trim();
      } else {
        // Giữ nguyên URL cũ
        bannerData.image_url = banner.image_url;
      }
    }
    // Nếu không có URL, kiểm tra file tải lên
    else if (req.files && req.files.image) {
      const uploadPath = 'public/uploads/banners/';
      const result = await uploadFile(req.files.image, uploadPath);
      
      if (result.success) {
        // Xóa hình ảnh cũ nếu là file đã tải lên
        if (banner.image_url && !banner.image_url.startsWith('http')) {
          const oldImagePath = path.join('public', banner.image_url);
          deleteFile(oldImagePath);
        }
        
        bannerData.image_url = result.filePath.replace('public/', '');
      } else {
        req.flash('error', 'Có lỗi khi tải lên hình ảnh: ' + result.error);
        return res.redirect(`/admin/banners/${id}/edit`);
      }
    } else {
      // Giữ lại hình ảnh cũ
      bannerData.image_url = banner.image_url;
    }
    
    // Cập nhật database
    await Banner.update(id, bannerData);
    
    req.flash('success', 'Cập nhật banner thành công');
    res.redirect('/admin/banners');
  } catch (error) {
    console.error('Lỗi khi cập nhật banner:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật banner');
    res.redirect(`/admin/banners/${req.params.id}/edit`);
  }
};

// Xóa banner
exports.destroy = async (req, res) => {
  try {
    const id = req.params.id;
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      req.flash('error', 'Không tìm thấy banner');
      return res.redirect('/admin/banners');
    }
    
    // Xóa file hình ảnh nếu là file đã tải lên (không phải URL bên ngoài)
    if (banner.image_url && !banner.image_url.startsWith('http')) {
      const imagePath = path.join('public', banner.image_url);
      deleteFile(imagePath);
    }
    
    // Xóa từ database
    await Banner.destroy(id);
    
    req.flash('success', 'Xóa banner thành công');
    res.redirect('/admin/banners');
  } catch (error) {
    console.error('Lỗi khi xóa banner:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa banner');
    res.redirect('/admin/banners');
  }
}; 