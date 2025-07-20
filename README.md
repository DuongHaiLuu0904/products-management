# Products Management System

<div align="center">
  <h3>🛍️ Hệ Thống Quản Lý Sản Phẩm Toàn Diện</h3>
  <p>Được xây dựng với Node.js, Express.js và MongoDB</p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-4.21.2-lightgrey.svg)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-6.14.2-brightgreen.svg)](https://www.mongodb.com/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-black.svg)](https://socket.io/)
</div>

## 📖 Mô Tả Dự Án

**Products Management** là một hệ thống quản lý sản phẩm e-commerce full-stack được xây dựng bằng Node.js với kiến trúc MVC (Model-View-Controller). Hệ thống cung cấp:

- 🔧 **Admin Panel** - Giao diện quản trị toàn diện
- 🛒 **E-commerce Frontend** - Giao diện mua sắm cho khách hàng  
- 💬 **Real-time Chat** - Hỗ trợ khách hàng trực tuyến
- 🔐 **Multi-Auth** - Đăng nhập bằng email, Google, GitHub
- 📱 **Responsive Design** - Tối ưu cho mọi thiết bị

## ✨ Tính Năng Chính

### 👨‍💼 Admin Features
- ✅ Quản lý sản phẩm và danh mục
- ✅ Quản lý người dùng và phân quyền
- ✅ Dashboard analytics với biểu đồ
- ✅ Quản lý đơn hàng và thanh toán
- ✅ Cài đặt hệ thống
- ✅ Quản lý bình luận và đánh giá

### 🛍️ Customer Features  
- ✅ Duyệt sản phẩm với tìm kiếm thông minh
- ✅ Giỏ hàng và thanh toán
- ✅ Đăng ký/đăng nhập (Local + OAuth)
- ✅ Chat trực tuyến với support
- ✅ Đánh giá và bình luận sản phẩm
- ✅ Theo dõi đơn hàng

### 🚀 Real-time Features
- ✅ Live chat giữa khách hàng và admin
- ✅ Thông báo real-time
- ✅ Cập nhật sản phẩm trực tiếp

## 🚀 Cài Đặt và Chạy Dự Án

### Yêu Cầu Hệ Thống
- **Node.js** >= 18.0.0
- **MongoDB** >= 6.0
- **npm** hoặc **yarn**

### 1️⃣ Clone Repository
```bash
git clone https://github.com/DuongHaiLuu0904/products-management.git
cd products-management
```

### 2️⃣ Cài Đặt Dependencies
```bash
npm install
```

### 3️⃣ Cấu Hình Environment
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Cập nhật các thông tin trong file `.env`:
```env
PORT=3000
MONGGO_URL=mongodb://localhost:27017/products-management
SESSION_SECRET=your-session-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
```

### 4️⃣ Khởi Động Database
Đảm bảo MongoDB đang chạy trên hệ thống của bạn.

### 5️⃣ Chạy Ứng Dụng
```bash
# Development mode với nodemon
npm start

# Production mode
npm run prod
```

Truy cập ứng dụng tại: `http://localhost:3000`

## 📁 Cấu Trúc Dự Án

```
📦 products-management/
├── 📄 index.js              # Entry point của ứng dụng
├── 📄 package.json          # Dependencies và scripts
├── 📄 vercel.json           # Cấu hình deployment
├── 📁 config/               # Cấu hình hệ thống
│   ├── database.js          # Kết nối MongoDB
│   ├── passport.js          # Cấu hình authentication
│   └── system.js            # Cài đặt hệ thống
├── 📁 controllers/          # Logic xử lý business
│   ├── 📁 admin/            # Controllers cho admin panel
│   └── 📁 clients/          # Controllers cho client interface
├── 📁 models/               # Mongoose models (Database schemas)
├── 📁 routes/               # Định nghĩa routing
│   ├── 📁 admin/            # Routes cho admin
│   └── 📁 clients/          # Routes cho clients
├── 📁 middlewares/          # Custom middlewares
│   ├── 📁 admin/            # Admin middlewares
│   └── 📁 client/           # Client middlewares
├── 📁 helpers/              # Utility functions
├── 📁 validates/            # Input validation schemas
├── 📁 views/                # Pug templates
│   ├── 📁 admin/            # Admin panel views
│   └── 📁 client/           # Client views
├── 📁 public/               # Static assets (CSS, JS, Images)
│   ├── 📁 admin/            # Admin static files
│   ├── 📁 css/              # Stylesheets
│   ├── 📁 js/               # JavaScript files
│   └── 📁 images/           # Image assets
└── 📁 socket/               # Socket.IO handlers
    └── 📁 client/           # Real-time features
```

## 💻 Sử Dụng

### Admin Panel
1. Truy cập: `http://localhost:3000/admin`
2. Đăng nhập với tài khoản admin
3. Quản lý sản phẩm, users, đơn hàng

### Client Interface  
1. Truy cập: `http://localhost:3000`
2. Duyệt sản phẩm, đăng ký/đăng nhập
3. Thêm vào giỏ hàng và thanh toán

### API Endpoints
- `GET /api/products` - Lấy danh sách sản phẩm
- `POST /api/auth/login` - Đăng nhập
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/orders` - Tạo đơn hàng

## 🛠️ Công Nghệ Sử Dụng

### **Backend Stack**
| Công Nghệ | Version | Mô Tả |
|-----------|---------|-------|
| Node.js | Latest | Runtime environment |
| Express.js | 4.21.2 | Web framework |
| MongoDB | 6.14.2 | NoSQL Database |
| Mongoose | 8.12.0 | ODM cho MongoDB |
| Socket.IO | 4.8.1 | Real-time communication |

### **Authentication & Security**
| Công Nghệ | Version | Mô Tả |
|-----------|---------|-------|
| Passport.js | 0.7.0 | Authentication middleware |
| JWT | 9.0.2 | Token-based auth |
| bcrypt/md5 | 2.3.0 | Password hashing |
| XSS | 1.0.15 | XSS protection |

### **Frontend & UI**
| Công Nghệ | Version | Mô Tả |
|-----------|---------|-------|
| Pug | 3.0.3 | Template engine |
| TinyMCE | 7.7.1 | Rich text editor |
| Socket.IO Client | 4.8.1 | Real-time UI updates |
| Responsive CSS | - | Mobile-first design |

### **File Upload & Media**
| Công Nghệ | Version | Mô Tả |
|-----------|---------|-------|
| Multer | 2.0.1 | File upload handling |
| Cloudinary | 2.6.0 | Cloud media storage |
| Streamifier | 0.1.1 | Stream processing |

### **Search & Data Processing**
| Công Nghệ | Version | Mô Tả |
|-----------|---------|-------|
| Fuse.js | 7.1.0 | Fuzzy search |
| Diacritics | 1.3.0 | Vietnamese text processing |
| Moment.js | 2.30.1 | Date/time handling |

## 🔧 Scripts Có Sẵn

```bash
# Chạy development server với nodemon
npm start

# Chạy production server  
npm run prod

# Chạy linting
npm run lint

# Chạy tests
npm test
```

## 🌐 Deployment

### Vercel (Recommended)
```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Manual Deployment
1. Build ứng dụng
2. Upload lên server
3. Cài đặt dependencies: `npm install --production`
4. Start server: `npm start`

## 🤝 Đóng Góp

Chúng tôi rất hoan nghênh các đóng góp! Để đóng góp:

1. **Fork** repository này
2. **Clone** fork về máy local
3. **Tạo branch** cho feature: `git checkout -b feature/AmazingFeature`
4. **Commit** thay đổi: `git commit -m 'Add some AmazingFeature'`
5. **Push** lên branch: `git push origin feature/AmazingFeature`
6. **Tạo Pull Request**

### Coding Standards
- Sử dụng ES6+ syntax
- Follow ESLint configuration
- Viết comments cho functions phức tạp
- Test trước khi commit

## 📧 Liên Hệ & Hỗ Trợ

- **Email**: duonghailuu0904@gmail.com
- **GitHub**: [@DuongHaiLuu0904](https://github.com/DuongHaiLuu0904)
- **Issues**: [GitHub Issues](https://github.com/DuongHaiLuu0904/products-management/issues)

## 📝 License

Dự án này được phân phối dưới giấy phép **ISC License**. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 🙏 Acknowledgments

- Express.js team cho framework tuyệt vời
- MongoDB team cho database solution
- Socket.IO team cho real-time capabilities
- Cloudinary cho media management
- Tất cả contributors đã đóng góp cho dự án

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/DuongHaiLuu0904">DuongHaiLuu0904</a></p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
