import hashlib
import base64

app_id = 2
app_prefix = b"appID"

to_hash = app_prefix+(app_id).to_bytes(8, 'big')

h = hashlib.new('sha512_256')
h.update(to_hash)
digest = h.digest()

addr = base64.b32encode(digest).rstrip(b"=")

print(addr)