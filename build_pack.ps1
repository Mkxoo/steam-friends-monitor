Set-Location $PSScriptRoot
tsc.cmd --build "./tsconfig.json"
$pub = "public"
$dc = Get-Item -Path $pub
if ($dc.Exists) {
    $dc.Delete($true)
}
New-Item -Path $pub  -ItemType "directory"
Copy-Item -Path "./js/" -Destination "./public/js/" -Recurse
Copy-Item -Path "./html/" -Destination "./public/html/" -Recurse
Copy-Item -Path "./icons/" -Destination "./public/icons/" -Recurse
Copy-Item -Path "./manifest.json"  -Destination "./public/manifest.json"
Set-Location $pub
Remove-Item -Path "out.zip"
7z.exe a out.zip *
