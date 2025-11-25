const fs = require('fs');
const path = require('path');

// Create uploads directories
const uploadsDirs = [
  path.join(process.cwd(), 'public', 'uploads', 'slideshow'),
  path.join(process.cwd(), 'public', 'uploads', 'slideshow', 'videos'),
  path.join(process.cwd(), 'public', 'uploads', 'blog'),
  path.join(process.cwd(), 'public', 'uploads', 'team'),
  path.join(process.cwd(), 'public', 'uploads', 'games'),
];

uploadsDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  } else {
    console.log(`✓ Directory already exists: ${dir}`);
  }
  
  // Set permissions (755 = rwxr-xr-x)
  try {
    fs.chmodSync(dir, 0o755);
  } catch (error) {
    console.warn(`⚠ Could not set permissions for ${dir}:`, error.message);
  }
});

console.log('✓ All upload directories are ready');

