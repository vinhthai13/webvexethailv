-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th3 17, 2025 lúc 10:21 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `webdatvexe`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_super_admin` tinyint(1) DEFAULT 0,
  `status` enum('active','inactive') DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`, `email`, `full_name`, `phone`, `is_super_admin`, `status`, `last_login`, `created_at`, `updated_at`) VALUES
(4, 'user11', '$2b$10$ufL5bz1bA4eFwd2z25eyTOVsHD072Z5tXO5Ix9m7xRMPL8EfbgprK', 'bechuot6879@gmail.com', NULL, '0123456789', 0, 'active', NULL, '2025-03-03 19:52:10', '2025-03-03 19:52:10'),
(6, 'admin', '1322004', 'admin@example.com', 'System Admin', '0123456789', 1, 'active', '2025-03-18 04:18:04', '2025-03-04 00:55:26', '2025-03-17 21:18:04');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `banners`
--

CREATE TABLE `banners` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) NOT NULL,
  `link` varchar(255) DEFAULT '#',
  `position` enum('home_top','home_middle','home_bottom','sidebar') NOT NULL,
  `show_title` tinyint(1) DEFAULT 0,
  `new_tab` tinyint(1) DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `order_index` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `banners`
--

INSERT INTO `banners` (`id`, `title`, `description`, `image_url`, `link`, `position`, `show_title`, `new_tab`, `start_date`, `end_date`, `status`, `order_index`, `created_at`, `updated_at`) VALUES
(1, 'Khuyến mãi tháng 3 - Giảm 20% tất cả các tuyến', 'Ưu đãi đặc biệt dành cho khách hàng đặt vé trước 7 ngày', 'https://kumhosamco.com.vn/wp-content/uploads/BANNER-WEBSITE-1360-x-540-px-2.png', '/khuyen-mai', 'home_top', 1, 1, NULL, NULL, 'active', 1, '2025-03-17 20:08:37', '2025-03-17 20:49:26'),
(2, 'Trải nghiệm xe giường nằm cao cấp', 'Trang bị đầy đủ tiện nghi, wifi miễn phí, nước uống, khăn lạnh', 'https://muabanxekhach.com.vn/wp-content/uploads/2018/07/samco-growin-bau-hoi-may-day-isuzu.jpg', '/loai-xe/giuong-nam', 'home_top', 1, 1, NULL, NULL, 'active', 2, '2025-03-17 20:08:37', '2025-03-17 20:50:54'),
(3, 'Mở tuyến mới Hà Nội - Quảng Ninh', 'Khởi hành hàng ngày với nhiều khung giờ lựa chọn', 'https://xehalong.vn/wp-content/uploads/2023/09/banner-3.jpg', 'https://xehalong.vn/wp-content/uploads/2023/09/banner-3.jpg', 'home_middle', 1, 1, NULL, NULL, 'active', 1, '2025-03-17 20:08:37', '2025-03-17 20:40:11'),
(4, 'Đặt vé nhóm - Giảm đến 25%', 'Áp dụng cho nhóm từ 5 người trở lên khi đặt cùng lúc', 'https://carshop.vn/wp-content/uploads/2022/07/images1151040_xekhach.jpg', '/dat-ve-nhom', 'home_middle', 1, 1, NULL, NULL, 'active', 2, '2025-03-17 20:08:37', '2025-03-17 20:40:57'),
(5, 'Ưu đãi đặc biệt cho sinh viên', 'Giảm 10% khi xuất trình thẻ sinh viên', 'https://haiaubus.vn/wp-content/uploads/2023/09/z4704404433799_ed6459936c65c0dbb5bc6450ea277deb.jpg', '/uu-dai/sinh-vien', 'sidebar', 1, 1, NULL, NULL, 'active', 1, '2025-03-17 20:08:37', '2025-03-17 20:52:00'),
(6, 'Limousine VIP - Đẳng cấp khác biệt', 'Số lượng ghế giới hạn, không gian riêng tư tối đa', 'https://dcar-limousine.com/wp-content/uploads/2022/04/dcar-limousine-vip-lounge-1.jpg', '/loai-xe/limousine', 'home_bottom', 1, 1, NULL, NULL, 'active', 1, '2025-03-17 20:08:37', '2025-03-17 20:41:34'),
(7, 'Tải ứng dụng - Nhận ưu đãi độc quyền', 'Giảm thêm 5% cho lần đặt vé đầu tiên qua ứng dụng', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS34CQMHjWV4e_Ey4G5Lww5BK9U9Grg07wP4w&s', '/download-app', 'home_bottom', 1, 1, NULL, NULL, 'active', 2, '2025-03-17 20:08:37', '2025-03-17 20:51:31'),
(8, 'Chương trình tích điểm thành viên', 'Tích lũy điểm thưởng và đổi quà hấp dẫn', 'https://haiaubus.vn/wp-content/uploads/2023/09/z4704404433799_ed6459936c65c0dbb5bc6450ea277deb.jpg', '/khach-hang-than-thiet', 'sidebar', 1, 1, NULL, NULL, 'active', 2, '2025-03-17 20:08:37', '2025-03-17 20:55:18');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `schedule_id` int(11) DEFAULT NULL,
  `seats` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `booking_date` date DEFAULT NULL,
  `booking_time` time DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `booking_code` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status_id` int(11) NOT NULL DEFAULT 1,
  `ticket_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `schedule_id`, `seats`, `total_price`, `booking_date`, `booking_time`, `customer_name`, `phone`, `email`, `booking_code`, `created_at`, `status_id`, `ticket_image`) VALUES
