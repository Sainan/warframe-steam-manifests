const fs = require("fs");
const path = require("path");

function getSize() {
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

  return (
    `Total size:          ${totalBytes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} bytes ≈ ${(totalBytes / 1024 ** 3).toFixed(2)} GiB\n` +
    `- Unique files only: ${totalUniqueBytes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} bytes ≈ ${(totalUniqueBytes / 1024 ** 3).toFixed(2)} GiB\n`
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

fh.write("## Manifests\n");
fh.write("\n");
fh.write(
  `| Date                   | Manifest ID         | Content                                                        | ${String.fromCodePoint(0x200d)}                                         |\n`,
);
fh.write(
  "| ---------------------- | ------------------- | -------------------------------------------------------------- | ----------------------------------------- |\n",
);

for (const line of fs
  .readFileSync(path.join(__dirname, "..", "manifests.txt"), "utf-8")
  .split("\n")
  .filter(Boolean)) {
  const [date, mid] = line.split(" ");
  fh.write(`| \`${date}\` | ${mid.padEnd(19, " ")}`);
  if (
    fs.existsSync(
      path.join(__dirname, "..", `manifests/manifest_230411_${mid}.txt`),
    )
  ) {
    fh.write(" | ");
    fh.write(
      `[${(getManifestDiskSize(mid) / 1024 ** 3).toFixed(2)} GiB](manifests/manifest_230411_${mid}.txt)`.padEnd(
        62,
        " ",
      ),
    );
    if (fs.existsSync(path.join(__dirname, "..", `ipfs/${mid}.txt`))) {
      fh.write(" | ");
      fh.write(`[IPFS CIDs](ipfs/${mid}.txt)`.padEnd(41, " "));
    }
  }
  fh.write(" |\n");
}

fh.write("\n");
fh.write("```\n");
fh.write(getSize());
fh.write("```\n");

fh.end();
