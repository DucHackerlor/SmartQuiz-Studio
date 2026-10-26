> **Đây là hướng dẫn của bản V5 dùng Gemini. Đối với bản đã tích hợp Groq Free, vui lòng đọc README.md và HUONG_DAN_GROQ_MIEN_PHI.md trước.**

# Hướng dẫn chạy SmartQuiz Community V5 trên Windows + VS Code

## 1. Chủ máy chủ cấu hình một lần

Đã có Node.js 22.13+ hoặc 24 LTS. Mở thư mục vừa giải nén bằng VS Code, Terminal → **PowerShell**, chạy:

```powershell
powershell -ExecutionPolicy Bypass -File .\CAI_DAT_GEMINI.ps1
```

Chương trình hỏi **Gemini API key mới** (không in ra màn hình) và tự lưu ở `apps/api/.env`. Key này **chỉ ở backend**, không gửi cho người dùng. Khóa trong ảnh cũ đã lộ, hãy xóa nó tại Google AI Studio trước khi làm bước này.

## 2. Cài và chạy

```powershell
npm install
npm run check:static
npm run test:community
npm run dev
```

Mở trình duyệt `http://127.0.0.1:5173` → Đăng ký → Tạo Quiz AI → Upload tài liệu → Chỉnh sửa nội dung → Tạo Quiz → Chơi → Xem điểm.

## 3. Test đầy đủ (mở Terminal thứ hai trong khi server đang chạy)

```powershell
npm test
npm run build
npm run smoke
npm run ai:check
```

- `npm run smoke`: API thực từ frontend proxy tới backend Express, không dùng Gemini thật.
- `npm run ai:check`: gọi **Gemini thật**, cần Internet và quota tài khoản.
- Trong trường hợp 429 (hết quota), các chức năng không dùng AI và chế độ demo vẫn dùng được.

## 4. Người khác sử dụng

Nếu bạn **deploy một máy chủ trung tâm**, bạn chỉ gửi **URL website** cho người học. Họ không phải cài Node hay nhập API key. Không bao giờ gửi `apps/api/.env` hoặc cả thư mục chứa khóa.

Bản trong ZIP là phiên bản local để chạy tại VS Code; chưa phải bản đã deploy lên Internet. SQLite local cần chuyển sang PostgreSQL trước khi triển khai trên hosting có ổ đĩa tạm. Ở hosting, nhập key vào tab Environment/Secrets, không chép vào GitHub.

Nếu gặp lỗi, gửi ảnh Terminal khi chạy `npm run dev` và kết quả `npm run smoke`/`npm run ai:check`, **che API key**.
