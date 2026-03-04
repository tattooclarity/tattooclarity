// scripts/generate-manifest.js
const fs = require('fs');
const path = require('path');

// 設定你的 Mystery 資料夾路徑
const mysteryDir = path.join(__dirname, '../storage/designs/mystery_png');
const outputDir = path.join(__dirname, '../storage/manifests');
const outputFile = path.join(outputDir, 'mystery_pool.json');

// 確保輸出的資料夾存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 讀取所有 .png 檔案
try {
  const files = fs.readdirSync(mysteryDir).filter(file => file.toLowerCase().endsWith('.png'));
  const data = { files };
  
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  console.log(`✅ Manifest generated with ${files.length} files at: ${outputFile}`);
} catch (err) {
  console.error('❌ Error generating manifest:', err);
}