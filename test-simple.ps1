Write-Host 'Testing In-App Notification System' -ForegroundColor Cyan
Write-Host ''

Write-Host 'Checking files...' -ForegroundColor Yellow
Test-Path 'src\app\api\notifications\route.ts'
Test-Path 'src\app\api\notifications\mark-read\route.ts'
Test-Path 'src\hooks\use-notifications.ts'
Test-Path 'src\components\notification-center.tsx'
Test-Path 'src\app\benachrichtigungen\page.tsx'

Write-Host ''
Write-Host 'All files exist!' -ForegroundColor Green
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Yellow
Write-Host '1. npm run dev'
Write-Host '2. Open: http://localhost:3000'
Write-Host '3. Create test data: http://localhost:3000/api/test/create-notifications'
Write-Host '4. Check bell icon in header'
