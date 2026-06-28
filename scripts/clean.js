const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(path.join(__dirname, '..'));

const paths = ['dist', 'release'];
paths.forEach(p => {
  const fullPath = path.join(rootDir, p);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`Successfully removed ${p}`);
    } catch (e) {
      console.error(`Error removing ${p}: ${e.message}`);
    }
  }
});
