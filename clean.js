const fs = require('fs');
const files = ['src/encode.test.ts', 'src/mixed.test.ts', 'tests/basic.test.ts', 'tests/modes.test.ts'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/MZ_ID \+ /g, '');
  content = content.replace(/\$\{MZ_ID\}/g, '');
  content = content.replace(/MZ_ID/g, '""');
  fs.writeFileSync(f, content);
});
