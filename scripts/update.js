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
    `Total size:                ${totalBytes} bytes ≈ ${(totalBytes / 1e9).toFixed(2)} GB / ${(totalBytes / 1024 ** 3).toFixed(2)} GiB\n` +
    `Excluding duplicate files: ${totalUniqueBytes} bytes ≈ ${(totalUniqueBytes / 1e9).toFixed(2)} GB / ${(totalUniqueBytes / 1024 ** 3).toFixed(2)} GiB\n`
  );
}

const fh = fs.createWriteStream(path.join(__dirname, "..", "README.md"), {
  flags: "w",
});

fh.write("## Manifests\n");
fh.write("\n");
fh.write(
  `| Date                   | Manifest ID         | ${String.fromCodePoint(0x200d)}                                                             |\n`,
);
fh.write(
  "| ---------------------- | ------------------- | ------------------------------------------------------------- |\n",
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
      `[Manifest](manifests/manifest_230411_${mid}.txt)`.padEnd(61, " "),
    );
  }
  fh.write(" |\n");
}

fh.write("\n");
fh.write("## Size\n");
fh.write("\n");
fh.write("```\n");
fh.write(getSize());
fh.write("```\n");

fh.end();
