const fs = require('fs');
const path = require('path');
const outPath = path.resolve(__dirname, 'dist');
const oldFile = path.join(outPath, 'index.html');
const newFile = path.join(outPath, 'vcf_react.html');
if (fs.existsSync(oldFile)) {
  fs.renameSync(oldFile, newFile);
  console.log('Renamed index.html to vcf_react.html');
}

// Move all other files/folders into vcf_react subfolder
const files = fs.readdirSync(outPath);
const subdir = path.join(outPath, 'vcf_react');
if (!fs.existsSync(subdir)) fs.mkdirSync(subdir);

for (const file of files) {
  if (file !== 'vcf_react.html' && file !== 'vcf_react') {
    fs.renameSync(path.join(outPath, file), path.join(subdir, file));
  }
}
console.log('Moved all build files except vcf_react.html into vcf_react/');
