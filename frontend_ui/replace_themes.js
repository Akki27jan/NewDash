const fs = require('fs');
const path = require('path');

const map = {
  'blue-500': 'theme-primary',
  'blue-400': 'theme-secondary',
  'blue-600': 'theme-muted',
  'blue-800': 'theme-muted',
  'blue-900': 'theme-border',
  'blue-950': 'theme-border-bg',
  'red-500': 'theme-accent',
  'red-400': 'theme-accent-hover',
  'red-900': 'theme-accent-border',
  'red-950': 'theme-accent-bg',
  'green-500': 'theme-success',
  'green-400': 'theme-success-hover',
  'green-900': 'theme-success-border',
  'green-950': 'theme-success-bg',
  'yellow-400': 'theme-warning',
  'yellow-500': 'theme-warning-hover'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  Object.keys(map).forEach(key => {
    if (content.includes(key)) {
      content = content.split(key).join(map[key]);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
