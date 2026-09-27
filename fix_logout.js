const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/Users/karn/Downloads/toktickit/e2e/lab-03/screenshots-*.spec.ts');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/await page\.click\('button:has-text\("Logout"\)', \{ force: true \}\);/g, 
    `if (await page.isVisible('.navbar-toggler')) await page.click('.navbar-toggler');\n    await page.click('button:has-text("Logout")', { force: true });`);
  fs.writeFileSync(file, content);
});
console.log('Fixed logout clicks');
