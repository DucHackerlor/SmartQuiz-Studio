# Hướng dẫn cài SmartQuiz + Groq miễn phí (Windows)

## 1. Chỉ dùng một thư mục

Sau khi giải nén, cấu trúc chuẩn phải là:

```text
SmartQuiz_Studio/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   ├── data/        # tạo tự động khi chạy; không nằm trong ZIP
│   │   └── .env.example
│   └── web/
├── scripts/
├── 1_CAI_DAT_GROQ.bat
├── 2_CHAY_SMARTQUIZ.bat
├── CAI_DAT_GROQ.ps1
├── package.json
└── README.md
```

Mở **File → Open Folder → SmartQuiz_Studio** trong VS Code. Không dán bản vá vào `scripts/`.

## 2. Tạo và cấu hình API key Groq một lần

1. Mở https://console.groq.com/keys, đăng nhập và tạo API key.
2. Giữ nguyên gói **Free**, không cần nhập thẻ ngân hàng.
3. Nhấp đúp `1_CAI_DAT_GROQ.bat` trong File Explorer, hoặc mở Git Bash tại gốc và chạy:

```bash
powershell.exe -ExecutionPolicy Bypass -File CAI_DAT_GROQ.ps1
```

4. Dán key tại lời nhắc. Chương trình ẩn ký tự và lưu key vào **`apps/api/.env`**.
5. Script cài `AI_PROVIDER=groq`, `GROQ_MODEL=qwen/qwen3.8-27b`, `AI_MODE=real`. Không chia sẻ file `.env`.

## 3. Chạy thử

Mở Terminal VS Code tại thư mục `SmartQuiz_Studio`:

```bash
npm install
npm run ai:check
npm run dev
```

Hoặc nhấp đúp `2_CHAY_SMARTQUIZ.bat` để cài và chạy. Truy cập **http://localhost:5173**. Nếu chạy `npm run dev`, giữ terminal mở trong thời gian sử dụng website.

Nếu gặp lỗi `429`, hạn mức Free đã hết hoặc tài liệu quá dài. Thử ít câu hơn hoặc thử lại sau. Nếu gặp `401`, kiểm tra API key. Nếu `404`, kiểm tra model có còn được cung cấp không.

## 4. Đẩy lên GitHub

Chỉ đẩy source; không đẩy `apps/api/.env`, `node_modules/` hoặc SQLite. Kiểm tra:

```bash
git check-ignore apps/api/.env
git status
```

Để website hoạt động ngay cả khi máy cá nhân đã tắt, cần deploy backend/frontend và cấu hình `AI_PROVIDER`, `GROQ_API_KEY`, `GROQ_MODEL`, `JWT_SECRET`, `WEB_ORIGIN` trên server; GitHub một mình không chạy website.

## 5. Giới hạn bản miễn phí

Groq Free có quota theo phút/ngày: https://console.groq.com/docs/rate-limits. Model được sử dụng: `qwen/qwen3.8-27b`. PDF có thể copy được chữ, TXT, DOCX và ảnh JPG/PNG/WEBP được hỗ trợ. PDF scan thuần ảnh cần chuyển sang JPG/PNG trước. Groq không phải miễn phí vô hạn.
