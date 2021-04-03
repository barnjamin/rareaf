Smart Contracts
===============
- *helpers*: helper scripts to create platform token/nft/listing
- *listing.py*:  PyTeal to generate listing.teal.tmpl
- *listing.teal.tmpl*: Valid teal except for $TMPL_* variables to be filled in by platform, may use ./helpers/fill_args.sh to generate b64 strings to sub in
- *listing.teal*: Example contract with variables filled in

- *platform-delegate.py*: PyTeal to generate platform.teal, requires `listing.teal.tok` to get byte locations of variables (calling it platform.py screws up cryptodome py lib?)
- *platform.md*: Markdown description of how the platform contracts work together
- *platform.teal*: Teal that will be signed by platform and act as delegate signature