const fs = require('fs');
const files = ['src/encode.test.ts', 'src/mixed.test.ts', 'tests/basic.test.ts', 'tests/modes.test.ts'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/{ "", /g, '{ ');
  content = content.replace(/import { "" }/g, '');
  content = content.replace(/""/g, '');
  fs.writeFileSync(f, content);
});
