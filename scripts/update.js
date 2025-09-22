const fs = require("fs");
const path = require("path");

function formatBytes(bytes) {
  if (bytes >= 1000 ** 3) {
    return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
  }
  if (bytes >= 1024 ** 2) {
    return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KiB`;
  }
  return `${bytes} B`;
}

function getSize() {
  let contentBytes = 0;
  let uniqueContentBytes = 0;
  {
    const manifestsDir = path.join(__dirname, "..", "manifests");
    const shaSizes = new Map();
    for (const file of fs.readdirSync(manifestsDir)) {
      const data = fs.readFileSync(path.join(manifestsDir, file), "utf8");
      for (const line of data.split(/\r?\n/)) {
        const match = line.match(/^\s*(\d+)\s+\d+\s+([0-9a-f]{40})/i);
        if (match) {
          const size = Number(match[1]);
          const sha = match[2];
          if (!shaSizes.has(sha)) {
            shaSizes.set(sha, size);
          }
          contentBytes += size;
        }
      }
    }
    uniqueContentBytes = Array.from(shaSizes.values()).reduce(
      (sum, size) => sum + size,
      0,
    );
  }

  let deltaBytes = 0;
  {
    const deltasDir = path.join(__dirname, "..", "deltas");
    for (const file of fs.readdirSync(deltasDir)) {
      const [deltaSize /*, deltaSha1, deltaCid*/] = fs
        .readFileSync(path.join(deltasDir, file), "utf8")
        .split("\n");
      deltaBytes += Number(deltaSize);
    }
  }

  const totalBytes = contentBytes + deltaBytes;

  return (
    `Total size:            ${totalBytes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} bytes ≈ ${(totalBytes / 1024 ** 3).toFixed(2)} GiB\n` +
    `- Content:             ${contentBytes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} bytes ≈ ${(contentBytes / 1024 ** 3).toFixed(2)} GiB\n` +
    `  - Unique files only: ${uniqueContentBytes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} bytes ≈ ${(uniqueContentBytes / 1024 ** 3).toFixed(2)} GiB\n` +
    `- Deltas:              ${deltaBytes
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      .padStart(
        17,
        " ",
      )} bytes ≈ ${(deltaBytes / 1024 ** 3).toFixed(2).padStart(7, " ")} GiB\n`
  );
}

function getManifestDiskSize(mid) {
  const file = path.join(
    __dirname,
    "..",
    `manifests/manifest_230411_${mid}.txt`,
  );
  if (!fs.existsSync(file)) return "";
  const data = fs.readFileSync(file, "utf8");
  const match = data.match(/Total bytes on disk\s*:\s*(\d+)/);
  return Number(match[1]);
}

const fh = fs.createWriteStream(path.join(__dirname, "..", "README.md"), {
  flags: "w",
});

fh.write("# warframe-steam-manifests\n");
fh.write("\n");
fh.write(
  "Checksums and content identifiers for all Warframe versions ever uploaded to Steam.\n",
);
fh.write("\n");
fh.write("## Guides\n");
fh.write("\n");
fh.write("- [Verify an existing installation](guides/verify.md)\n");
fh.write(
  "- [Upgrade/downgrade an existing installation via IPFS](guides/patch-via-ipfs.md)\n",
);
fh.write("\n");
fh.write("## Manifests\n");
fh.write("\n");
const rows = [];
function addRow(...cols) {
  rows.push(cols);
}
function writeTable() {
  fh.write("<table>\n");
  fh.write("  <thead>\n");
  fh.write("    <tr>\n");
  fh.write("      <th>Date</th>\n");
  fh.write("      <th>Manifest ID</th>\n");
  fh.write('      <th colspan="2">Content</th>\n');
  fh.write('      <th colspan="2">Deltas</th>\n');
  fh.write("    </tr>\n");
  fh.write("  </thead>\n");
  fh.write("  <tbody>\n");
  for (const row of rows) {
    fh.write("    <tr>\n");
    for (const col of row) {
      fh.write(`      <td>${col || ""}</td>\n`);
    }
    fh.write("    </tr>\n");
  }
  fh.write("  </tbody>\n");
  fh.write("</table>\n");
}

const manifests = [];
{
  let newer;
  for (const line of fs
    .readFileSync(path.join(__dirname, "..", "manifests.txt"), "utf-8")
    .split("\n")
    .filter(Boolean)) {
    const [date, mid] = line.split(" ");
    const meta = { mid, date };
    if (newer) {
      meta.newer = newer;
      newer.older = meta;
    }
    manifests.push(meta);
    newer = meta;
  }
}

for (const manifest of manifests) {
  const mid = manifest.mid;
  let content = "";
  let cids = "";
  let downdelta = "";
  let updelta = "";
  if (
    fs.existsSync(
      path.join(__dirname, "..", `manifests/manifest_230411_${mid}.txt`),
    )
  ) {
    content = `<a href="manifests/manifest_230411_${mid}.txt">${formatBytes(
      getManifestDiskSize(mid),
    )}</a>`;
  }
  if (fs.existsSync(path.join(__dirname, "..", `ipfs/${mid}.txt`))) {
    cids = `<a href="ipfs/${mid}.txt">IPFS CIDs</a>`;
  }
  if (
    manifest.older &&
    fs.existsSync(
      path.join(__dirname, "..", `deltas/${mid} to ${manifest.older.mid}.txt`),
    )
  ) {
    const [deltaSize /*, deltaSha1, deltaCid*/] = fs
      .readFileSync(
        path.join(
          __dirname,
          "..",
          `deltas/${mid} to ${manifest.older.mid}.txt`,
        ),
        "utf-8",
      )
      .split("\n");
    const downLink = encodeURI(`deltas/${mid} to ${manifest.older.mid}.txt`);
    downdelta = `↓ <a href="${downLink}">${formatBytes(Number(deltaSize))}</a>`;
  }
  if (
    manifest.newer &&
    fs.existsSync(
      path.join(__dirname, "..", `deltas/${mid} to ${manifest.newer.mid}.txt`),
    )
  ) {
    const [deltaSize /*, deltaSha1, deltaCid*/] = fs
      .readFileSync(
        path.join(
          __dirname,
          "..",
          `deltas/${mid} to ${manifest.newer.mid}.txt`,
        ),
        "utf-8",
      )
      .split("\n");
    const upLink = encodeURI(`deltas/${mid} to ${manifest.newer.mid}.txt`);
    updelta = `↑ <a href="${upLink}">${formatBytes(Number(deltaSize))}</a>`;
  }
  addRow(
    `<code>${manifest.date}</code>`,
    mid,
    content,
    cids,
    downdelta,
    updelta,
  );
}
writeTable();

fh.write("\n");
fh.write("```\n");
fh.write(getSize());
fh.write("```\n");

fh.end();
