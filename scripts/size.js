const fs = require("fs");
const path = require("path");

const manifestsDir = path.join(__dirname, "..", "manifests");

const shaSizes = new Map();
let totalBytes = 0;

for (const file of fs.readdirSync(manifestsDir)) {
  const filePath = path.join(manifestsDir, file);
  const data = fs.readFileSync(filePath, "utf8");
  for (const line of data.split(/\r?\n/)) {
    const match = line.match(/^\s*(\d+)\s+\d+\s+([0-9a-f]{40})/i);
    if (match) {
      const size = Number(match[1]);
      const sha = match[2];
      if (!shaSizes.has(sha)) {
        shaSizes.set(sha, size);
      }
      totalBytes += size;
    }
  }
}

const totalUniqueBytes = Array.from(shaSizes.values()).reduce(
  (sum, size) => sum + size,
  0,
);

console.log(`Total size:                ${totalBytes} bytes ≈ ${(totalBytes / 1e9).toFixed(2)} GB / ${(totalBytes / 1024 ** 3).toFixed(2)} GiB`);
console.log(`Excluding duplicate files: ${totalUniqueBytes} bytes ≈ ${(totalUniqueBytes / 1e9).toFixed(2)} GB / ${(totalUniqueBytes / 1024 ** 3).toFixed(2)} GiB`);
