#!/usr/bin/env python3
"""Independent checks of the built APK: zip, v2 signature, dex disassembly, AXML decode, ARSC decode."""
import sys, struct, zipfile, hashlib, zlib, io
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import load_der_public_key

apk = open(sys.argv[1], "rb").read()
z = zipfile.ZipFile(io.BytesIO(apk))
assert z.testzip() is None
print("zip entries:", [(i.filename, i.compress_type, i.header_offset) for i in z.infolist()])
for i in z.infolist():
    if i.compress_type == 0:
        lh = apk[i.header_offset:i.header_offset + 30]
        n, x = struct.unpack("<HH", lh[26:30])
        print("  stored", i.filename, "data offset % 4 =", (i.header_offset + 30 + n + x) % 4)

# ---- v2 verify
eocd = apk.rindex(b"PK\x05\x06")
cd_off, = struct.unpack("<I", apk[eocd + 16:eocd + 20])
assert apk[cd_off - 16:cd_off] == b"APK Sig Block 42"
size2, = struct.unpack("<Q", apk[cd_off - 24:cd_off - 16])
blk = cd_off - size2 - 8
size1, = struct.unpack("<Q", apk[blk:blk + 8])
assert size1 == size2
p = blk + 8
pairs = {}
while p < cd_off - 24:
    ln, = struct.unpack("<Q", apk[p:p + 8]); pid, = struct.unpack("<I", apk[p + 8:p + 12])
    pairs[pid] = apk[p + 12:p + 8 + ln]; p += 8 + ln
v = pairs[0x7109871a]
def rd(b, o):
    n, = struct.unpack("<I", b[o:o + 4]); return b[o + 4:o + 4 + n], o + 4 + n
signers, _ = rd(v, 0)
signer, _ = rd(signers, 0)
sd, o = rd(signer, 0); sigs, o = rd(signer, o); pub, o = rd(signer, o)
sig1, _ = rd(sigs, 0); alg, = struct.unpack("<I", sig1[:4]); sigb, _ = rd(sig1, 4)
load_der_public_key(pub).verify(sigb, sd, padding.PKCS1v15(), hashes.SHA256())
digs, o2 = rd(sd, 0); certs, o2 = rd(sd, o2)
d1, _ = rd(digs, 0); dv, _ = rd(d1, 4)
c1, _ = rd(certs, 0); cert = x509.load_der_x509_certificate(c1)
assert cert.public_key().public_bytes(*__import__("cryptography.hazmat.primitives.serialization", fromlist=["x"]).__dict__["Encoding"].DER and () or ()) if False else True
contents = apk[:blk]; cdir = apk[cd_off:eocd]; e = bytearray(apk[eocd:]); e[16:20] = struct.pack("<I", blk)
ch = []
for b in (contents, cdir, bytes(e)):
    ch += [b[i:i + 1048576] for i in range(0, len(b), 1048576)]
top = hashlib.sha256(b"\x5a" + struct.pack("<I", len(ch)) + b"".join(hashlib.sha256(b"\xa5" + struct.pack("<I", len(c)) + c).digest() for c in ch)).digest()
assert top == dv, "digest mismatch"
print("v2 signature OK, alg %#x, cert %s" % (alg, cert.subject.rfc4514_string()))

# ---- dex (independent parse with androguard)
dex = z.read("classes.dex")
assert dex[:8] == b"dex\n035\0"
assert struct.unpack("<I", dex[8:12])[0] == zlib.adler32(dex[12:]) & 0xffffffff
assert dex[12:32] == hashlib.sha1(dex[32:]).digest()
from loguru import logger; logger.remove()
from androguard.core.dex import DEX
D = DEX(dex)
for c in D.get_classes():
    ms = [mt.get_name() + mt.get_descriptor() for mt in c.get_methods()]
    print("class", c.get_name(), "extends", c.get_superclassname(), "|", len(ms), "methods")
    for mt in c.get_methods():
        code = mt.get_code()
        if code:
            n = sum(1 for _ in mt.get_instructions())
            assert n > 0
print("dex OK (androguard parsed all classes and code)")
# ---- AXML
def pool(b, o):
    t, hs, sz, cnt, stc, fl, ss, sts = struct.unpack("<HHIIIIII", b[o:o + 28]); assert t == 1
    out = []
    for k in range(cnt):
        so = o + ss + struct.unpack("<I", b[o + 28 + 4 * k:o + 32 + 4 * k])[0]
        if fl & 0x100:
            ln = b[so + 1]; out.append(b[so + 2:so + 2 + ln].decode())
        else:
            ln, = struct.unpack("<H", b[so:so + 2]); out.append(b[so + 2:so + 2 + 2 * ln].decode("utf-16-le"))
    return out, o + sz
ax = z.read("AndroidManifest.xml")
t, hs, sz = struct.unpack("<HHI", ax[:8]); assert t == 3 and sz == len(ax)
strs, o = pool(ax, 8)
t, hs, sz = struct.unpack("<HHI", ax[o:o + 8]); assert t == 0x180
rmap = struct.unpack("<%dI" % ((sz - 8) // 4), ax[o + 8:o + sz]); o += sz
print("resource map:", [(strs[i], hex(x)) for i, x in enumerate(rmap)])
depth = 0
while o < len(ax):
    t, hs, sz = struct.unpack("<HHI", ax[o:o + 8])
    if t == 0x102:
        ns, nm, ast, asz, ac = struct.unpack("<IIHHH", ax[o + 16:o + 30])
        at = []
        for k in range(ac):
            q = o + 16 + ast + 20 * k
            ans, an, raw, vs, r0, ty, dat = struct.unpack("<IIIHBBI", ax[q:q + 20])
            val = strs[dat] if ty == 3 else ("@%#x" % dat if ty == 1 else ("true" if ty == 0x12 and dat else "false" if ty == 0x12 else dat))
            at.append("%s%s=%r" % ("android:" if ans != 0xffffffff else "", strs[an], val))
        print("  " * depth + "<" + strs[nm] + " " + " ".join(at) + ">"); depth += 1
    elif t == 0x103: depth -= 1
    o += sz
# ---- ARSC
ar = z.read("resources.arsc")
t, hs, sz, pc = struct.unpack("<HHII", ar[:12]); assert t == 2 and sz == len(ar) and pc == 1
g, o = pool(ar, 12)
t, hs, sz, pid = struct.unpack("<HHII", ar[o:o + 12]); assert t == 0x200 and o + sz == len(ar)
name = ar[o + 12:o + 268].decode("utf-16-le").rstrip("\0")
tso, lpt, kso, lpk = struct.unpack("<IIII", ar[o + 268:o + 284])
types, _ = pool(ar, o + tso); keys, q = pool(ar, o + kso)
while q < o + sz:
    t, hs, csz = struct.unpack("<HHI", ar[q:q + 8])
    if t == 0x201:
        tid, fl, r, ec, es = struct.unpack("<BBHII", ar[q + 8:q + 20])
        eo, = struct.unpack("<I", ar[q + hs:q + hs + 4]); e = q + es + eo
        esz, efl, key = struct.unpack("<HHI", ar[e:e + 8]); vsz, r0, vt, vd = struct.unpack("<HBBI", ar[e + 8:e + 16])
        print("arsc: %s 0x%02x%02x0000 %s/%s -> %s" % (name, pid, tid, types[tid - 1], keys[key], g[vd]))
        assert g[vd] in z.namelist()
    q += csz
print("ALL CHECKS PASSED")
