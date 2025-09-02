## Upgrade/downgrade an existing installation via IPFS

Find your version in [the index](../README.md#manifests), click on the delta you're interested in, and copy the CID to pin it, e.g.:

```bash
ipfs pin add --progress QmTWrLCCWcTjPibLB7NG863JFst7nXGEHx9iPeGDbGxpY9
```

If this succeeded, you can now retrieve the delta from your IPFS node, e.g.:

```bash
ipfs get QmTWrLCCWcTjPibLB7NG863JFst7nXGEHx9iPeGDbGxpY9 "--output=3725569727599851360 to 8461211368258506784"
```

Use [HDiffPatch](https://github.com/sisong/HDiffPatch) to apply the delta, e.g.:

```bash
hpatchz 3725569727599851360 "3725569727599851360 to 8461211368258506784" 8461211368258506784
```
