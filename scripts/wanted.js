const fs = require('fs');
const path = require('path');

const manifestsFile = path.join(__dirname, '..', 'manifests.txt');
const manifestsDir = path.join(__dirname, '..', 'manifests');

// Read manifest IDs from manifests.txt (second column of each line)
const desiredIds = fs.readFileSync(manifestsFile, 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map(line => line.trim().split(/\s+/).pop());

// Collect existing IDs from manifest filenames
const existingIds = new Set(
  fs.readdirSync(manifestsDir)
    .map(name => name.match(/_(\d+)\.txt$/))
    .filter(Boolean)
    .map(match => match[1])
);

// Determine missing IDs
const missing = desiredIds.filter(id => !existingIds.has(id));

// Output missing IDs, one per line
console.log(missing.join('\n'));
