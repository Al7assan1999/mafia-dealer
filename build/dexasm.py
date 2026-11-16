"""Tiny Dalvik assembler: classes -> classes.dex (format 035).
Method code is a list of tuples; see OPS for formats. Supports labels, branches, try/catch-all,
static/instance fields, and @JavascriptInterface method annotations."""
import struct, hashlib, zlib

def uleb(n):
    out = bytearray()
    while True:
        b = n & 0x7f; n >>= 7
        if n: out.append(b | 0x80)
        else: out.append(b); return bytes(out)

def shorty(ret, params):
    s = lambda t: 'L' if t[0] in 'L[' else t
    return s(ret) + ''.join(s(p) for p in params)

# opcode -> (format, size)
OPS = {
    'nop': (0x00, '10x'), 'move-object': (0x07, '12x'), 'move-result': (0x0a, '11x'), 'move-result-object': (0x0c, '11x'),
    'move-exception': (0x0d, '11x'), 'return-void': (0x0e, '10x'), 'return': (0x0f, '11x'), 'return-object': (0x11, '11x'),
    'const/4': (0x12, '11n'), 'const/16': (0x13, '21s'), 'const': (0x14, '31i'), 'const-string': (0x1a, '21c-s'),
    'check-cast': (0x1f, '21c-t'), 'new-instance': (0x22, '21c-t'), 'goto/16': (0x29, '20t'),
    'if-lt': (0x34, '22t'), 'if-eqz': (0x38, '21t'), 'if-nez': (0x39, '21t'), 'if-ltz': (0x3a, '21t'),
    'iget': (0x52, '22c'), 'iget-object': (0x54, '22c'), 'iput': (0x59, '22c'), 'iput-object': (0x5b, '22c'),
    'sget': (0x60, '21c-f'), 'sget-object': (0x62, '21c-f'), 'sput-object': (0x69, '21c-f'),
    'invoke-virtual': (0x6e, '35c'), 'invoke-super': (0x6f, '35c'), 'invoke-direct': (0x70, '35c'),
    'invoke-static': (0x71, '35c'), 'invoke-interface': (0x72, '35c'),
    'add-int/lit8': (0xd8, '22b'),
}
SIZE = {'10x': 1, '12x': 1, '11x': 1, '11n': 1, '21s': 2, '31i': 3, '21c-s': 2, '21c-t': 2, '21c-f': 2,
        '20t': 2, '21t': 2, '22t': 2, '22c': 2, '35c': 3, '22b': 2}

ACC_PUBLIC, ACC_PRIVATE, ACC_STATIC, ACC_CONSTRUCTOR = 0x1, 0x2, 0x8, 0x10000

class Method:
    def __init__(self, cls, name, ret, params, access, regs, code, js=False):
        self.cls, self.name, self.ret, self.params = cls, name, ret, tuple(params)
        self.access, self.regs, self.code, self.js = access, regs, code, js
    @property
    def key(self): return (self.cls, self.name, self.ret, self.params)
    @property
    def direct(self): return bool(self.access & (ACC_STATIC | ACC_PRIVATE | ACC_CONSTRUCTOR))

class Class:
    def __init__(self, name, sup, fields, methods, access=ACC_PUBLIC):
        self.name, self.sup, self.fields, self.methods, self.access = name, sup, fields, methods, access
        # fields: list of (name, type, access)

JSI = "Landroid/webkit/JavascriptInterface;"

