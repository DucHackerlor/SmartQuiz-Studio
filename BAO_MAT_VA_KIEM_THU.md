# Cấu hình và kiểm thử – Community V5

## Nguyên tắc dùng API chung
- Chỉ máy chủ Express giữ `GEMINI_API_KEY` trong file bị gitignore (`apps/api/.env`) hoặc secret của hosting.
- React không cần và không được nhận API key. Nhiều người dùng cùng gọi backend theo token đăng nhập.
- Bật giới hạn hai tầng: mỗi tài khoản mỗi ngày và tổng lượt của mọi người. Có thể thay `AI_USER_DAILY_LIMIT`, `AI_GLOBAL_DAILY_LIMIT`.
- Key cũ được chia sẻ trong ảnh chat phải bị xóa/thu hồi. Đừng đưa key thật vào file ZIP.
- Nếu share cả source trên GitHub: script `CAI_DAT_GEMINI.ps1` là dành cho **chủ máy chủ**, không phải người dùng bình thường.

## Giới hạn kỹ thuật
- Phần mềm dùng SQLite cục bộ; cần chuyển PostgreSQL để chạy public trên hosting có đĩa tạm.
- Giới hạn lượt AI chỉ chống lạm dụng thông thường, không đảm bảo chi phí bằng 0. Giới hạn IP riêng trong Express đang áp dụng; tạo tài khoản ảo nhiều vẫn bị quota tổng bảo vệ.
- Không có khóa Gemini mới trong môi trường tạo mã nên không thể kiểm chứng request AI thật. Kiểm tra `npm run ai:check` trên máy của người quản trị sau khi nhập khóa.
- Quá trình npm install/build cần thư viện từ registry; nếu mạng chặn registry, không thể xác nhận end-to-end, phải ghi rõ.
- Phông chữ dùng Segoe UI/Arial; không phụ thuộc font từ mạng; UI được xác thực tĩnh UTF-8, chưa test đồ họa trên mọi trình duyệt.

## Lệnh kiểm thử
- `npm run check:static` – cú pháp backend, CORS/proxy, UTF-8/fonts.
- `npm run test:community` – kiểm tra quota SQLite, chống lộ key, reset theo ngày.
- `npm test` – unit + API, cần npm dependencies.
- `npm run build` – biên dịch React/Vite, cần npm dependencies.
- `npm run dev` rồi `npm run smoke` – tạo user, đăng nhập, quiz demo, chấm điểm, chống nộp trùng, lịch sử, cần 2 server.
- `npm run ai:check` – dùng khóa Gemini hợp lệ, thử 3 câu từ nội dung văn bản; cần quota và Internet.
