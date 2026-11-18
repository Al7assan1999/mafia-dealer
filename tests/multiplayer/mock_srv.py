# Mirrors Srv.h / Net exactly (same paths, same raw header, connection close), plus /__ control endpoints for the host-page shim.
import socket, threading, json, collections, sys
HEADER = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nCache-Control: no-store\r\nContent-Type: text/plain; charset=utf-8\r\nConnection: close\r\n\r\n"
S = {}; Q = collections.deque(); L = threading.Lock(); hits = collections.Counter()
def handle(c):
    try:
        c.settimeout(3); f = c.makefile('rb')
        line = f.readline().decode()
        if not line: return
        clen = 0
        while True:
            h = f.readline().decode()
            if not h or h in ('\r\n', '\n'): break
            if h.lower().startswith('content-length:'): clen = int(h.split(':')[1])
        path = line.split(' ')[1]; body = 'ok'
        if path.startswith('/a?'): Q.append(path[3:]); hits['a'] += 1
        elif path.startswith('/s?'): body = S.get(path[3:]) or ''; hits['s'] += 1
        elif path == '/__put':
            o = json.loads(f.read(clen)); S[o['k']] = o['v']
        elif path == '/__take': body = Q.popleft() if Q else '\x00'
        elif path == '/__clear': S.clear(); Q.clear()
        elif path == '/__hits': body = json.dumps(hits)
        else: body = 'mafia-dealer'
        c.sendall((HEADER + body).encode('utf-8'))
    except Exception as e: print('ERR', e, file=sys.stderr)
    finally: c.close()
s = socket.socket(); s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1); # optional address: two phones on one PC (127.0.0.1 and 127.0.0.2), test_v220
s.bind((sys.argv[1] if len(sys.argv) > 1 else '0.0.0.0', 8765)); s.listen(64)
print('ready', flush=True)
while True:
    c, _ = s.accept(); threading.Thread(target=handle, args=(c,), daemon=True).start()
