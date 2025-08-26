## IPFS CIDs

1. Verify that you have a folder matching the Steam manifest **exactly** using `node scripts/verify.js <manifestId> <path>`.
2. Within it, run `ipfs add -nr . > ../ipfs.txt` to get the CID list. Notably the file we're writing to is outside of that folder to avoid dirtying it. The `n` flag means it will only compute CIDs without adding it to your node.
3. Clean up the text file by replacing the folder name with a `.` and removing the "added " before every line. This is relatively easy in Sublime Text:
   - Select the folder name
   - Press Ctrl+F
   - Press Alt+Enter
   - Press `.`
   - Press Home/Pos1
   - Press Ctrl+Shift+Arrow Right
   - Press Delete twice
4. Appropriately add the text file to the ipfs folder here.
5. `npm run update`
