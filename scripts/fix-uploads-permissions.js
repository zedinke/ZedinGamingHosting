const fs = require('fs');
const path = require('path');

// Script to fix uploads directory permissions
// This can be run from Node.js directly

console.log('=== Uploads mappák engedélyeinek javítása ===');

// Get project root
let projectRoot = process.cwd();
if (projectRoot.includes('.next/standalone')) {
  projectRoot = path.resolve(projectRoot, '..', '..', '..');
}

console.log('Project root:', projectRoot);

// Uploads directories
const uploadsDirs = [
  'public/uploads',
  'public/uploads/slideshow',
  'public/uploads/slideshow/videos',
  'public/uploads/blog',
  'public/uploads/team',
  'public/uploads/games',
];

// Create directories and set permissions
uploadsDirs.forEach((dir) => {
  const fullPath = path.join(projectRoot, dir);
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      console.log(`Creating directory: ${fullPath}`);
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    // Set permissions: 755 for directories (rwxr-xr-x)
    fs.chmodSync(fullPath, 0o755);
    console.log(`✓ Set permissions (755) for: ${dir}`);
    
    // Also try 777 if 755 doesn't work (less secure but more permissive)
    // Uncomment if needed:
    // fs.chmodSync(fullPath, 0o777);
    // console.log(`✓ Set permissions (777) for: ${dir}`);
    
  } catch (error) {
    console.error(`✗ Error with ${dir}:`, error.message);
  }
});

// Set permissions for public directory
const publicDir = path.join(projectRoot, 'public');
if (fs.existsSync(publicDir)) {
  try {
    fs.chmodSync(publicDir, 0o755);
    console.log('✓ Set permissions (755) for: public');
  } catch (error) {
    console.error('✗ Error with public directory:', error.message);
  }
}

console.log('=== Kész! ===');
console.log('Most már próbáld meg újra feltölteni a képet.');

