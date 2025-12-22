# Add ALL remaining Phase 3 handlers in one go
$targetPath = "C:\xampp\htdocs\Tsharok\workers\tsharok-api\src\index.ts"
$backupPath = "C:\xampp\htdocs\Tsharok\workers\tsharok-api\src\index.ts.backup"

$current = Get-Content $targetPath -Raw
$backupLines = Get-Content $backupPath

Write-Host "Adding remaining 7 handlers..." -ForegroundColor Cyan

# handleUpload (715-805)
$upload = ($backupLines[714..804] -join "`r`n")
$current += "`r`n`r`n" + $upload

# handleGetComments (807-927) - needs adaptation  
$getComments = ($backupLines[806..926] -join "`r`n")
$getComments = $getComments -replace 'async function handleGetComments\(url: URL,', 'async function handleGetComments(request: Request,'
$getComments = $getComments -replace '(\{\r\n)(\t)', "`$1`$2const url = new URL(request.url);`r`n`$2"
$current += "`r`n`r`n" + $getComments

# handleAddComment (978-1058)
$addComment = ($backupLines[977..1057] -join "`r`n")
$current += "`r`n`r`n" + $addComment

# handleCommentLike (1060-1154)
$likeComment = ($backupLines[1059..1153] -join "`r`n")
$current += "`r`n`r`n" + $likeComment

# handleCommentReply (1156-1258)
$replyComment = ($backupLines[1155..1257] -join "`r`n")
$current += "`r`n`r`n" + $replyComment

# handleSearch (1344-1491) - needs adaptation
$search = ($backupLines[1343..1490] -join "`r`n")
$search = $search -replace 'async function handleSearch\(url: URL,', 'async function handleSearch(request: Request,'
$search = $search -replace '(\{\r\n)(\t)', "`$1`$2const url = new URL(request.url);`r`n`$2"
$current += "`r`n`r`n" + $search

# handleGetNotifications (1754-1830) - needs adaptation
$getNotif = ($backupLines[1753..1829] -join "`r`n")
$getNotif = $getNotif -replace 'async function handleGetNotifications\(url: URL,', 'async function handleGetNotifications(request: Request,'
$getNotif = $getNotif -replace '(\{\r\n)(\t)', "`$1`$2const url = new URL(request.url);`r`n`$2"
$current += "`r`n`r`n" + $getNotif

# handleDeleteNotification (1833-1874)
$delNotif = ($backupLines[1832..1873] -join "`r`n")
$current += "`r`n`r`n" + $delNotif

# createContentNotifications helper (1877-2040)
$createNotif = ($backupLines[1876..2039] -join "`r`n")
$current += "`r`n`r`n" + $createNotif

Set-Content $targetPath -Value $current

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ ALL 10 HANDLERS ADDED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "New line count: $((Get-Content $targetPath).Count)" -ForegroundColor Cyan
