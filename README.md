# PathCraft - Path Planning Dashboard for Autonomous Vehicles

PathCraft là một giao diện tương tác (dashboard) trực quan hóa và so sánh hiệu năng giữa hai thuật toán tìm đường đi phổ biến: **Dijkstra** và **A\* (A-Star)** áp dụng cho xe tự hành. Dự án hỗ trợ cả việc mô phỏng thuật toán trên lưới ô vuông giả định (Grid Search) và tìm kiếm tuyến đường di chuyển thực tế theo các đường phố Hà Nội.

---

## 🛠️ Công Nghệ Sử Dụng

- **Core**: React 18, Vite
- **Styling**: TailwindCSS, PostCSS
- **Bản đồ**: Leaflet, React-Leaflet
- **Biểu đồ**: Recharts
- **Icons**: Lucide React
- **Routing API**: Open Source Routing Machine (OSRM)

---

## ✨ Tính Năng Nổi Bật

### 1. Bản Đồ Tương Tác
- Sử dụng bản đồ tương tác Leaflet tập trung tại khu vực trung tâm Hà Nội.
- Cho phép người dùng trực tiếp chọn điểm xuất phát (**Start**) và điểm đích (**Goal**) bằng cách click trực tiếp trên bản đồ.

### 2. Hai Chế Độ Hiển Thị (Dual View Modes)
- **3D View (Real Road Routing)**: Tìm kiếm và hiển thị tuyến đường đi thực tế theo mạng lưới giao thông đường bộ Hà Nội sử dụng API OSRM. Vẽ hoạt ảnh di chuyển mô phỏng xe tự hành chạy dọc tuyến đường.
- **Grid View (Grid Search)**:
  - Chia bản đồ thành một lưới ô vuông kích thước 20x30.
  - Tự động bắt điểm (Snap) vị trí click của người dùng vào tâm ô lưới gần nhất.
  - Trực quan hóa chướng ngại vật (Obstacles - màu đỏ), vùng tìm kiếm (Visited Nodes - màu xanh lam nhạt) và đường đi tối ưu theo ô lưới của thuật toán được chọn.

### 3. So Sánh Hiệu Năng Trực Quan
- Bảng so sánh chi tiết và biểu đồ cột (Recharts) cập nhật thời gian thực về các chỉ số:
  - **Thời gian xử lý (Time in ms)**
  - **Số lượng điểm đã duyệt (Visited Nodes)**
  - **Chi phí đường đi (Path Cost)**

---

## 🚀 Hướng Dẫn Chạy Dự Án

### Yêu Cầu Hệ Thống
- Máy tính đã cài đặt **Node.js** (Khuyến nghị phiên bản LTS mới nhất).

### Các Bước Thực Hiện

1. **Tải mã nguồn về máy** (hoặc di chuyển vào thư mục dự án):
   ```bash
   cd E:\GTVTK2\path-planning-dashboard
   ```

2. **Cài đặt các thư viện phụ thuộc (Dependencies)**:
   ```bash
   npm install
   ```

3. **Chạy máy chủ phát triển (Development Server)**:
   ```bash
   npm run dev
   ```
   Sau khi khởi động thành công, Vite sẽ cung cấp một liên kết cục bộ, thường là:
   - **Local**: [http://localhost:5173/](http://localhost:5173/) (hoặc cổng mạng khác như `http://localhost:5175/`).
   - Mở trình duyệt web của bạn và truy cập vào liên kết trên để trải nghiệm ứng dụng.

4. **Đóng gói sản phẩm (Build Production)**:
   ```bash
   npm run build
   ```
   Mã nguồn đã tối ưu hóa sẽ được lưu trữ trong thư mục `dist/`.

---

## 📂 Cấu Trúc Dự Án

```text
├── src/
│   ├── components/
│   │   ├── Header.jsx         # Thanh công cụ trên đầu (chọn thuật toán)
│   │   ├── LeftSidebar.jsx     # Bảng điều khiển chọn điểm, cấu hình thuật toán
│   │   ├── RightSidebar.jsx    # Bảng số liệu so sánh & biểu đồ cột Recharts
│   │   ├── BottomBar.jsx       # Chọn chế độ hiển thị (3D / Grid) và chú thích
│   │   ├── MapView.jsx         # Bản đồ Leaflet chứa các Layer vẽ Grid/Tuyến đường
│   │   └── RealRoute.jsx       # Component xử lý gọi API OSRM và vẽ tuyến đường thật
│   ├── utils/
│   │   ├── algorithms.js       # Implement thuật toán A* và Dijkstra trên Grid
│   │   ├── gridHelper.js       # Helper chuyển đổi tọa độ lat/lng và ô lưới 20x30
│   │   └── routing.js          # Hàm fetch và haversine cho OSRM
│   ├── App.jsx                 # Component chính quản lý State toàn cục
│   ├── main.jsx                # File entry khởi tạo ứng dụng React
│   └── index.css               # Chứa custom CSS và import Leaflet CSS
├── package.json
└── vite.config.js
```

---

## 👨‍💻 Tác Giả
Dự án được xây dựng và phát triển bởi **[HuuCanh404](https://github.com/HuuCanh404)**.
