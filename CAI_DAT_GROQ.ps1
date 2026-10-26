# PowerShell (or through Git Bash: powershell.exe -ExecutionPolicy Bypass -File CAI_DAT_GROQ.ps1)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $root 'apps\api\.env'
$examplePath = Join-Path $root 'apps\api\.env.example'
if (!(Test-Path $envPath)) { Copy-Item $examplePath $envPath }
Write-Host 'SMARTQUIZ - GROQ AI (FREE PLAN)' -ForegroundColor Cyan
Write-Host 'GROQ key se chi luu tren may va khong duoc dua len GitHub.' -ForegroundColor Yellow
$secure = Read-Host 'Dan Groq API Key (ky tu an)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr).Trim() }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
if ($key.Length -lt 20) { throw 'API key co ve khong hop le; chua ghi file.' }
$lines = [System.Collections.Generic.List[string]]::new()
foreach ($line in [IO.File]::ReadAllText($envPath) -split '\r?\n') { $lines.Add($line) }
$values = [ordered]@{
 'AI_PROVIDER' = 'groq'
 'GROQ_API_KEY' = $key
 'GROQ_MODEL' = 'qwen/qwen3.8-27b'
 'AI_MODE' = 'real'
 'AI_USER_DAILY_LIMIT' = '4'
 'AI_GLOBAL_DAILY_LIMIT' = '30'
}
foreach ($name in $values.Keys) {
  $found = $false
  for ($i=0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^\s*$name\s*=") { $lines[$i] = "$name=$($values[$name])"; $found = $true; break }
  }
  if (!$found) { $lines.Add("$name=$($values[$name])") }
}
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '^JWT_SECRET=replace-with-') {
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $bytes = New-Object byte[] 48; $rng.GetBytes($bytes) }
    finally { $rng.Dispose() }
    $lines[$i] = 'JWT_SECRET=' + [Convert]::ToBase64String($bytes)
  }
}
[IO.File]::WriteAllText($envPath, ($lines -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))
Remove-Variable key, secure -ErrorAction SilentlyContinue
Write-Host 'DA LUU: Groq Free - qwen/qwen3.8-27b.' -ForegroundColor Green
Write-Host 'Chay npm run ai:check de test AI that. Neu vuot gioi han Groq se tra ve 429.' -ForegroundColor Cyan
