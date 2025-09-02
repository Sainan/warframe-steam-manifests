## Repair an existing installation via IPFS

Add your existing copy to your IPFS node without pinning, e.g.:

```bash
ipfs add --pin=false -r "2023.07.26.16.38 (M4487452668036984689)"
```

Then, use [the index](../README.md#manifests) to locate your manifest id, click on "IPFS CIDs", scroll to the bottom, and copy the CID to pin it, e.g.:

```bash
ipfs pin add --progress QmfQoQwdmecQWAJFdXNCVgEw8MtSqcYTgVKek8Ym8caZ1h
```

If this succeeded, you can now retrieve the content in pristine state from your IPFS node, e.g.:

```bash
ipfs get QmfQoQwdmecQWAJFdXNCVgEw8MtSqcYTgVKek8Ym8caZ1h
```
