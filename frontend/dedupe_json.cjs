const fs = require('fs');
const path = require('path');

function deduplicate(filePath) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const sorted = {};
    Object.keys(content).sort().forEach(key => {
        sorted[key] = content[key];
    });
    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2));
    console.log(`Deduplicated and sorted ${path.basename(filePath)}`);
}

deduplicate('src/locales/en.json');
deduplicate('src/locales/am.json');
