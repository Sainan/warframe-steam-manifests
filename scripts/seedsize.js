const fs = require('fs');
const path = require('path');

const manifestsDir = path.join(__dirname, '..', 'manifests');

const shaSizes = new Map();

for (const file of fs.readdirSync(manifestsDir)) {
  const filePath = path.join(manifestsDir, file);
  const data = fs.readFileSync(filePath, 'utf8');
  for (const line of data.split(/\r?\n/)) {
    const match = line.match(/^\s*(\d+)\s+\d+\s+([0-9a-f]{40})/i);
    if (match) {
      const size = Number(match[1]);
      const sha = match[2];
      if (!shaSizes.has(sha)) {
        shaSizes.set(sha, size);
      }
    }
  }
}

const totalBytes = Array.from(shaSizes.values()).reduce((sum, size) => sum + size, 0);
const gigabytes = totalBytes / 1e9;
const gibibytes = totalBytes / (1024 ** 3);

console.log(`Total unique size: ${totalBytes} bytes`);
console.log(`≈ ${gigabytes.toFixed(2)} GB / ${gibibytes.toFixed(2)} GiB`);
