const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { sha1 } = require("./common");

async function main() {
  const [deltaPath] = process.argv.slice(2);
  if (!deltaPath) {
    console.error("Usage: node scripts/add-delta.js <deltaFile>");
    process.exit(1);
  }

  const full = path.resolve(deltaPath);
  if (!fs.existsSync(full)) {
    console.error(`File not found: ${full}`);
    process.exit(1);
  }

  const out = path.join(
    __dirname,
    "..",
    "deltas",
    path.basename(full) + ".txt",
  );

  const size = fs.statSync(full).size;
  const hash = await sha1(full);

  let cid;
  try {
    cid = execFileSync("ipfs", ["add", "-Q", full], {
      encoding: "utf8",
    }).trim();
  } catch (err) {
    console.error("Failed to run ipfs add: " + err.message);
    process.exit(1);
  }

  fs.writeFileSync(out, `${size}\n${hash}\n${cid}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
