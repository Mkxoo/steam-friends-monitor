Set-Location $PSScriptRoot
tsc.cmd --build "./tsconfig.json"
$pub = "public"
Remove-Item -Path $pub -Force -Recurse
New-Item -Path $pub  -ItemType "directory"
Copy-Item -Path "./js/" -Destination "./public/js/" -Recurse
Copy-Item -Path "./html/" -Destination "./public/html/" -Recurse
Copy-Item -Path "./icons/" -Destination "./public/icons/" -Recurse
Copy-Item -Path "./manifest.json"  -Destination "./public/manifest.json"
Set-Location $pub
7z.exe a "out.zip" *
Set-Location $PSScriptRoot
