const db = require('../../config/database');
const AdminRouteModel = require('../../models/admin/AdminRouteModel');

class AdminRouteController {
  // List all routes
  async getAllRoutes(req, res) {
    try {
      const routes = await AdminRouteModel.getAllRoutes();
      res.render('admin/routes/index', {
        routes,
        messages: {
          success: req.flash('success'),
          error: req.flash('error')
        }
      });
    } catch (error) {
      console.error('Error getting routes:', error);
      req.flash('error', 'Có lỗi xảy ra khi tải danh sách tuyến xe');
      res.redirect('/admin/routes');
    }
  }

  // Show create route form
  showCreateForm(req, res) {
    res.render('admin/routes/form', {
      title: 'Thêm tuyến xe mới',
      route: {},
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  }

  // Create new route
  async createRoute(req, res) {
    try {
      const routeData = {
        from_location: req.body.from_location,
        to_location: req.body.to_location,
        distance: parseInt(req.body.distance) || 0,
        duration: req.body.duration,
        description: req.body.description || null,
        price: parseFloat(req.body.price) || 0,
        image: req.body.image_url || null
      };

      console.log('Creating route with data:', routeData); // Log để debug

      await AdminRouteModel.createRoute(routeData);
      req.flash('success', 'Thêm tuyến xe mới thành công');
      res.redirect('/admin/routes');
    } catch (error) {
      console.error('Error creating route:', error);
      req.flash('error', 'Có lỗi xảy ra khi thêm tuyến xe mới');
      res.redirect('/admin/routes/create');
    }
  }

  // Show edit route form
  async showEditForm(req, res) {
    try {
      const route = await AdminRouteModel.getRouteById(req.params.id);
      
      if (!route) {
        req.flash('error', 'Không tìm thấy tuyến xe');
        return res.redirect('/admin/routes');
      }

      res.render('admin/routes/form', {
        title: 'Sửa tuyến xe',
        route,
        messages: {
          error: req.flash('error'),
          success: req.flash('success')
        }
      });
    } catch (error) {
      console.error('Error getting route:', error);
      req.flash('error', 'Có lỗi xảy ra khi tải thông tin tuyến xe');
      res.redirect('/admin/routes');
    }
  }

  // Update route
  async updateRoute(req, res) {
    try {
      const routeData = {
        from_location: req.body.from_location,
        to_location: req.body.to_location,
        distance: parseInt(req.body.distance) || 0,
        duration: req.body.duration,
        description: req.body.description || null,
        price: parseFloat(req.body.price) || 0,
        image: req.body.image_url || null
      };

      console.log('Updating route with data:', routeData); // Log để debug

      await AdminRouteModel.updateRoute(req.params.id, routeData);
      req.flash('success', 'Cập nhật tuyến xe thành công');
      res.redirect('/admin/routes');
    } catch (error) {
      console.error('Error updating route:', error);
      req.flash('error', 'Có lỗi xảy ra khi cập nhật tuyến xe');
      res.redirect(`/admin/routes/${req.params.id}/edit`);
    }
  }

  // Delete route
  async deleteRoute(req, res) {
    try {
      await AdminRouteModel.deleteRoute(req.params.id);
      req.flash('success', 'Xóa tuyến xe thành công');
    } catch (error) {
      console.error('Error deleting route:', error);
      req.flash('error', error.message || 'Có lỗi xảy ra khi xóa tuyến xe');
    }
    res.redirect('/admin/routes');
  }
}

module.exports = new AdminRouteController();