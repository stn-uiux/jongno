Add-Type -AssemblyName System.Drawing

$img1 = [System.Drawing.Bitmap]::FromFile('C:\Users\user\.gemini\antigravity-ide\brain\bae94a79-baca-4457-885a-ce5e381f1ed5\.user_uploaded\media_1792721079557.png')
$img3 = [System.Drawing.Bitmap]::FromFile('C:\Users\user\.gemini\antigravity-ide\brain\bae94a79-baca-4457-885a-ce5e381f1ed5\.user_uploaded\media_1792721201251.png')

# 1. Park Green
$greens = @{}
for ($y = 520; $y -lt 630; $y += 3) {
    for ($x = 350; $x -lt 550; $x += 3) {
        $p = $img1.GetPixel($x, $y)
        if ($p.G -ge $p.R -and $p.G -ge $p.B -and $p.G -lt 80) {
            $hex = ('#{0:x2}{1:x2}{2:x2}' -f $p.R, $p.G, $p.B)
            $greens[$hex] = [int]$greens[$hex] + 1
        }
    }
}
Write-Output "--- Park Green Colors ---"
$greens.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Key) count: $($_.Value)" }

# 2. Water in Image 3
$waters = @{}
for ($y = [int]($img3.Height * 0.78); $y -lt [int]($img3.Height * 0.95); $y += 4) {
    for ($x = 20; $x -lt [int]($img3.Width * 0.45); $x += 4) {
        $p = $img3.GetPixel($x, $y)
        if ($p.B -gt $p.R -and $p.B -gt $p.G) {
            $hex = ('#{0:x2}{1:x2}{2:x2}' -f $p.R, $p.G, $p.B)
            $waters[$hex] = [int]$waters[$hex] + 1
        }
    }
}
Write-Output "--- Water Colors ---"
$waters.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Key) count: $($_.Value)" }

# 3. Roads in Image 3
# In Image 3, roads are lighter grey lines like Tojeong-ro
$roads = @{}
for ($y = 200; $y -lt 600; $y += 5) {
    for ($x = 200; $x -lt 600; $x += 5) {
        $p = $img3.GetPixel($x, $y)
        # road lines are lighter than background (brightness > 60 and diff between channels < 15)
        $diff = [Math]::Max([Math]::Abs($p.R - $p.G), [Math]::Abs($p.G - $p.B))
        if ($p.R -gt 60 -and $p.R -lt 180 -and $diff -lt 12) {
            $hex = ('#{0:x2}{1:x2}{2:x2}' -f $p.R, $p.G, $p.B)
            $roads[$hex] = [int]$roads[$hex] + 1
        }
    }
}
Write-Output "--- Road Colors ---"
$roads.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Key) count: $($_.Value)" }

# 4. Background / Land in Image 1
$lands = @{}
for ($y = 200; $y -lt 700; $y += 5) {
    for ($x = 50; $x -lt 300; $x += 5) {
        $p = $img1.GetPixel($x, $y)
        $hex = ('#{0:x2}{1:x2}{2:x2}' -f $p.R, $p.G, $p.B)
        $lands[$hex] = [int]$lands[$hex] + 1
    }
}
Write-Output "--- Land / Background Colors ---"
$lands.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Key) count: $($_.Value)" }

# 5. Highway / Major Orange in Image 1
$highways = @{}
for ($y = 90; $y -lt 150; $y += 2) {
    for ($x = 200; $x -lt 500; $x += 2) {
        $p = $img1.GetPixel($x, $y)
        # orange / golden road: R > 120, G > 80, B < 80
        if ($p.R -gt 100 -and $p.G -gt 70 -and $p.B -lt 80) {
            $hex = ('#{0:x2}{1:x2}{2:x2}' -f $p.R, $p.G, $p.B)
            $highways[$hex] = [int]$highways[$hex] + 1
        }
    }
}
Write-Output "--- Highway Orange Colors ---"
$highways.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Key) count: $($_.Value)" }

$img1.Dispose()
$img3.Dispose()
