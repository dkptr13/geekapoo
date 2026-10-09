$ProgressPreference = 'SilentlyContinue'
$html = (Invoke-WebRequest -Uri 'https://geekapoo.vercel.app/' -UseBasicParsing).Content
$asset = [regex]::Match($html, '/assets/[^"]+\.js').Value
Write-Output "asset: $asset"
if (-not $asset) {
  Write-Output "NO hay bundle con hash: el html es distinto (SSR o sin build)"
  Write-Output ("head: " + $html.Substring(0, [Math]::Min(400, $html.Length)))
} else {
  $js = (Invoke-WebRequest -Uri ("https://geekapoo.vercel.app" + $asset) -UseBasicParsing).Content
  Write-Output ("bytes: " + $js.Length)
  $marcas = @('geekapoo_celebrado_', 'Eliminaste este mensaje', 'Eliminar solo para mí', 'Mover a la izquierda', 'te ha enviado un mensaje', 'Editando mensaje')
  foreach ($m in $marcas) {
    $n = ([regex]::Matches($js, [regex]::Escape($m))).Count
    Write-Output "$m : $n"
  }
}
