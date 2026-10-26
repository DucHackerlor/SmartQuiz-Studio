# SmartQuiz Studio – Community V5 + Groq AI Free

**Đây là dự án hoàn chỉnh** (frontend React + backend Express + SQLite), không phải file vá. Giải nén một lần thành **một** thư mục `SmartQuiz_Studio`, không copy file từ các thư mục con qua lại.

## BẮT ĐẦU Ở ĐÂY (Windows / VS Code)

1. Giải nén `SmartQuiz_Studio_Groq_Free_FULL.zip`. Bạn sẽ có **một thư mục `SmartQuiz_Studio`** chứa `package.json`, `apps/`, `scripts/` và các file `.bat`.
2. Đóng workspace cũ trong VS Code. Chọn **File → Open Folder... → `SmartQuiz_Studio` vừa giải nén** (không chọn thư mục `scripts` hoặc `apps`).
3. Tạo API key miễn phí tại https://console.groq.com/keys (chọn Free, không cần thẻ thanh toán).
4. **Chạy `1_CAI_DAT_GROQ.bat`** (nhấp đúp ở Windows), hoặc trong Git Bash gõ `powershell.exe -ExecutionPolicy Bypass -File CAI_DAT_GROQ.ps1` khi đang đứng tại thư mục gốc. Chỉ nhập key **một lần**; key lưu tại `apps/api/.env` ở backend, không đưa lên GitHub.
5. Mở terminal tại thư mục gốc và gõ `npm install` (**cần Node.js 22.13+**, khuyến nghị Node 24 LTS).
6. Chạy `npm run ai:check` để kiểm tra key/model thực sự gọi được Groq. Sau đó chạy `npm run dev` và mở http://localhost:5173. Bạn cũng có thể nhấp đúp `2_CHAY_SMARTQUIZ.bat` để tự cài dependency lần đầu và chạy cả backend lẫn frontend.

**Lưu ý:** Nếu PowerShell hiển thị không thấy ký tự khi bạn dán key, đó là vì key đang được nhập ở chế độ ẩn. Khi script báo xong, key đã được lưu và bạn không cần nhập lại.

## Chức năng

- Đăng ký / đăng nhập bằng tài khoản riêng.
- Tạo Quiz bằng AI từ văn bản/TXT/DOCX/PDF có lớp chữ; nhận diện chữ từ ảnh JPG/PNG/WEBP bằng Groq Vision.
- Chỉnh sửa câu hỏi, 5 chế độ luyện tập, chấm điểm, lịch sử, flashcard, bảng xếp hạng và chia sẻ quiz.
- Chế độ demo câu hỏi mẫu khi chưa có API key.

**Giới hạn kỹ thuật:** Groq Free có giới hạn token và số lần gọi; PDF scan hoàn toàn bằng ảnh chưa đọc trực tiếp dưới dạng PDF. Chuyển trang PDF thành JPG/PNG để tải lên. Không cam kết sử dụng vô hạn hoặc luôn luôn có model miễn phí. Khi vượt giới hạn API có thể trả lỗi 429.

## Đẩy GitHub an toàn

```bash
git init
git branch -M main
git status
git add .
git status  # chắc chắn KHÔNG có apps/api/.env, node_modules, SQLite
git commit -m "SmartQuiz with Groq Free AI"
git remote add origin https://github.com/USERNAME/SmartQuiz_Studio.git
git push -u origin main
```

Đổi `USERNAME` thành tên tài khoản GitHub, tạo repository trống trước khi push. `.gitignore` loại trừ `.env`, database, thư viện. Trước khi push, kiểm tra bằng `git check-ignore apps/api/.env` (cần file .env đã được tạo). **Không commit API key.** GitHub lưu mã nguồn, không tự chạy website; muốn mọi người sử dụng cần deploy frontend/backend và cấu hình các biến môi trường trên hosting.

## Lưu lại tài khoản/quiz từ bản cũ

Bản ZIP sạch **không chứa dữ liệu cá nhân**. Nếu trước đó đã dùng SmartQuiz và muốn giữ database:

1. Tắt chương trình cũ và chương trình mới.
2. Sao lưu cả thư mục `apps/api/data` của bản cũ ở một chỗ riêng.
3. Sao chép các file trong `apps/api/data` từ bản cũ vào đúng `apps/api/data` bản mới **trước khi chạy backend**.
4. Nếu đang dùng chung database cũ và muốn giữ phiên đăng nhập cũ, hãy giữ `JWT_SECRET` cũ trong `.env` (đừng đăng key lên GitHub).

Không cần sao chép `node_modules`, thư mục `scripts` hay `apps` từ bản cũ sang bản mới.

**Xem thêm:** [HUONG_DAN_GROQ_MIEN_PHI.md](HUONG_DAN_GROQ_MIEN_PHI.md), [BAO_MAT_VA_KIEM_THU.md](BAO_MAT_VA_KIEM_THU.md).
