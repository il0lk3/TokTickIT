const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/Users/karn/Downloads/toktickit/e2e/lab-03/screenshots-*.spec.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/user@example\.com/g, 'cream.su@example.com');
  content = content.replace(/staff@example\.com/g, 'staff1@example.com');
  content = content.replace(/TokTickIT!2024/g, 'Password123!');
  fs.writeFileSync(file, content);
});
console.log('Fixed emails and passwords');
