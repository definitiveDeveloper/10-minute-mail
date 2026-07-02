const fs = require('fs');
const path = require('path');

const LOCALES = path.join(__dirname, 'frontend/src/locales');
const en = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'));
const files = fs.readdirSync(LOCALES).filter(f => f.endsWith('.json') && f !== 'en.json');

for (const file of files) {
  const fp = path.join(LOCALES, file);
  const existing = JSON.parse(fs.readFileSync(fp, 'utf8'));
  let added = 0;
  for (const [k, v] of Object.entries(en)) {
    if (!(k in existing)) { existing[k] = v; added++; }
  }
  fs.writeFileSync(fp, JSON.stringify(existing, null, 2), 'utf8');
  console.log(`${file}: +${added} keys`);
}
