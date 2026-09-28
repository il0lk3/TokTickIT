const fs = require('fs');
const files = [
  'e2e/lab-03/screenshots-1-auth.spec.ts',
  'e2e/lab-03/screenshots-2-user-management.spec.ts',
  'e2e/lab-03/screenshots-3-staff-queue.spec.ts',
  'e2e/lab-03/screenshots-4-ticket-detail.spec.ts'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/await page\.screenshot\(\{ path: path\.join\(dir, name\), fullPage: true \}\);/g, 
    "await page.screenshot({ path: path.join(dir, name), fullPage: true, style: '.sticky-top { position: static !important; } .modal-backdrop { height: 100% !important; min-height: 100vh !important; }' });");
  fs.writeFileSync(file, content);
});
console.log('Done');
