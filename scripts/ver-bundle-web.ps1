$ProgressPreference = 'SilentlyContinue'
$html = (Invoke-WebRequest -Uri 'https://geekapoo-7624d.web.app/' -UseBasicParsing).Content
$asset = [regex]::Match($html, '/assets/[^"]+\.js').Value
Write-Output "asset: $asset"
$js = (Invoke-WebRequest -Uri ("https://geekapoo-7624d.web.app" + $asset) -UseBasicParsing).Content
Write-Output ("bytes: " + $js.Length)
$marcas = @('geekapoo_celebrado_', 'Mover a la izquierda', 'te ha enviado un mensaje')
foreach ($m in $marcas) {
  $n = ([regex]::Matches($js, [regex]::Escape($m))).Count
  Write-Output "$m : $n"
}
