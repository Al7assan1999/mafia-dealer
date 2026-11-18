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
# the game's code lives in app/src (TypeScript): type-check it, then build app/assets/app.js, so the APK never ships a stale app.js
import subprocess
for _cmd in ("npm run check", "npm run build"):
    subprocess.run(_cmd, shell=True, check=True, cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
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
        "foregroundServiceType": 0x01010599, "authorities": 0x01010018, "grantUriPermissions": 0x0101001b,
        "launchMode": 0x0101001d, "scheme": 0x01010027, "host": 0x01010028, "pathPrefix": 0x0101002b, "autoVerify": 0x010104ee,
        "drawable": 0x01010199, "roundIcon": 0x0101052c, "path": 0x0101002a}
RELAY_HOST = "mafia-relay.mafiadealer.workers.dev"  # invite links https://<relay>/j/<code> open the app (v2.11)
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
        ("uses-permission", [("a", "name", T_STR, "android.permission.POST_NOTIFICATIONS")], []),  # v2.18 update alerts (Android 13+ asks once)
        ("uses-permission", [("a", "name", T_STR, "android.permission.RECEIVE_BOOT_COMPLETED")], []),  # the 11:00-17:00 checks survive a restart
        ("queries", [], [("intent", [], [("action", [("a", "name", T_STR, "android.intent.action.TTS_SERVICE")], [])])]),
        ("application", [("a", "label", T_STR, "Mafia Dealer"), ("a", "icon", T_REF, IC_LAUNCHER), ("a", "roundIcon", T_REF, IC_LAUNCHER),
                         ("a", "allowBackup", T_BOOL, True), ("a", "hardwareAccelerated", T_BOOL, True), ("a", "usesCleartextTraffic", T_BOOL, True)], [
            ("activity", [("a", "name", T_STR, PKG + ".MainActivity"), ("a", "exported", T_BOOL, True),
                          ("a", "screenOrientation", T_DEC, 1), ("a", "configChanges", T_HEX, 0x4a0),
                          ("a", "launchMode", T_DEC, 2)], [  # singleTask: a link opens the running app (onNewIntent), not a second copy
                ("intent-filter", [], [
                    ("action", [("a", "name", T_STR, "android.intent.action.MAIN")], []),
                    ("category", [("a", "name", T_STR, "android.intent.category.LAUNCHER")], []),
                ]),
                # verified app link (the relay serves /.well-known/assetlinks.json with this key's fingerprint)
                ("intent-filter", [("a", "autoVerify", T_BOOL, True)], [
                    ("action", [("a", "name", T_STR, "android.intent.action.VIEW")], []),
                    ("category", [("a", "name", T_STR, "android.intent.category.DEFAULT")], []),
                    ("category", [("a", "name", T_STR, "android.intent.category.BROWSABLE")], []),
                    ("data", [("a", "scheme", T_STR, "https"), ("a", "host", T_STR, RELAY_HOST), ("a", "pathPrefix", T_STR, "/j/")], []),
                    ("data", [("a", "scheme", T_STR, "https"), ("a", "host", T_STR, RELAY_HOST), ("a", "path", T_STR, "/u")], []),  # v2.18 update link
                ])]),
            ("service", [("a", "name", T_STR, PKG + ".Keep"), ("a", "exported", T_BOOL, False),
                         ("a", "foregroundServiceType", T_HEX, 0x10)], []),  # 0x10 = connectedDevice
            ("provider", [("a", "name", T_STR, PKG + ".Apk"), ("a", "authorities", T_STR, PKG + ".apk"), ("a", "exported", T_BOOL, False),
                          ("a", "grantUriPermissions", T_BOOL, True)], []),  # lets the installer read cache/update.apk
            # v2.18: the update checks (alarm, then boot / app update set it again); exported so the system's boot broadcast reaches it
            ("receiver", [("a", "name", T_STR, PKG + ".UpdRx"), ("a", "exported", T_BOOL, True)], [
                ("intent-filter", [], [
                    ("action", [("a", "name", T_STR, "android.intent.action.BOOT_COMPLETED")], []),
                    ("action", [("a", "name", T_STR, "android.intent.action.MY_PACKAGE_REPLACED")], []),
                ])])])])
    return bxml(tree)

