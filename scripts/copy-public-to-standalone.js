const fs = require('fs');
const path = require('path');

// Determine correct working directory
// In standalone build, process.cwd() points to .next/standalone
// We need to go to project root
let workingDir = process.cwd();
const isStandalone = workingDir.includes('.next/standalone') || fs.existsSync(path.join(workingDir, 'server.js'));

if (isStandalone && workingDir.includes('.next/standalone')) {
  // Go up to project root
  workingDir = path.join(workingDir, '..', '..', '..');
  console.log('Standalone build detected, using project root:', workingDir);
}

const publicDir = path.join(workingDir, 'public');
const standalonePublicDir = path.join(workingDir, '.next/standalone/public');

if (!fs.existsSync('.next/standalone')) {
  console.log('Standalone build not found, skipping public folder copy');
  process.exit(0);
}

if (!fs.existsSync(publicDir)) {
  console.log('Public folder not found, skipping copy');
  process.exit(0);
}

// Create standalone public directory if it doesn't exist
if (!fs.existsSync(standalonePublicDir)) {
  fs.mkdirSync(standalonePublicDir, { recursive: true });
}

// Recursive copy function
const copyRecursive = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItem) => {
      copyRecursive(path.join(src, childItem), path.join(dest, childItem));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

try {
  copyRecursive(publicDir, standalonePublicDir);
  console.log('✓ Public folder copied to standalone build');
  
  // Also ensure uploads directory exists in standalone
  const standaloneUploadsDir = path.join(standalonePublicDir, 'uploads', 'slideshow');
  if (!fs.existsSync(standaloneUploadsDir)) {
    fs.mkdirSync(standaloneUploadsDir, { recursive: true });
    console.log('✓ Created standalone uploads directory');
  }
} catch (error) {
  console.error('✗ Error copying public folder:', error);
  process.exit(1);
}

