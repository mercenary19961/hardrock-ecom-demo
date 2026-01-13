# PowerShell script to convert Sluban CSV to PHP seeder array
$csv = Import-Csv "C:\Users\sabba\Desktop\Project files\hardrock_e-commerce\sulban new - Sheet1.csv"

# SKUs to skip (products with missing images)
$skipSkus = @(
    'M38-B1287', 'M38-B1290', 'M38-B1259', 'M38-B1257', 'M38-P8062',
    'M38-B1329', 'M38-B1296', 'M38-B1295', 'M38-B1293', 'M38-B0708',
    'M38-B1213', 'M38-B1193'
)

$output = @()
$output += "        `$products = ["

foreach ($row in $csv) {
    if ($skipSkus -contains $row.SKU) {
        continue
    }
    
    $sku = $row.SKU
    $nameEn = $row.name_en -replace "'", "\'"
    $nameAr = $row.name_ar -replace "'", "\'"
    $descEn = $row.description_en -replace "'", "\'"
    $descAr = $row.description_ar -replace "'", "\'"
    $price = $row.price
    $stock = $row.stock
    $thumbnail = $row.thumbnail_name
    $images = $row.image_names
    
    $output += "            ["
    $output += "                'sku' => '$sku',"
    $output += "                'name_en' => '$nameEn',"
    $output += "                'name_ar' => '$nameAr',"
    $output += "                'description_en' => '$descEn',"
    $output += "                'description_ar' => '$descAr',"
    $output += "                'price' => $price,"
    $output += "                'stock' => $stock,"
    $output += "                'thumbnail' => '$thumbnail',"
    $output += "                'images' => '$images',"
    $output += "            ],"
}

$output += "        ];"

$output | Out-File "C:\Users\sabba\Desktop\projects\hardrock-ecom-demo\sluban_products_array.txt" -Encoding UTF8
Write-Host "Generated sluban_products_array.txt"
