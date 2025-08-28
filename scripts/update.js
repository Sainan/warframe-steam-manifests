const fs = require("fs");
const path = require("path");

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

fh.write("## Manifests\n");
fh.write("\n");
fh.write(
  `| Date                   | Manifest ID         | Content                                                        | ${String.fromCodePoint(0x200d)}                                         | Deltas                                                                                                                                          |\n`,
);
fh.write(
  "| ---------------------- | ------------------- | -------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |\n",
);

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
  fh.write(`| \`${manifest.date}\` | ${mid.padEnd(19, " ")}`);
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
      const deltas = [];
      if (
        manifest.older &&
        fs.existsSync(
          path.join(
            __dirname,
            "..",
            `deltas/${mid} to ${manifest.older.mid}.txt`,
          ),
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
        deltas.push(
          `↓ [${(Number(deltaSize) / 1024 ** 2).toFixed(2)} MiB](<deltas/${mid} to ${manifest.older.mid}.txt>)`,
        );
      }
      if (
        manifest.newer &&
        fs.existsSync(
          path.join(
            __dirname,
            "..",
            `deltas/${mid} to ${manifest.newer.mid}.txt`,
          ),
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
        deltas.push(
          `↑ [${(Number(deltaSize) / 1024 ** 2).toFixed(2)} MiB](<deltas/${mid} to ${manifest.newer.mid}.txt>)`,
        );
      }
      if (deltas.length) {
        fh.write(" | ");
        fh.write(deltas.join(" ").padEnd(143, " "));
      }
    }
  }
  fh.write(" |\n");
}

fh.write("\n");
fh.write("```\n");
fh.write(getSize());
fh.write("```\n");

fh.end();
