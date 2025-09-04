## Indexing

The manifests.txt is a simple text-based version of the history found at <https://steamdb.info/depot/230411/manifests/> with the exception of [6118281920152298389](https://steamdb.info/depot/230411/history/?changeid=M:6118281920152298389)

## Content Manifests

The manifests folder is populated with the results of `DepotDownloader -app 230410 -depot 230411 -manifest MANIFEST_ID_HERE -username YOUR_USERNAME_HERE -remember-password -manifest-only`

## IPFS CIDs

### From an existing copy

1. Verify that your folder matches the Steam manifest using `node scripts/verify.js <path> [manifestId]`.
2. Within it, run `ipfs add -r . > ../ipfs.txt` to get the CID list. Notably the file we're writing to is outside of that folder to avoid dirtying it.
3. Ensure the folder name in the text file is the manifest id.
4. Appropriately add the text file to the ipfs folder here.
5. `npm run update`

### From Steam

```bash
DepotDownloader -app 230410 -depot 230411 -manifest MANIFEST_ID_HERE -dir MANIFEST_ID_HERE -username YOUR_USERNAME_HERE -remember-password
ipfs add -r MANIFEST_ID_HERE > MANIFEST_ID_HERE.txt
```

Or in bulk:

```bash
cd builds
mkdir -p ../metadata/ipfs
for f in *; do
  out="../metadata/ipfs/$f.txt"
  [ -f "$out" ] && continue # skip if out file already exists
  ipfs add -r $f > "$out"
done
cd ..
```

## Deltas

Deltas are created deterministically using [HDiffPatch v4.11.1](https://github.com/sisong/HDiffPatch/releases/tag/v4.11.1) in both directions:

```bash
hdiffz -m-4 -SD -c-zstd-21-25 -d builds/NEW builds/OLD "deltas/NEW to OLD"
hdiffz -m-4 -SD -c-zstd-21-25 -d builds/OLD builds/NEW "deltas/OLD to NEW"
```

Before you begin, some important notes:

- The `.DepotDownloader` folder needs to be deleted from both folders (e.g. via `rm -r builds/*/.DepotDownloader`)
- The earliest builds are trivial to deltify, but bigger builds (with bigger diffs) increase memory and time requirements. ~45 GiB builds = up to 140 GiB memory and 90 minutes. 2020 ensmallening = up to 328 GiB memory and 36 hours. Ensure you have enough swap and patience.

Finally, the "deltas" folder in this repository is populated with the metadata:

```bash
mkdir -p metadata/deltas
for f in deltas/*; do
  [ -f "$f" ] || continue # skip directories (and non-regular files)
  out="metadata/$f.txt"
  [ -f "$out" ] && continue # skip if out file already exists
  stat --printf="%s\n" "$f" > "$out"
  sha1sum "$f" | awk '{print $1}' >> "$out"
  ipfs add -Q "$f" >> "$out"
done
```
