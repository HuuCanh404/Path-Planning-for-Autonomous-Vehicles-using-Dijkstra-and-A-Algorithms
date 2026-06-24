# Path Planning for Autonomous Vehicles Simulator (Dijkstra vs A* Algorithms)

Đồ án môn học: **Phân tích Thiết kế và Đánh giá Giải thuật**  
Đề tài: **Lập kế hoạch đường đi cho xe tự hành sử dụng thuật toán Dijkstra và A* (Path Planning for Autonomous Vehicles using Dijkstra and A* Algorithms)**

Dự án này là một công cụ mô phỏng trực quan giúp sinh viên và người nghiên cứu quan sát, phân tích và so sánh hiệu năng giữa hai giải thuật tìm kiếm đường đi phổ biến: **Dijkstra** và **A\*** trên cả mô hình mạng lưới điểm (Node-Link Graph) và bản đồ giao thông thực tế.

---

## 🌟 Tính Năng Chính

### 1. Bố cục Giao diện Trực quan (3 Phần)
- **Khu vực điều khiển (Left Control Panel):** Thiết lập chướng ngại vật, điểm Start/Goal, chọn thuật toán, hướng di chuyển (4 hướng/8 hướng) và thực thi/so sánh.
- **Khu vực mô phỏng (Simulation Map Area):** Bản đồ tương tác Leaflet hỗ trợ hiển thị lưới liên kết điểm học thuật (Graph View) hoặc bản đồ thực tế 3D (3D View).
- **Khu vực thống kê (Right Result Panel):** Hiển thị thời gian chạy, số node đã duyệt, chiều dài và chi phí đường đi kèm biểu đồ so sánh hiệu năng trực quan.

### 2. Tương tác Vẽ vật cản động (Dynamic Obstacles)
- Người dùng có thể bật chế độ **Select Obstacles** ở cột trái và click trực tiếp lên các điểm nút (node) của Graph để bật/tắt vật cản (màu đỏ).
- Các thuật toán sẽ tự động tính toán tránh các vật cản này khi nhấn chạy.

### 3. Hiệu ứng duyệt node tuần tự (Search Animation)
- Khi thuật toán chạy, các node được duyệt sẽ lan tỏa dần theo thời gian thực (Dijkstra lan tỏa đều hình tròn, A* hướng tâm về phía đích), mô phỏng chính xác cách thức tìm kiếm của từng giải thuật.

### 4. Mô phỏng Xe di chuyển (Moving Car Animation 🚗)
- Xe ô tô nhỏ màu đỏ (`🚗` trong 3D View) hoặc màu xanh cyan (`🚗` trong Graph View) sẽ xuất hiện tại điểm Start và tự động di chuyển chạy dọc theo các nút đường đi tới điểm đích, vẽ đường đi sáng màu phía sau.

---

## 📊 So Sánh Thuật Toán

| Đặc tính | Thuật toán Dijkstra | Thuật toán A* Search |
| :--- | :--- | :--- |
| **Heuristic** | Không sử dụng ($h(n) = 0$). | Sử dụng hàm khoảng cách Manhattan/Euclidean để định hướng giải thuật về phía đích. |
| **Không gian tìm kiếm** | Lan tỏa đều ra mọi hướng xung quanh (dạng sóng tròn). | Hướng thẳng về phía điểm Goal, giảm thiểu tối đa số node cần duyệt. |
| **Hiệu năng (Thời gian)** | Chậm hơn, duyệt nhiều node không cần thiết. | Nhanh hơn vượt trội nhờ có thông tin định hướng. |
| **Độ tối ưu đường đi** | Cam kết tìm ra đường đi ngắn nhất tuyệt đối. | Cam kết tìm ra đường đi tối ưu nhất nếu hàm Heuristic là chấp nhận được (admissible). |

---

## 🛠️ Hướng dẫn cài đặt và khởi chạy

Dự án được xây dựng bằng **ReactJS**, **Vite** và **TailwindCSS**.

### 1. Cài đặt các gói phụ thuộc (Dependencies)
Mở terminal tại thư mục `path-planning-dashboard` và chạy lệnh:
```bash
npm install
```

### 2. Chạy Server phát triển (Development Server)
Khởi động ứng dụng cục bộ bằng lệnh:
```bash
npm run dev
```
Sau đó truy cập đường dẫn hiển thị trên terminal (thông thường là `http://localhost:5175`).

### 3. Biên dịch bản Production
```bash
npm run build
```
Mã nguồn đã biên dịch tối ưu sẽ nằm trong thư mục `dist`.
