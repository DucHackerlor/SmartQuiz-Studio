# Chay bang PowerShell, tai thu muc goc: powershell -ExecutionPolicy Bypass -File .\CAI_DAT_GEMINI.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $root 'apps\api\.env'
$examplePath = Join-Path $root 'apps\api\.env.example'
if (!(Test-Path $envPath)) { Copy-Item $examplePath $envPath }
Write-Host 'SMARTQUIZ COMMUNITY - GEMINI 3.8 FLASH (HIGH)' -ForegroundColor Cyan
Write-Host 'Luu y: Xoa key da lo tren anh chat va tao key MOI trong Google AI Studio.' -ForegroundColor Yellow
Write-Host 'Khoa ban dan vao se duoc luu tren MAY CUA BAN, khong dua vao ZIP/Git.'
$secure = Read-Host 'Dan Gemini API key MOI (ky tu se an)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr).Trim() }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
if ($key.Length -lt 20) { throw 'API key co ve khong hop le; chua ghi file.' }
$lines = [System.Collections.Generic.List[string]]::new()
foreach ($line in [IO.File]::ReadAllText($envPath) -split '\r?\n') { $lines.Add($line) }
$values = [ordered]@{
 'GEMINI_API_KEY' = $key
 'GEMINI_MODEL' = 'gemini-3.8-flash'
 'GEMINI_THINKING_LEVEL' = 'high'
 'AI_MODE' = 'real'
 'AI_USER_DAILY_LIMIT' = '8'
 'AI_GLOBAL_DAILY_LIMIT' = '100'
}
foreach ($name in $values.Keys) {
  $found = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^\s*$name\s*=") { $lines[$i] = "$name=$($values[$name])"; $found = $true; break }
  }
  if (!$found) { $lines.Add("$name=$($values[$name])") }
}
# Neu file van dung JWT Secret mau, thay bang chuoi ngau nhien de chay cuc bo an toan hon.
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '^JWT_SECRET=replace-with-') {
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $bytes = New-Object byte[] 48; $rng.GetBytes($bytes) }
    finally { $rng.Dispose() }
    $lines[$i] = 'JWT_SECRET=' + [Convert]::ToBase64String($bytes)
  }
}
[IO.File]::WriteAllText($envPath, ($lines -join "`r`n"), (New-Object Text.UTF8Encoding($false)))
Remove-Variable key, secure -ErrorAction SilentlyContinue
Write-Host 'DA LUU CAU HINH. Model: gemini-3.8-flash / thinking: high.' -ForegroundColor Green
Write-Host 'Nguoi dung website KHONG can nhap API key. Tuyet doi khong chia se apps/api/.env.' -ForegroundColor Green
Write-Host 'Bay gio chay: npm run dev (terminal 1), npm run ai:check (terminal 2).'
