## Indexing

The manifests.txt is a simple text-based version of the history found at <https://steamdb.info/depot/230411/manifests/> with the exception of [6118281920152298389](https://steamdb.info/depot/230411/history/?changeid=M:6118281920152298389)

## Content Manifests

The manifests folder is populated with the results of `DepotDownloader -app 230410 -depot 230411 -manifest MANIFEST_ID_HERE -username YOUR_USERNAME_HERE -remember-password -manifest-only`

## IPFS CIDs

### From an existing copy

1. Verify that your folder matches the Steam manifest using `node scripts/verify.js <manifestId> <path>`.
2. Within it, run `ipfs add -nr . > ../ipfs.txt` to get the CID list. Notably the file we're writing to is outside of that folder to avoid dirtying it. The `n` flag means it will only compute CIDs without adding it to your node; consider removing it to seed the data.
3. Ensure the folder name in the text file is the manifest id.
4. Appropriately add the text file to the ipfs folder here.
5. `npm run update`

### From Steam

```batch
DepotDownloader -app 230410 -depot 230411 -manifest MANIFEST_ID_HERE -dir MANIFEST_ID_HERE -username YOUR_USERNAME_HERE -remember-password
ipfs add -nr MANIFEST_ID_HERE > MANIFEST_ID_HERE.txt
```

The `n` flag means it will only compute CIDs without adding it to your node; consider removing it to seed the data.

## Deltas

Deltas are created deterministically using [HDiffPatch v4.11.1](https://github.com/sisong/HDiffPatch/releases/tag/v4.11.1) like so: `hdiffz -m-4 -SD -c-zstd-21-25 -d NEW OLD "NEW to OLD"`

Please note that the `.DepotDownloader` folder needs to be deleted from both folders

Finally, the deltas are recorded in the deltas folder like so:

```bash
for f in *; do
  [ -f "$f" ] || continue   # skip directories, only process regular files
  out="$f.txt"
  stat --printf="%s\n" "$f" > "$out"
  sha1sum "$f" | awk '{print $1}' >> "$out"
  ipfs add -Qn "$f" >> "$out"
done
```

The `n` flag means it will only compute CIDs without adding it to your node; consider removing it to seed the data.
