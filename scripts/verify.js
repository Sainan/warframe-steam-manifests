const fs = require("fs");
const path = require("path");
const sha1 = require("./sha1");

function findManifest(id) {
  const manifestsDir = path.join(__dirname, "..", "manifests");
  const name = fs
    .readdirSync(manifestsDir)
    .find((file) => file.endsWith(`_${id}.txt`));
  if (!name) return null;
  return path.join(manifestsDir, name);
}

function parseManifest(file) {
  const map = new Map();
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\s+\d+\s+([0-9a-f]{40})\s+\d+\s+(.+)$/i);
    if (!match) continue;
    const size = Number(match[1]);
    const sha = match[2].toLowerCase();
    const name = match[3].trim();
    if (/^0{40}$/.test(sha)) continue; // directory entry
    map.set(name.replace(/\\/g, "/"), { size, sha });
  }
  return map;
}

function listFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.substr(0, 1) != ".") {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        result.push(...listFiles(full));
      } else if (entry.isFile()) {
        result.push(full);
      }
    }
  }
  return result;
}

async function main() {
  const [manifestId, targetPath] = process.argv.slice(2);
  if (!manifestId || !targetPath) {
    console.error("Usage: node scripts/verify.js <manifestId> <path>");
    process.exit(1);
  }

  const manifestFile = findManifest(manifestId);
  if (!manifestFile) {
    console.error(`Manifest ${manifestId} not found`);
    process.exit(1);
  }

  const manifest = parseManifest(manifestFile);
  const missing = [];
  const mismatched = [];

  for (const [rel, { size, sha }] of manifest.entries()) {
    const abs = path.join(targetPath, rel.split("/").join(path.sep));
    if (!fs.existsSync(abs)) {
      missing.push(rel);
      continue;
    }
    const stats = fs.statSync(abs);
    if (stats.size !== size) {
      mismatched.push(`${rel} (size ${stats.size} != ${size})`);
      continue;
    }
    const actualSha = await sha1(abs);
    if (actualSha !== sha) {
      mismatched.push(`${rel} (sha ${actualSha} != ${sha})`);
    }
  }

  const allFiles = listFiles(targetPath).map((f) =>
    path.relative(targetPath, f).split(path.sep).join("/"),
  );
  const superfluous = allFiles.filter((f) => !manifest.has(f));

  if (missing.length) {
    console.log("Missing files:");
    for (const file of missing) console.log("  " + file);
  }
  if (mismatched.length) {
    console.log("Mismatched files:");
    for (const file of mismatched) console.log("  " + file);
  }
  if (superfluous.length) {
    console.log("Superfluous files:");
    for (const file of superfluous) console.log("  " + file);
  }
  console.log(
    `Checked ${manifest.size} files; ${missing.length} missing, ${mismatched.length} mismatched, ${superfluous.length} superfluous.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
