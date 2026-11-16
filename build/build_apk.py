#!/usr/bin/env python3
"""Build a minimal WebView APK without the Android SDK.
Writes: classes.dex, binary AndroidManifest.xml, resources.arsc (one icon), then zips and v2-signs."""
import struct, hashlib, zlib, io, os, sys, zipfile, datetime
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding

PKG = "com.mafiadealer.app"
CLS = "Lcom/mafiadealer/app/MainActivity;"
OUT = sys.argv[1]
ASSET_DIR = sys.argv[2]
ICON = sys.argv[3]
KEYFILE = sys.argv[4]
# version comes from the app itself: const APP={code:N,name:'X'} in index.html
import re as _re
_m = _re.search(r"const APP=\{code:(\d+),name:'([^']+)'\}", open(os.path.join(ASSET_DIR, 'index.html'), encoding='utf-8').read())
VER_CODE, VER_NAME = int(_m.group(1)), _m.group(2)

def uleb(n):
    out = bytearray()
    while True:
        b = n & 0x7f; n >>= 7
        if n: out.append(b | 0x80)
        else: out.append(b); return bytes(out)

from app_dex import build_dex

# ------------------------------------------------------------------ string pool (UTF-16)
def string_pool(strs, utf8=False):
    offs, blob = [], bytearray()
    for s in strs:
        offs.append(len(blob))
        if utf8:
            b = s.encode("utf-8")
            assert len(s) < 128 and len(b) < 128
            blob += bytes([len(s), len(b)]) + b + b"\0"
        else:
            u = s.encode("utf-16-le")
            blob += struct.pack("<H", len(s)) + u + b"\0\0"
    while len(blob) % 4: blob.append(0)
    hsize = 28
    start = hsize + 4 * len(strs)
    size = start + len(blob)
    return struct.pack("<HHIIIIII", 0x0001, hsize, size, len(strs), 0, 0x100 if utf8 else 0, start, 0) + \
        b"".join(struct.pack("<I", o) for o in offs) + bytes(blob)

# ------------------------------------------------------------------ binary manifest
ANDROID_NS = "http://schemas.android.com/apk/res/android"
ATTR = {"theme": 0x01010000, "label": 0x01010001, "icon": 0x01010002, "name": 0x01010003, "exported": 0x01010010,
        "screenOrientation": 0x0101001e, "configChanges": 0x0101001f, "minSdkVersion": 0x0101020c,
        "versionCode": 0x0101021b, "versionName": 0x0101021c, "targetSdkVersion": 0x01010270,
        "allowBackup": 0x01010280, "hardwareAccelerated": 0x010102d3, "usesCleartextTraffic": 0x010104ec,
        "foregroundServiceType": 0x01010599, "authorities": 0x01010018, "grantUriPermissions": 0x0101001b}
T_REF, T_STR, T_DEC, T_HEX, T_BOOL = 0x01, 0x03, 0x10, 0x11, 0x12

