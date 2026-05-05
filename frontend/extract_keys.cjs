const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const keys = new Set();

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.match(/t\(['"](.*?)['"](.*?)\)/g);
            if (matches) {
                matches.forEach(match => {
                    const keyExtract = match.match(/t\(['"](.*?)['"]\)/);
                    if (keyExtract && keyExtract[1]) {
                        keys.add(keyExtract[1]);
                    }
                });
            }
        }
    }
}

walkDir(srcDir);
const sortedKeys = Array.from(keys).sort();
fs.writeFileSync('all_translation_keys.json', JSON.stringify(sortedKeys, null, 2));
console.log(`Extracted ${sortedKeys.length} keys.`);
