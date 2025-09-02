const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function sha1(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");
    const stream = fs.createReadStream(file);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function getRootIpfsCid(manifestId) {
  const ipfsFile = path.join(__dirname, "..", "ipfs", `${manifestId}.txt`);
  if (!fs.existsSync(ipfsFile)) return null;
  const lines = fs.readFileSync(ipfsFile, "utf8").trim().split(/\r?\n/);
  const last = lines[lines.length - 1];
  const match = last.match(/^added\s+(\S+)/);
  return match ? match[1] : null;
}

module.exports = {
  sha1,
  getRootIpfsCid,
};