def bxml(tree):
    """Binary XML (Android's compiled XML) for a (tag, attrs, kids) tree."""
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
# Resources (v2.16 adaptive icon). Type 1 drawable: the full icon (Android 7) and the two layers; type 2 mipmap: ic_launcher,
# the full icon by default and the adaptive-icon XML on Android 8+ (any density). IDs are 0x7f TT EEEE.
RES = [("drawable", [("icon", {"": "res/drawable/icon.png"}), ("ic_bg", {"": "res/drawable/ic_bg.png"}), ("ic_fg", {"": "res/drawable/ic_fg.png"})]),
       ("mipmap", [("ic_launcher", {"": "res/drawable/icon.png", "anydpi-v26": "res/mipmap-anydpi-v26/ic_launcher.xml"})])]
IC_BG, IC_FG, IC_LAUNCHER = 0x7f010001, 0x7f010002, 0x7f020000

def res_config(name):
    """ResTable_config (64 bytes): '' = default; 'anydpi-v26' = density ANY (offset 14) and sdkVersion 26 (offset 24)."""
    c = bytearray(64); struct.pack_into("<I", c, 0, 64)
    if name == "anydpi-v26": struct.pack_into("<H", c, 14, 0xFFFE); struct.pack_into("<H", c, 24, 26)
    return bytes(c)

def build_arsc(res=RES):
    paths, keys = [], []
    for _, ents in res:
        for k, cfgs in ents:
            keys.append(k)
            for p in cfgs.values():
                if p not in paths: paths.append(p)
    gpool = string_pool(paths, utf8=True)
    tpool = string_pool([t for t, _ in res], utf8=True)
    kpool = string_pool(keys, utf8=True)
    body = b""
    for ti, (tname, ents) in enumerate(res):
        tid = ti + 1
        flags = b"".join(struct.pack("<I", 0x0400 | 0x0100 if len(c) > 1 else 0) for k, c in ents)  # varies by sdk version and density
        body += struct.pack("<HHIBBHI", 0x0202, 16, 16 + len(flags), tid, 0, 0, len(ents)) + flags
        cfgs = []
        for k, c in ents:
            for n in c:
                if n not in cfgs: cfgs.append(n)
        for cn in cfgs:
            config = res_config(cn)
            hsize = 20 + len(config)
            offs, entries = b"", b""
            for k, c in ents:
                if cn in c:
                    offs += struct.pack("<I", len(entries))
                    entries += struct.pack("<HHI", 8, 0, keys.index(k)) + struct.pack("<HBBI", 8, 0, T_STR, paths.index(c[cn]))
                else: offs += struct.pack("<I", 0xFFFFFFFF)
            es = hsize + len(offs)
            body += struct.pack("<HHIBBHII", 0x0201, hsize, es + len(entries), tid, 0, 0, len(ents), es) + config + offs + entries
    phsize = 288
    name = PKG.encode("utf-16-le").ljust(256, b"\0")
    body = tpool + kpool + body
    pkg = struct.pack("<HHII", 0x0200, phsize, phsize + len(body), 0x7f) + name + \
        struct.pack("<IIIII", phsize, len(res), phsize + len(tpool), len(keys), 0) + body
    content = gpool + pkg
    return struct.pack("<HHII", 0x0002, 12, 12 + len(content), 1) + content

def build_adaptive_icon():
    return bxml(("adaptive-icon", [], [("background", [("a", "drawable", T_REF, IC_BG)], []),
                                       ("foreground", [("a", "drawable", T_REF, IC_FG)], [])]))

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
    dex = build_dex(VER_CODE)
    manifest = build_manifest()
    arsc = build_arsc()
    idir = os.path.dirname(os.path.abspath(ICON))  # icon_bg.png / icon_fg.png sit next to icon.png (node build/render_icon.js)
    files = [("AndroidManifest.xml", manifest, True), ("classes.dex", dex, True), ("resources.arsc", arsc, False),
             ("res/drawable/icon.png", open(ICON, "rb").read(), False),
             ("res/drawable/ic_bg.png", open(os.path.join(idir, "icon_bg.png"), "rb").read(), False),
             ("res/drawable/ic_fg.png", open(os.path.join(idir, "icon_fg.png"), "rb").read(), False),
             ("res/mipmap-anydpi-v26/ic_launcher.xml", build_adaptive_icon(), True)]
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