def build(classes):
    strings, types, protos, fields, methods = set(), set(), set(), set(), set()
    def addm(k):
        c, n, r, ps = k
        methods.add(k); strings.update([n, shorty(r, ps)]); types.update([c, r, *ps]); protos.add((shorty(r, ps), r, tuple(ps)))
    def addf(k):
        fields.add(k); strings.add(k[1]); types.update([k[0], k[2]])
    types.add(JSI)
    for C in classes:
        types.update([C.name, C.sup])
        for fn, ft, fa in C.fields: addf((C.name, fn, ft))
        for M in C.methods:
            addm(M.key)
            for ins in M.code:
                op = ins[0]
                if op not in OPS: continue
                fmt = OPS[op][1]
                if fmt == '35c': addm(ins[1])
                elif fmt == '21c-s': strings.add(ins[2])
                elif fmt == '21c-t': types.add(ins[2])
                elif fmt == '21c-f': addf(ins[2])
                elif fmt == '22c': addf(ins[3])
    strings |= types
    strings = sorted(strings)
    sidx = {s: i for i, s in enumerate(strings)}
    types = sorted(types, key=lambda t: sidx[t]); tidx = {t: i for i, t in enumerate(types)}
    protos = sorted(protos, key=lambda p: (tidx[p[1]], [tidx[x] for x in p[2]]))
    pidx = {(p[1], p[2]): i for i, p in enumerate(protos)}
    fields = sorted(fields, key=lambda f: (tidx[f[0]], sidx[f[1]], tidx[f[2]])); fidx = {f: i for i, f in enumerate(fields)}
    methods = sorted(methods, key=lambda m: (tidx[m[0]], sidx[m[1]], pidx[(m[2], m[3])])); midx = {m: i for i, m in enumerate(methods)}

    def assemble(M):
        # pass 1: addresses
        addr, labels, pos = 0, {}, []
        for ins in M.code:
            if ins[0] == 'label': labels[ins[1]] = addr; continue
            if ins[0] in ('try', ): continue
            pos.append(addr); addr += SIZE[OPS[ins[0]][1]]
        n_units = addr
        out, outs, tries = [], 0, []
        a = 0
        for ins in M.code:
            op = ins[0]
            if op == 'label': continue
            if op == 'try':  # ('try', start_label, end_label, handler_label)
                tries.append((labels[ins[1]], labels[ins[2]] - labels[ins[1]], labels[ins[3]])); continue
            code, fmt = OPS[op]
            if fmt == '10x': u = [code]
            elif fmt == '11x': u = [(ins[1] << 8) | code]
            elif fmt == '12x': u = [(ins[2] << 12) | (ins[1] << 8) | code]
            elif fmt == '11n': assert -8 <= ins[2] < 8; u = [((ins[2] & 0xf) << 12) | (ins[1] << 8) | code]
            elif fmt == '21s': u = [(ins[1] << 8) | code, ins[2] & 0xffff]
            elif fmt == '31i': v = ins[2] & 0xffffffff; u = [(ins[1] << 8) | code, v & 0xffff, v >> 16]
            elif fmt == '21c-s': u = [(ins[1] << 8) | code, sidx[ins[2]]]
            elif fmt == '21c-t': u = [(ins[1] << 8) | code, tidx[ins[2]]]
            elif fmt == '21c-f': u = [(ins[1] << 8) | code, fidx[ins[2]]]
            elif fmt == '22c': u = [(ins[2] << 12) | (ins[1] << 8) | code, fidx[ins[3]]]
            elif fmt == '22b': assert -128 <= ins[3] < 128; u = [(ins[1] << 8) | code, ((ins[3] & 0xff) << 8) | ins[2]]
            elif fmt == '20t': off = labels[ins[1]] - a; assert off != 0; u = [code, off & 0xffff]
            elif fmt == '21t': off = labels[ins[2]] - a; u = [(ins[1] << 8) | code, off & 0xffff]
            elif fmt == '22t': off = labels[ins[3]] - a; u = [(ins[2] << 12) | (ins[1] << 8) | code, off & 0xffff]
            elif fmt == '35c':
                regs = list(ins[2:]); assert len(regs) <= 5 and all(r < 16 for r in regs), ins
                outs = max(outs, len(regs)); c = regs + [0] * 5
                u = [(len(regs) << 12) | (c[4] << 8) | code, midx[ins[1]], (c[3] << 12) | (c[2] << 8) | (c[1] << 4) | c[0]]
            out += u; a += len(u)
        assert a == n_units
        ins_size = len(M.params) + (0 if M.access & ACC_STATIC else 1)
        assert M.regs >= ins_size
        return out, ins_size, outs, sorted(tries)

    HDR = 0x70
    off = HDR
    sid_off = off; off += 4 * len(strings)
    tid_off = off; off += 4 * len(types)
    pid_off = off; off += 12 * len(protos)
    fid_off = off; off += 8 * len(fields)
    mid_off = off; off += 8 * len(methods)
    cd_off = off; off += 32 * len(classes)
    data_off = off
    data = bytearray()
    pos = lambda: data_off + len(data)
    def align4():
        while len(data) % 4: data.append(0)
    code_offs, code_start, ncode = {}, pos(), 0
    for C in classes:
        for M in C.methods:
            align4(); code_offs[M.key] = pos(); ncode += 1
            insns, ins_size, outs, tries = assemble(M)
            data += struct.pack("<HHHHII", M.regs, ins_size, outs, len(tries), 0, len(insns))
            data += b"".join(struct.pack("<H", x) for x in insns)
            if tries:
                if len(insns) % 2: data += b"\0\0"
                handlers = sorted(set(h for _, _, h in tries))
                hl = bytearray(uleb(len(handlers))); hoff = {}
                for h in handlers:
                    hoff[h] = len(hl); hl += bytes([0]) + uleb(h)  # size 0 (sleb), catch-all addr
                for s_, n_, h in tries:
                    data += struct.pack("<IHH", s_, n_, hoff[h])
                data += hl
    align4()
    tl_start, tl_offs = pos(), {}
    for p in protos:
        ps = p[2]
        if ps and ps not in tl_offs:
            align4(); tl_offs[ps] = pos()
            data += struct.pack("<I", len(ps)) + b"".join(struct.pack("<H", tidx[x]) for x in ps)
    align4()
    js_classes = [C for C in classes if any(M.js for M in C.methods)]
    aset_start = pos(); aset_patch = len(data); data += struct.pack("<II", 1, 0)
    align4()
    adir_start, adir_offs = pos(), {}
    for C in js_classes:
        align4(); adir_offs[C.name] = pos()
        ms = sorted(midx[M.key] for M in C.methods if M.js)
        data += struct.pack("<IIII", 0, 0, len(ms), 0) + b"".join(struct.pack("<II", m, aset_start) for m in ms)
    sd_start, sd_offs = pos(), []
    for s_ in strings:
        sd_offs.append(pos())
        b = s_.encode("utf-8"); assert all(0 < c < 0x80 for c in b)
        data += uleb(len(s_)) + b + b"\0"
    aitem_start = pos(); data += bytes([0x01]) + uleb(tidx[JSI]) + uleb(0)
    data[aset_patch + 4:aset_patch + 8] = struct.pack("<I", aitem_start)
    cdata_start, cdata_offs = pos(), {}
    for C in classes:
        cdata_offs[C.name] = pos()
        sf = sorted((fidx[(C.name, n, t)], a) for n, t, a in C.fields if a & ACC_STATIC)
        inf = sorted((fidx[(C.name, n, t)], a) for n, t, a in C.fields if not a & ACC_STATIC)
        dm = sorted((midx[M.key], M.access, code_offs[M.key]) for M in C.methods if M.direct)
        vm = sorted((midx[M.key], M.access, code_offs[M.key]) for M in C.methods if not M.direct)
        cd = bytearray(uleb(len(sf)) + uleb(len(inf)) + uleb(len(dm)) + uleb(len(vm)))
        for lst in (sf, inf):
            prev = None
            for f, a in lst: cd += uleb(f - prev if prev is not None else f) + uleb(a); prev = f
        for lst in (dm, vm):
            prev = None
            for m, a, co in lst: cd += uleb(m - prev if prev is not None else m) + uleb(a) + uleb(co); prev = m
        data += cd
    align4()
    map_off = pos()
    items = [(0x0000, 1, 0), (0x0001, len(strings), sid_off), (0x0002, len(types), tid_off), (0x0003, len(protos), pid_off),
             (0x0004, len(fields), fid_off), (0x0005, len(methods), mid_off), (0x0006, len(classes), cd_off),
             (0x2001, ncode, code_start), (0x1001, len(tl_offs), tl_start), (0x1003, 1, aset_start)]
    if js_classes: items.append((0x2006, len(js_classes), adir_start))
    items += [(0x2002, len(strings), sd_start), (0x2004, 1, aitem_start), (0x2000, len(classes), cdata_start), (0x1000, 1, map_off)]
    data += struct.pack("<I", len(items)) + b"".join(struct.pack("<HHII", t, 0, n, o) for t, n, o in items)
    align4()
    body = bytearray()
    body += b"".join(struct.pack("<I", o) for o in sd_offs)
    body += b"".join(struct.pack("<I", sidx[t]) for t in types)
    for p in protos: body += struct.pack("<III", sidx[p[0]], tidx[p[1]], tl_offs.get(p[2], 0) if p[2] else 0)
    for c, n, t in fields: body += struct.pack("<HHI", tidx[c], tidx[t], sidx[n])
    for c, n, r, ps in methods: body += struct.pack("<HHI", tidx[c], pidx[(r, ps)], sidx[n])
    for C in classes:
        body += struct.pack("<IIIIIIII", tidx[C.name], C.access, tidx[C.sup], 0, 0xffffffff, adir_offs.get(C.name, 0), cdata_offs[C.name], 0)
    assert HDR + len(body) == data_off
    fsize = data_off + len(data)
    hdr = bytearray(b"dex\n035\0") + bytes(24)
    hdr += struct.pack("<IIIIII", fsize, HDR, 0x12345678, 0, 0, map_off)
    for n, o in ((len(strings), sid_off), (len(types), tid_off), (len(protos), pid_off), (len(fields), fid_off),
                 (len(methods), mid_off), (len(classes), cd_off), (len(data), data_off)):
        hdr += struct.pack("<II", n, o)
    dex = hdr + body + data
    dex[12:32] = hashlib.sha1(dex[32:]).digest()
    dex[8:12] = struct.pack("<I", zlib.adler32(bytes(dex[12:])) & 0xffffffff)
    return bytes(dex)
