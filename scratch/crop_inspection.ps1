Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap('C:/Users/user/.gemini/antigravity-ide/brain/bae94a79-baca-4457-885a-ce5e381f1ed5/.user_uploaded/media_1792732492351.jpg')
Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"

# 1. Road 1 (left side): x: 0 to 450, y: 350 to 650
$rect1 = New-Object System.Drawing.Rectangle(0, 350, 450, 250)
$crop1 = $bmp.Clone($rect1, $bmp.PixelFormat)
$crop1.Save('scratch/crop_road1.png')

# 2. Bridge circles across Han River: x: 400 to 950, y: 250 to 650
$rect2 = New-Object System.Drawing.Rectangle(400, 250, 550, 350)
$crop2 = $bmp.Clone($rect2, $bmp.PixelFormat)
$crop2.Save('scratch/crop_bridges.png')

$bmp.Dispose()
Write-Host "Crops saved successfully from media_1792732492351.jpg"