def build_manifest():
    tree = ("manifest", [(None, "package", T_STR, PKG), ("a", "versionCode", T_DEC, VER_CODE), ("a", "versionName", T_STR, VER_NAME)], [
        ("uses-sdk", [("a", "minSdkVersion", T_DEC, 24), ("a", "targetSdkVersion", T_DEC, 34)], []),
        ("uses-permission", [("a", "name", T_STR, "android.permission.VIBRATE")], []),
        ("uses-permission", [("a", "name", T_STR, "android.permission.INTERNET")], []),
        ("uses-permission", [("a", "name", T_STR, "android.permission.ACCESS_WIFI_STATE")], []),
        # foreground service while hosting (type connectedDevice needs CHANGE_WIFI_STATE as its prerequisite)
        ("uses-permission", [("a", "name", T_STR, "android.permission.CHANGE_WIFI_STATE")], []),
        ("uses-permission", [("a", "name", T_STR, "android.permission.WAKE_LOCK")], []),
        ("uses-permission", [("a", "name", T_STR, "android.permission.FOREGROUND_SERVICE")], []),
        ("uses-permission", [("a", "name", T_STR, "android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE")], []),
        ("uses-permission", [("a", "name", T_STR, "android.permission.REQUEST_INSTALL_PACKAGES")], []),  # in-app updates
        ("queries", [], [("intent", [], [("action", [("a", "name", T_STR, "android.intent.action.TTS_SERVICE")], [])])]),
        ("application", [("a", "label", T_STR, "Mafia Dealer"), ("a", "icon", T_REF, 0x7f010000),
                         ("a", "allowBackup", T_BOOL, True), ("a", "hardwareAccelerated", T_BOOL, True), ("a", "usesCleartextTraffic", T_BOOL, True)], [
            ("activity", [("a", "name", T_STR, PKG + ".MainActivity"), ("a", "exported", T_BOOL, True),
                          ("a", "screenOrientation", T_DEC, 1), ("a", "configChanges", T_HEX, 0x4a0)], [
                ("intent-filter", [], [
                    ("action", [("a", "name", T_STR, "android.intent.action.MAIN")], []),
                    ("category", [("a", "name", T_STR, "android.intent.category.LAUNCHER")], []),
                ])]),
            ("service", [("a", "name", T_STR, PKG + ".Keep"), ("a", "exported", T_BOOL, False),
                         ("a", "foregroundServiceType", T_HEX, 0x10)], []),  # 0x10 = connectedDevice
            ("provider", [("a", "name", T_STR, PKG + ".Apk"), ("a", "authorities", T_STR, PKG + ".apk"), ("a", "exported", T_BOOL, False),
                          ("a", "grantUriPermissions", T_BOOL, True)], [])])])  # lets the installer read cache/update.apk
    # collect strings: android attribute names first (ordered by id), matching resource map
    attr_names = set()
    others = []
    def walk(n):
        tag, attrs, kids = n
        for ns, name, ty, val in attrs:
            if ns: attr_names.add(name)
        for k in kids: walk(k)
    walk(tree)
    attr_list = sorted(attr_names, key=lambda a: ATTR[a])
    strs = list(attr_list)
    def add(s):
        if s not in strs: strs.append(s)
    add("android"); add(ANDROID_NS)
    def walk2(n):
        tag, attrs, kids = n
        add(tag)
        for ns, name, ty, val in attrs:
            add(name)
            if ty == T_STR: add(val)
        for k in kids: walk2(k)
    walk2(tree)
    si = {s: i for i, s in enumerate(strs)}
    chunks = bytearray()
    chunks += string_pool(strs)
    rm = b"".join(struct.pack("<I", ATTR[a]) for a in attr_list)
    chunks += struct.pack("<HHI", 0x0180, 8, 8 + len(rm)) + rm
    line = [1]
    def node(typ, ext):
        line[0] += 1
        return struct.pack("<HHIII", typ, 16, 16 + len(ext), line[0], 0xffffffff) + ext
    chunks += node(0x0100, struct.pack("<II", si["android"], si[ANDROID_NS]))
    def emit(n):
        nonlocal chunks
        tag, attrs, kids = n
        def key(a):
            return (0, ATTR[a[1]]) if a[0] else (-1, 0)
        attrs = sorted(attrs, key=key)
        ab = bytearray()
        for ns, name, ty, val in attrs:
            nsi = si[ANDROID_NS] if ns else 0xffffffff
            if ty == T_STR: raw, data = si[val], si[val]
            elif ty == T_BOOL: raw, data = 0xffffffff, 0xffffffff if val else 0
            else: raw, data = 0xffffffff, val
            ab += struct.pack("<IIIHBBI", nsi, si[name], raw, 8, 0, ty, data)
        ext = struct.pack("<IIHHHHHH", 0xffffffff, si[tag], 20, 20, len(attrs), 0, 0, 0) + ab
        chunks += node(0x0102, ext)
        for k in kids: emit(k)
        chunks += node(0x0103, struct.pack("<II", 0xffffffff, si[tag]))
    emit(tree)
    chunks += node(0x0101, struct.pack("<II", si["android"], si[ANDROID_NS]))
    return struct.pack("<HHI", 0x0003, 8, 8 + len(chunks)) + bytes(chunks)

# ------------------------------------------------------------------ resources.arsc
def build_arsc(icon_path):
    gpool = string_pool([icon_path], utf8=True)
    tpool = string_pool(["drawable"], utf8=True)
    kpool = string_pool(["icon"], utf8=True)
    spec = struct.pack("<HHIBBHI", 0x0202, 16, 16 + 4, 1, 0, 0, 1) + struct.pack("<I", 0)
    config = struct.pack("<I", 64) + bytes(60)
    hsize = 20 + len(config)
    entries_start = hsize + 4
    entry = struct.pack("<HHI", 8, 0, 0) + struct.pack("<HBBI", 8, 0, T_STR, 0)
    tchunk = struct.pack("<HHIBBHII", 0x0201, hsize, entries_start + len(entry), 1, 0, 0, 1, entries_start) + config + \
        struct.pack("<I", 0) + entry
    phsize = 288
    name = PKG.encode("utf-16-le").ljust(256, b"\0")
    type_off = phsize
    key_off = phsize + len(tpool)
    body = tpool + kpool + spec + tchunk
    pkg = struct.pack("<HHII", 0x0200, phsize, phsize + len(body), 0x7f) + name + \
        struct.pack("<IIIII", type_off, 1, key_off, 1, 0) + body
    assert len(pkg) == phsize + len(body)
    content = gpool + pkg
    return struct.pack("<HHII", 0x0002, 12, 12 + len(content), 1) + content

