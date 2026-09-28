const fs = require('fs');
const path = require('path');
const dir = 'e2e/lab-03';
const files = fs.readdirSync(dir).filter(f => f.startsWith('screenshots-') && f.endsWith('.spec.ts')).map(f => path.join(dir, f));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /style: '.*?'/,
    "style: 'body { position: relative !important; } .modal, .glass-overlay, .modal-backdrop { position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; height: auto !important; min-height: 100% !important; } .sticky-top { position: static !important; }'"
  );
  fs.writeFileSync(file, content);
});
console.log('done');
