## IPFS CIDs

### From an existing copy

1. Verify that your folder matches the Steam manifest **exactly** using `node scripts/verify.js <manifestId> <path>`.
2. Within it, run `ipfs add -nr . > ../ipfs.txt` to get the CID list. Notably the file we're writing to is outside of that folder to avoid dirtying it. The `n` flag means it will only compute CIDs without adding it to your node; consider removing it to seed the data.
3. Ensure the folder name in the text file is the manifest id.
4. Appropriately add the text file to the ipfs folder here.
5. `npm run update`

### From Steam

```batch
DepotDownloader.exe -app 230410 -depot 230411 -manifest MANIFEST_ID_HERE -dir MANIFEST_ID_HERE -username YOUR_USERNAME_HERE -remember-password
rmdir MANIFEST_ID_HERE\.DepotDownloader
ipfs add -nr MANIFEST_ID_HERE > MANIFEST_ID_HERE.txt
```

The `n` flag means it will only compute CIDs without adding it to your node; consider removing it to seed the data.