(5, 1, 1, 1, 500000.00, '2025-02-26', '21:55:55', 'thái', '01234567891', 'user1@example.com', 'BK-164891', '2025-02-26 14:55:55', 2, NULL),
(7, 1, 1, 1, 500000.00, '2025-02-28', '13:31:26', 'thái', '01234567891', 'user1@example.com', 'BK-459509', '2025-02-28 06:31:26', 2, NULL),
(9, 1, 9, 1, 500000.00, '2025-03-07', '19:36:37', 'vlogs Chuối', '01234567891', 'levthai@gmai.com', 'BK-949455', '2025-03-07 12:36:37', 2, NULL),
(10, 1, 2, 1, 500000.00, '2025-03-07', '19:39:29', 'vlogs Chuối1', '0123456789', '9qzfxmzxu2@teihu.com', 'BK-526783', '2025-03-07 12:39:29', 2, NULL),
(11, 1, 9, 1, 500000.00, '2025-03-07', '19:41:59', 't', '0978534132', 'levthai@gmai.com', 'BK-393725', '2025-03-07 12:41:59', 2, NULL),
(12, 1, 3, 1, 400000.00, '2025-03-07', '19:43:52', 'vlogs Chuối111', '0123456789', 'bechuot6879@gmail.com', 'BK-220887', '2025-03-07 12:43:52', 2, NULL),
(13, 1, 2, 1, 500000.00, '2025-03-07', '19:44:27', 'vlogs Chuối11', '0123456789', 'bechuot6879@gmail.com', 'BK-509098', '2025-03-07 12:44:27', 2, NULL),
(14, 1, 10, 1, 400000.00, '2025-03-07', '19:46:57', 'vlogs Chuối11', '0978534132', 'admin@gmail.com', 'BK-121454', '2025-03-07 12:46:57', 2, NULL),
(15, 7, 10, 1, 400000.00, '2025-03-07', '21:00:30', 'thai', '0976543123', 'jwrhug19tq@teihu.com', 'BK-330360', '2025-03-07 14:00:30', 2, NULL),
(16, 1, 1, 1, 500000.00, '2025-03-07', '21:13:01', 'vlogs Chuối', '0123456789', 'levthai@gmai.com', 'BK-494539', '2025-03-07 14:13:01', 4, NULL),
(17, 1, 1, 1, 500000.00, '2025-03-07', '21:15:42', 'vlogs Chuối', '0123456721', 'levthai@gmai.com', 'BK-739581', '2025-03-07 14:15:42', 4, NULL),
(18, 1, 13, 1, 111111.00, '2025-03-17', '16:11:14', 'vlogs Chuối11', '0978534132', 'levthai@gmai.com', 'BK-952324', '2025-03-17 09:11:14', 4, NULL),
(19, 1, 2, 11, 5500000.00, '2025-03-17', '18:29:15', 'thAI', '0978534132', 'levthai@gmai.com', 'BK-462221', '2025-03-17 11:29:15', 4, NULL),
(20, 1, 2, 11, 5500000.00, '2025-03-17', '20:02:24', 'thAI', '0978534132', 'levinhthai204@gmai.com', NULL, '2025-03-17 13:02:24', 4, NULL),
(21, 1, 14, 11, 19360000.00, '2025-03-17', '20:08:46', 'thAI', '0978534132', 'levinhthai2020@gmail.com', NULL, '2025-03-17 13:08:46', 4, NULL),
(22, 1, 2, 11, 5500000.00, '2025-03-17', '20:14:01', 'thAI', '0978534132', 'levinhthai2020@gmail.com', NULL, '2025-03-17 13:14:01', 4, NULL),
(23, 1, 2, 2, 1000000.00, '2025-03-17', '20:18:53', 't', '0123456789', 'levinhthai2020@gmail.com', NULL, '2025-03-17 13:18:53', 3, NULL),
(24, 1, 2, 1, 500000.00, '2025-03-17', '20:47:08', 'vlogs Chuối11', '0123456789', 'levinhthai2020@gmail.com', 'BK-785673', '2025-03-17 13:47:08', 3, NULL),
(25, 1, 14, 1, 1760000.00, '2025-03-17', '22:35:16', 'thAI', '0123456789', 'levinhthai2020@gmail.com', 'BK-755628', '2025-03-17 15:35:16', 3, NULL),
(26, 1, 13, 1, 111111.00, '2025-03-17', '23:49:52', 'thai', '0978432121', 'levinhthai204@gmail.com', 'BK-714375', '2025-03-17 16:49:52', 3, NULL),
(27, 1, 13, 1, 111111.00, '2025-03-17', '23:49:56', 'thai', '0978432121', 'levinhthai204@gmail.com', 'BK-759810', '2025-03-17 16:49:56', 3, NULL),
(28, 1, 13, 1, 111111.00, '2025-03-18', '00:04:50', 'thai', '0978432121', 'levinhthai204@gmail.com', 'BK-770779', '2025-03-17 17:04:50', 3, NULL),
(29, 1, 13, 1, 111111.00, '2025-03-18', '00:07:59', 'thai', '0978432121', 'levinhthai204@gmail.com', 'BK-264714', '2025-03-17 17:07:59', 4, NULL),
(30, 1, 13, 1, 111111.00, '2025-03-18', '00:29:20', 'thai', '0978432121', 'levinhthai204@gmail.com', NULL, '2025-03-17 17:29:20', 4, NULL),
(31, 1, 2, 1, 500000.00, '2025-03-18', '00:33:52', 'thai', '0978432121', 'levinhthai204@gmail.com', NULL, '2025-03-17 17:33:52', 4, NULL),
(32, 1, 13, 1, 111111.00, '2025-03-18', '00:40:36', 'thai', '0978432121', 'levinhthai204@gmail.com', NULL, '2025-03-17 17:40:36', 4, NULL),
(33, 1, 13, 1, 111111.00, '2025-03-18', '00:46:24', 'thai11', '0978432121', 'levinhthai204@gmail.com', NULL, '2025-03-17 17:46:24', 2, NULL),
(34, 1, 18, 1, 1760000.00, '2025-03-18', '01:55:21', 't', '0123456789', 'levinhthai2020@gmail.com', 'BK-309795', '2025-03-17 18:55:21', 4, NULL),
(35, 1, 18, 1, 1760000.00, '2025-03-18', '02:00:57', 'vlogs Chuối', '0978534132', 'levthai@gmai.com', 'VD-XH2026', '2025-03-17 19:00:57', 4, NULL),
(36, 1, 19, 11, 19360000.00, '2025-03-18', '02:19:24', 't', '0978534123', 'bechuot6879@gmail.com', 'VD-TF8414', '2025-03-17 19:19:24', 4, NULL),
(37, 1, 18, 1, 1000000.00, '2025-03-18', '03:58:38', 'thAI', '0978534123', 'levinhthai2020@gmail.com', 'VD-CP1012', '2025-03-17 20:58:38', 2, NULL),
(38, 1, 18, 11, 11000000.00, '2025-03-18', '04:10:04', 'thAI', '0123456789', 'levinhthai2020@gmail.com', 'VD-RV6721', '2025-03-17 21:10:04', 4, NULL),
(39, 1, 18, 1, 1000000.00, '2025-03-18', '04:20:08', 'vlogs Chuối', '0123456789', 'levinhthai2020@gmail.com', 'VD-YE9609', '2025-03-17 21:20:08', 1, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `booking_status`
--

CREATE TABLE `booking_status` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `booking_status`
--

INSERT INTO `booking_status` (`id`, `code`, `name`, `description`, `color`, `created_at`) VALUES
(1, 'PENDING', 'Chờ xác nhận', 'Đơn đặt vé đang chờ xác nhận', 'warning', '2025-02-26 14:38:40'),
(2, 'CONFIRMED', 'Đã xác nhận', 'Đơn đặt vé đã được xác nhận', 'success', '2025-02-26 14:38:40'),
(3, 'CANCELLED', 'Đã hủy', 'Đơn đặt vé đã bị hủy', 'danger', '2025-02-26 14:38:40'),
(4, 'COMPLETED', 'Hoàn thành', 'Chuyến đi đã hoàn thành', 'info', '2025-02-26 14:38:40');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `routes`
--

CREATE TABLE `routes` (
  `id` int(11) NOT NULL,
  `from_location` varchar(100) NOT NULL COMMENT 'Điểm đi',
  `to_location` varchar(100) NOT NULL COMMENT 'Điểm đến',
  `distance` int(11) DEFAULT 0 COMMENT 'Khoảng cách (km)',
  `duration` varchar(50) DEFAULT NULL COMMENT 'Thời gian di chuyển',
  `description` text DEFAULT NULL COMMENT 'Mô tả',
  `price` decimal(10,2) DEFAULT 0.00 COMMENT 'Giá vé',
  `image` varchar(255) DEFAULT NULL COMMENT 'Đường dẫn đến hình ảnh tuyến'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `routes`
--

INSERT INTO `routes` (`id`, `from_location`, `to_location`, `distance`, `duration`, `description`, `price`, `image`) VALUES
(1, 'Hà Nội', 'thái lan', 1760, '5 giờ', 'hi', 500000.00, 'https://motortrip.vn/wp-content/uploads/2021/10/xe-khach-sai-gon-ca-mau-5.jpg'),
(2, 'Hà Nội', 'Đà Nẵng', 111111, '16 giờ', '1', 500000.00, 'https://static.kinhtedothi.vn/w960/images/upload/2021/12/23/pt11210.jpg'),
(4, 'Hà Nội', 'Sài Gòn', 1760, '36 giờ', NULL, 500000.00, 'https://xetaithacobacninh.com/wp-content/uploads/2024/03/z5266308954293_e217b2d691a12e698103b38aeace03e6.jpg'),
(5, 'Hà Nội', 'Đà Nẵng', 780, '16 giờ', NULL, 500000.00, 'https://xesaigon.vn/wp-content/uploads/2021/07/hi%CC%80nh-xe-giu%CC%9Bo%CC%9B%CC%80ng-na%CC%86%CC%80m-de%CC%A3p-1024x767.jpg'),
(10, 'Hà Nội', 'Bến Tre', 1000000, '1111', ' ', 1000000.00, 'https://dailymuabanxe.net/wp-content/uploads/2022/11/XE-KHACH-HYUNDAI-NEW-UNIVERSE-47-CHO-10.jpg'),
(19, 'thái', 'vn', 1200000, '1 000000phút', 'cn', 1200000.00, 'https://th.bing.com/th/id/OIP.ZShPzTqjz_ddVJtAeHUv2AHaEK?w=333&h=187&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2'),
(20, 'Hà Nội', 'Bến Tre', 6600, '16 ', NULL, 2000000.00, 'https://dcar-limousine.com/wp-content/uploads/2022/04/dcar-limousine-vip-lounge-1.jpg');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `schedules`
--

CREATE TABLE `schedules` (
  `id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `departure_time` time NOT NULL,
  `arrival_time` time NOT NULL,
  `date` date NOT NULL,
  `bus_type` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `available_seats` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `image_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `schedules`
--

INSERT INTO `schedules` (`id`, `route_id`, `departure_time`, `arrival_time`, `date`, `bus_type`, `price`, `available_seats`, `created_at`, `image_url`) VALUES
(1, 1, '08:00:00', '20:00:00', '2025-01-23', 'Giường nằm', 500000.00, 21, '2025-02-05 02:02:41', NULL),
(2, 1, '06:04:00', '21:00:00', '2025-01-24', 'Giường nằm', 500000.00, 51, '2025-02-05 02:02:41', NULL),
(3, 2, '07:00:00', '19:00:00', '2025-01-23', 'Ghế ngồi', 400000.00, 34, '2025-02-05 02:02:41', NULL),
(6, 1, '13:40:00', '21:00:00', '2025-01-24', 'Ghế ngồi', 300000.00, 45, '2025-02-05 02:34:59', NULL),
(9, 1, '08:00:00', '19:00:00', '2025-02-28', 'Ghế ngồi', 500000.00, 28, '2025-02-28 11:26:58', NULL),
(10, 2, '01:04:00', '23:00:00', '2025-02-28', 'Giường nằm', 400000.00, 23, '2025-02-28 11:26:58', NULL),
(13, 2, '11:11:00', '02:02:00', '2025-03-09', 'Giường nằm', 111111.00, 3, '2025-03-09 07:46:31', NULL),
(14, 1, '11:11:00', '16:31:00', '2025-03-09', 'Giường nằm', 1760000.00, 33, '2025-03-09 08:21:32', NULL),
(18, 1, '10:00:00', '15:20:00', '2025-03-17', 'Ghế ngồi', 1000000.00, 30, '2025-03-17 18:54:30', NULL),
(19, 1, '03:00:00', '08:20:00', '2025-03-17', 'Limousine', 1760000.00, 34, '2025-03-17 19:18:31', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('0qncZxqO88cSN7eNlMzZ0X3fhtooa3TH', 1740664648, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-02-27T13:09:51.796Z\",\"httpOnly\":true,\"path\":\"/\"},\"user\":{\"id\":1,\"username\":\"user1\",\"email\":\"user1@example.com\",\"phone\":\"0123456789\",\"created_at\":\"2025-02-26T13:11:54.000Z\"}}'),
('iwh7EuPBAFxkU0UYEgGrsHs81PuAaNJE', 1740663779, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-02-27T13:36:50.053Z\",\"httpOnly\":true,\"path\":\"/\"},\"returnTo\":\"/booking/details\"}'),
('oPL3av0ihYMjac0mxbxCgB7thfKyACvm', 1741088805, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-03-04T11:46:44.598Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"user\":{\"id\":1,\"username\":\"user1\",\"email\":\"user1@example.com\",\"phone\":\"01234567891\",\"created_at\":\"2025-02-26T13:11:54.000Z\"},\"admin\":{\"id\":1,\"username\":\"admin\",\"isSuperAdmin\":true}}');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ticket_types`
--

CREATE TABLE `ticket_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `ticket_types`
--

INSERT INTO `ticket_types` (`id`, `name`, `description`, `price`, `status`, `created_at`) VALUES
(1, 'Vé thường', 'Ghế ngồi thông thường', 200000.00, 1, '2025-01-23 10:10:37'),
(2, 'Vé VIP', 'Ghế ngồi rộng rãi, có massage', 350000.00, 1, '2025-01-23 10:10:37'),
(3, 'Vé giường nằm', 'Giường nằm thoải mái', 450000.00, 1, '2025-01-23 10:10:37'),
(4, 'Vé sinh viên', 'Dành cho sinh viên (cần thẻ sinh viên)', 180000.00, 1, '2025-01-23 10:10:37');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `activation_token` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `role` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `phone`, `created_at`, `activation_token`, `is_active`, `role`) VALUES
(1, 'user1', '123123', 'user1@example.com', '01234567891', '2025-02-26 13:11:54', NULL, 0, NULL),
(2, 'user2', 'password2', 'user2@example.com', '0987654321', '2025-02-26 13:11:54', NULL, 0, NULL),
(3, 'user', '$2b$10$iGNmWRYjOTcp/Awu1toB/eBra1oe7VjQIGR/u0VU9piFd.PqZuDY2', 'claude@anonyviet.online', '0978534123', '2025-02-27 08:23:59', NULL, 0, NULL),
(6, 'thai', '$2b$10$i.Yh3GYoXTEOZfUb3e6Qf.SA/38DbDbEY2FfU6uWvW2mFjV3YqCy2', 'levthai@gmai.com', '0978534132', '2025-03-04 08:41:17', NULL, 0, NULL),
(7, 'user11', '111111', 'admin1@gmail.com', '0123qqq', '2025-03-07 12:55:11', NULL, 0, NULL);

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Chỉ mục cho bảng `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `schedule_id` (`schedule_id`),
  ADD KEY `fk_booking_status` (`status_id`);

--
-- Chỉ mục cho bảng `booking_status`
--
ALTER TABLE `booking_status`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_code` (`code`);

--
-- Chỉ mục cho bảng `routes`
--
ALTER TABLE `routes`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `route_id` (`route_id`);

--
-- Chỉ mục cho bảng `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Chỉ mục cho bảng `ticket_types`
--
ALTER TABLE `ticket_types`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `banners`
--
ALTER TABLE `banners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT cho bảng `booking_status`
--
ALTER TABLE `booking_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `routes`
--
ALTER TABLE `routes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `schedules`
--
ALTER TABLE `schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `ticket_types`
--
ALTER TABLE `ticket_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`),
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`status_id`) REFERENCES `booking_status` (`id`),
  ADD CONSTRAINT `fk_booking_status` FOREIGN KEY (`status_id`) REFERENCES `booking_status` (`id`);

--
-- Các ràng buộc cho bảng `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
