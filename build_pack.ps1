Set-Location $PSScriptRoot
tsc.cmd --build "./tsconfig.json"
Remove-Item -Path  "public" -Force -Recurse
Copy-Item -Path "./js/" -Destination "./public/js/" -Recurse
Copy-Item -Path "./html/" -Destination "./public/html/" -Recurse
Copy-Item -Path "./icons/" -Destination "./public/icons/" -Recurse
Copy-Item -Path "./manifest.json"  -Destination "./public/manifest.json"
# Copy-Item -Path "./public/" -Destination "./public_chrome/" -Recurse
# Set-Location "./public_chrome/" 
# $files = Get-ChildItem -Path "./js/" -Include "*.js" -Recurse
# for ($i = 0; $i -lt $files.Count; $i++) {
#     $f = $files[$i]
#     $str = Get-Content -Path $f 
#     $str = $str.Replace("browser.", "chrome.")
#     Set-Content -Path $f.FullName -Value $str
# }
# Chrome 罪孽深重，永不支持！
Set-Location "public"
7z.exe a "out.zip" *
Set-Location $PSScriptRoot
