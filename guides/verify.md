## Verify an existing installation

The Steam manifests mirrored in this repository can be used to verify your installation, e.g. via the verify script provided here:

```
npm run verify <path> [manifestId]
```

or:

```
node scripts/verify.js <path> [manifestId]
```

If the manifest id is omitted, the script will attempt to determine the
version by searching the path for any known manifest id or IPFS CID.

This requires [Node.js](https://nodejs.org/) to be installed.