# ------------------------------------------------------------------ zip (aligned)
def build_zip(files):
    """files: list of (name, bytes, compress). Stored entries aligned to 4 bytes."""
    buf = io.BytesIO()
    cd = bytearray()
    dt = (0, 0x21)  # 1980-01-01
    for name, data, comp in files:
        nb = name.encode()
        crc = zlib.crc32(data) & 0xffffffff
        if comp:
            co = zlib.compressobj(9, zlib.DEFLATED, -15); cdata = co.compress(data) + co.flush(); method = 8
        else:
            cdata = data; method = 0
        off = buf.tell()
        extra = b""
        if method == 0:
            pad = (4 - (off + 30 + len(nb)) % 4) % 4
            extra = b"\0" * pad
        buf.write(struct.pack("<IHHHHHIIIHH", 0x04034b50, 20, 0, method, dt[0], dt[1], crc, len(cdata), len(data), len(nb), len(extra)))
        buf.write(nb + extra + cdata)
        cd += struct.pack("<IHHHHHHIIIHHHHHII", 0x02014b50, 20, 20, 0, method, dt[0], dt[1], crc, len(cdata), len(data),
                          len(nb), 0, 0, 0, 0, 0, off) + nb
    cd_off = buf.tell()
    buf.write(cd)
    buf.write(struct.pack("<IHHHHIIH", 0x06054b50, 0, 0, len(files), len(files), len(cd), cd_off, 0))
    return buf.getvalue(), cd_off, len(cd)

# ------------------------------------------------------------------ APK Signature Scheme v2
def lp(b): return struct.pack("<I", len(b)) + b

def v2_sign(apk, cd_off, cd_len, key, cert_der):
    contents = apk[:cd_off]
    cdir = apk[cd_off:cd_off + cd_len]
    eocd = apk[cd_off + cd_len:]
    def chunks(b):
        return [b[i:i + 1048576] for i in range(0, len(b), 1048576)] if b else []
    allc = chunks(contents) + chunks(cdir) + chunks(eocd)
    dig = b"".join(hashlib.sha256(b"\xa5" + struct.pack("<I", len(c)) + c).digest() for c in allc)
    top = hashlib.sha256(b"\x5a" + struct.pack("<I", len(allc)) + dig).digest()
    ALG = 0x0103
    digests = lp(lp(struct.pack("<I", ALG) + lp(top)))
    certs = lp(lp(cert_der))
    signed_data = digests + certs + lp(b"")
    sig = key.sign(signed_data, padding.PKCS1v15(), hashes.SHA256())
    pub = key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    signer = lp(signed_data) + lp(lp(struct.pack("<I", ALG) + lp(sig))) + lp(pub)
    value = lp(lp(signer))
    pair = struct.pack("<QI", 4 + len(value), 0x7109871a) + value
    size = len(pair) + 8 + 16
    block = struct.pack("<Q", size) + pair + struct.pack("<Q", size) + b"APK Sig Block 42"
    new_cd_off = cd_off + len(block)
    eocd2 = bytearray(eocd)
    eocd2[16:20] = struct.pack("<I", new_cd_off)
    return contents + block + cdir + bytes(eocd2)

def load_key():
    # Never generate a key here: an APK signed with a new key can't update the installed app.
    if not os.path.exists(KEYFILE):
        sys.exit(f"signing key not found: {KEYFILE} (use the release key, never a new one)")
    data = open(KEYFILE, "rb").read()
    key = serialization.load_pem_private_key(data.split(b"-----BEGIN CERTIFICATE-----")[0], None)
    cert = x509.load_pem_x509_certificate(b"-----BEGIN CERTIFICATE-----" + data.split(b"-----BEGIN CERTIFICATE-----")[1])
    return key, cert.public_bytes(serialization.Encoding.DER)

if __name__ == "__main__":
    dex = build_dex()
    manifest = build_manifest()
    icon_name = "res/drawable/icon.png"
    arsc = build_arsc(icon_name)
    files = [("AndroidManifest.xml", manifest, True), ("classes.dex", dex, True),
             ("resources.arsc", arsc, False), (icon_name, open(ICON, "rb").read(), False)]
    for root, dirs, names in os.walk(ASSET_DIR):  # includes subfolders (assets/fonts/)
        dirs.sort()
        for fn in sorted(names):
            rel = os.path.relpath(os.path.join(root, fn), ASSET_DIR).replace(os.sep, "/")
            files.append(("assets/" + rel, open(os.path.join(root, fn), "rb").read(), not fn.endswith(".woff2")))  # woff2 is already compressed
    apk, cdo, cdl = build_zip(files)
    key, cert = load_key()
    signed = v2_sign(apk, cdo, cdl, key, cert)
    open(OUT, "wb").write(signed)
    for n, b in [("classes.dex", dex), ("AndroidManifest.xml", manifest), ("resources.arsc", arsc)]:
        open(os.path.join(os.path.dirname(OUT), n), "wb").write(b)
    print("wrote", OUT, len(signed), "bytes")
