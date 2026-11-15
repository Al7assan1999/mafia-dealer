from dexasm import *

P = "Lcom/mafiadealer/app/"
MAIN, VOICE, NET, SRV = P + "MainActivity;", P + "Voice;", P + "Net;", P + "Srv;"
ACT = "Landroid/app/Activity;"; WV = "Landroid/webkit/WebView;"; WS = "Landroid/webkit/WebSettings;"
WIN = "Landroid/view/Window;"; CTX = "Landroid/content/Context;"; BUN = "Landroid/os/Bundle;"
VIEW = "Landroid/view/View;"; STR = "Ljava/lang/String;"; OBJ = "Ljava/lang/Object;"
TTS = "Landroid/speech/tts/TextToSpeech;"; OIL = "Landroid/speech/tts/TextToSpeech$OnInitListener;"
LOC = "Ljava/util/Locale;"; CS = "Ljava/lang/CharSequence;"
CHM = "Ljava/util/concurrent/ConcurrentHashMap;"; CLQ = "Ljava/util/concurrent/ConcurrentLinkedQueue;"
THR = "Ljava/lang/Thread;"; SS = "Ljava/net/ServerSocket;"; SOCK = "Ljava/net/Socket;"
BR = "Ljava/io/BufferedReader;"; ISR = "Ljava/io/InputStreamReader;"; RDR = "Ljava/io/Reader;"; IS = "Ljava/io/InputStream;"
OS = "Ljava/io/OutputStream;"; SB = "Ljava/lang/StringBuilder;"
WM = "Landroid/net/wifi/WifiManager;"; WI = "Landroid/net/wifi/WifiInfo;"; DHCP = "Landroid/net/DhcpInfo;"

m = lambda c, n, r, *ps: (c, n, r, tuple(ps))
COLOR = 0xff0b0a0f
HEADER = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nCache-Control: no-store\r\nContent-Type: text/plain; charset=utf-8\r\nConnection: close\r\n\r\n"
F_W = (MAIN, "w", WV); F_T = (VOICE, "t", TTS); F_US = (LOC, "US", LOC)
F_S = (NET, "S", CHM); F_Q = (NET, "Q", CLQ); F_TH = (NET, "T", SRV); F_C = (NET, "c", CTX); F_P = (SRV, "p", "I")

main = Class(MAIN, ACT, [("w", WV, ACC_PRIVATE)], [
    Method(MAIN, "<init>", "V", [], ACC_PUBLIC | ACC_CONSTRUCTOR, 1, [
        ('invoke-direct', m(ACT, "<init>", "V"), 0), ('return-void',)]),
    Method(MAIN, "onCreate", "V", [BUN], ACC_PUBLIC, 5, [  # p0=v3 p1=v4
        ('invoke-super', m(ACT, "onCreate", "V", BUN), 3, 4),
        ('const/4', 0, 1), ('invoke-virtual', m(ACT, "requestWindowFeature", "Z", "I"), 3, 0),
        ('invoke-virtual', m(ACT, "getWindow", WIN), 3), ('move-result-object', 0),
        ('const', 1, 0x80000080), ('invoke-virtual', m(WIN, "addFlags", "V", "I"), 0, 1),
        ('const', 1, COLOR), ('invoke-virtual', m(WIN, "setStatusBarColor", "V", "I"), 0, 1),
        ('invoke-virtual', m(WIN, "setNavigationBarColor", "V", "I"), 0, 1),
        ('new-instance', 0, WV), ('invoke-direct', m(WV, "<init>", "V", CTX), 0, 3), ('iput-object', 0, 3, F_W),
        ('invoke-virtual', m(WV, "setBackgroundColor", "V", "I"), 0, 1),
        ('invoke-virtual', m(WV, "getSettings", WS), 0), ('move-result-object', 1),
        ('const/4', 2, 1),
        ('invoke-virtual', m(WS, "setJavaScriptEnabled", "V", "Z"), 1, 2),
        ('invoke-virtual', m(WS, "setDomStorageEnabled", "V", "Z"), 1, 2),
        ('invoke-virtual', m(WS, "setAllowUniversalAccessFromFileURLs", "V", "Z"), 1, 2),
        ('const/4', 2, 0),
        ('invoke-virtual', m(WS, "setMediaPlaybackRequiresUserGesture", "V", "Z"), 1, 2),
        ('new-instance', 1, VOICE), ('invoke-direct', m(VOICE, "<init>", "V", CTX), 1, 3),
        ('const-string', 2, "Android"), ('invoke-virtual', m(WV, "addJavascriptInterface", "V", OBJ, STR), 0, 1, 2),
        ('label', 'n0'),
        ('new-instance', 1, NET), ('invoke-direct', m(NET, "<init>", "V", CTX), 1, 3),
        ('const-string', 2, "Net"), ('invoke-virtual', m(WV, "addJavascriptInterface", "V", OBJ, STR), 0, 1, 2),
        ('label', 'n1'),
        ('label', 'nok'),
        ('const-string', 1, "file:///android_asset/index.html"), ('invoke-virtual', m(WV, "loadUrl", "V", STR), 0, 1),
        ('invoke-virtual', m(ACT, "setContentView", "V", VIEW), 3, 0),
        ('return-void',),
        ('label', 'nfail'), ('goto/16', 'nok'),
        ('try', 'n0', 'n1', 'nfail')]),
    Method(MAIN, "onBackPressed", "V", [], ACC_PUBLIC, 3, [  # p0=v2
        ('iget-object', 0, 2, F_W), ('invoke-virtual', m(WV, "canGoBack", "Z"), 0), ('move-result', 1),
        ('if-eqz', 1, 'super'), ('invoke-virtual', m(WV, "goBack", "V"), 0), ('return-void',),
        ('label', 'super'), ('invoke-super', m(ACT, "onBackPressed", "V"), 2), ('return-void',)]),
])

voice = Class(VOICE, OBJ, [("t", TTS, ACC_PRIVATE)], [
    Method(VOICE, "<init>", "V", [CTX], ACC_PUBLIC | ACC_CONSTRUCTOR, 4, [  # p0=v2 p1=v3
        ('invoke-direct', m(OBJ, "<init>", "V"), 2), ('new-instance', 0, TTS), ('const/4', 1, 0),
        ('invoke-direct', m(TTS, "<init>", "V", CTX, OIL), 0, 3, 1), ('iput-object', 0, 2, F_T), ('return-void',)]),
    Method(VOICE, "speak", "V", [STR, "F", "F"], ACC_PUBLIC, 7, [  # p0=v3 text=v4 pitch=v5 rate=v6
        ('iget-object', 0, 3, F_T), ('sget-object', 1, F_US),
        ('invoke-virtual', m(TTS, "setLanguage", "I", LOC), 0, 1),
        ('invoke-virtual', m(TTS, "setPitch", "I", "F"), 0, 5), ('invoke-virtual', m(TTS, "setSpeechRate", "I", "F"), 0, 6),
        ('const/4', 1, 0), ('const/4', 2, 0), ('invoke-virtual', m(TTS, "speak", "I", CS, "I", BUN, STR), 0, 4, 1, 2, 2),
        ('return-void',)], js=True),
    Method(VOICE, "stop", "V", [], ACC_PUBLIC, 2, [
        ('iget-object', 0, 1, F_T), ('invoke-virtual', m(TTS, "stop", "I"), 0), ('return-void',)], js=True),
])

# ---- Net: JS bridge + shared store/queue (static so a restarted activity reuses the running server)
net = Class(NET, OBJ, [("S", CHM, ACC_PUBLIC | ACC_STATIC), ("Q", CLQ, ACC_PUBLIC | ACC_STATIC),
                       ("T", SRV, ACC_PUBLIC | ACC_STATIC), ("c", CTX, ACC_PRIVATE)], [
    Method(NET, "<clinit>", "V", [], ACC_STATIC | ACC_CONSTRUCTOR, 1, [
        ('new-instance', 0, CHM), ('invoke-direct', m(CHM, "<init>", "V"), 0), ('sput-object', 0, F_S),
        ('new-instance', 0, CLQ), ('invoke-direct', m(CLQ, "<init>", "V"), 0), ('sput-object', 0, F_Q),
        ('return-void',)]),
    Method(NET, "<init>", "V", [CTX], ACC_PUBLIC | ACC_CONSTRUCTOR, 2, [
        ('invoke-direct', m(OBJ, "<init>", "V"), 0), ('iput-object', 1, 0, F_C), ('return-void',)]),
    Method(NET, "start", "V", ["I"], ACC_PUBLIC, 3, [  # p0=v1 port=v2
        ('sget-object', 0, F_TH), ('if-nez', 0, 'done'),
        ('new-instance', 0, SRV), ('invoke-direct', m(SRV, "<init>", "V", "I"), 0, 2), ('sput-object', 0, F_TH),
        ('invoke-virtual', m(SRV, "start", "V"), 0),
        ('label', 'done'), ('return-void',)], js=True),
    Method(NET, "running", "Z", [], ACC_PUBLIC, 2, [  # p0=v1
        ('sget-object', 0, F_TH), ('if-eqz', 0, 'no'), ('const/4', 0, 1), ('return', 0),
        ('label', 'no'), ('const/4', 0, 0), ('return', 0)], js=True),
    Method(NET, "put", "V", [STR, STR], ACC_PUBLIC, 4, [  # p0=v1 k=v2 v=v3
        ('sget-object', 0, F_S), ('invoke-virtual', m(CHM, "put", OBJ, OBJ, OBJ), 0, 2, 3), ('return-void',)], js=True),
    Method(NET, "take", STR, [], ACC_PUBLIC, 2, [
        ('sget-object', 0, F_Q), ('invoke-virtual', m(CLQ, "poll", OBJ), 0), ('move-result-object', 0),
        ('check-cast', 0, STR), ('return-object', 0)], js=True),
    Method(NET, "clear", "V", [], ACC_PUBLIC, 2, [
        ('sget-object', 0, F_S), ('invoke-virtual', m(CHM, "clear", "V"), 0),
        ('sget-object', 0, F_Q), ('invoke-virtual', m(CLQ, "clear", "V"), 0), ('return-void',)], js=True),
    Method(NET, "ip", STR, [], ACC_PUBLIC, 4, [  # p0=v3 -> "ip,gateway" as little-endian ints
        ('label', 't0'),
        ('iget-object', 0, 3, F_C), ('invoke-virtual', m(CTX, "getApplicationContext", CTX), 0), ('move-result-object', 0),
        ('const-string', 1, "wifi"), ('invoke-virtual', m(CTX, "getSystemService", OBJ, STR), 0, 1), ('move-result-object', 0),
        ('check-cast', 0, WM),
        ('new-instance', 1, SB), ('invoke-direct', m(SB, "<init>", "V"), 1),
        ('invoke-virtual', m(WM, "getConnectionInfo", WI), 0), ('move-result-object', 2),
        ('invoke-virtual', m(WI, "getIpAddress", "I"), 2), ('move-result', 2),
        ('invoke-virtual', m(SB, "append", SB, "I"), 1, 2),
        ('const-string', 2, ","), ('invoke-virtual', m(SB, "append", SB, STR), 1, 2),
        ('invoke-virtual', m(WM, "getDhcpInfo", DHCP), 0), ('move-result-object', 2),
        ('iget', 2, 2, (DHCP, "gateway", "I")),
        ('invoke-virtual', m(SB, "append", SB, "I"), 1, 2),
        ('invoke-virtual', m(SB, "toString", STR), 1), ('move-result-object', 0),
        ('return-object', 0),
        ('label', 't1'),
        ('label', 'fail'), ('const-string', 0, "0,0"), ('return-object', 0),
        ('try', 't0', 't1', 'fail')], js=True),
    Method(NET, "get", STR, [STR], ACC_PUBLIC | ACC_STATIC, 2, [  # k=v1
        ('sget-object', 0, F_S), ('invoke-virtual', m(CHM, "get", OBJ, OBJ), 0, 1), ('move-result-object', 0),
        ('check-cast', 0, STR), ('return-object', 0)]),
    Method(NET, "add", "V", [STR], ACC_PUBLIC | ACC_STATIC, 2, [  # s=v1
        ('sget-object', 0, F_Q), ('invoke-virtual', m(CLQ, "add", "Z", OBJ), 0, 1), ('return-void',)]),
])

# ---- Srv: tiny HTTP server.  GET /a?<x> -> queue x ;  GET /s?<k> -> store[k] ;  anything else -> "mafia-dealer"
srv = Class(SRV, THR, [("p", "I", ACC_PRIVATE)], [
    Method(SRV, "<init>", "V", ["I"], ACC_PUBLIC | ACC_CONSTRUCTOR, 2, [
        ('invoke-direct', m(THR, "<init>", "V"), 0), ('iput', 1, 0, F_P), ('return-void',)]),
    Method(SRV, "run", "V", [], ACC_PUBLIC, 4, [  # p0=v3
        ('label', 't0'),
        ('new-instance', 0, SS), ('iget', 1, 3, F_P), ('invoke-direct', m(SS, "<init>", "V", "I"), 0, 1),
        ('label', 'loop'),
        ('invoke-virtual', m(SS, "accept", SOCK), 0), ('move-result-object', 2),
        ('invoke-static', m(SRV, "h", "V", SOCK), 2),
        ('goto/16', 'loop'),
        ('label', 't1'),
        ('label', 'fail'), ('const/4', 0, 0), ('sput-object', 0, F_TH), ('return-void',),
        ('try', 't0', 't1', 'fail')]),
    Method(SRV, "h", "V", [SOCK], ACC_PUBLIC | ACC_STATIC, 7, [  # sock=v6
        ('label', 'a0'),
        ('const/16', 0, 3000), ('invoke-virtual', m(SOCK, "setSoTimeout", "V", "I"), 6, 0),
        ('new-instance', 0, BR), ('new-instance', 1, ISR),
        ('invoke-virtual', m(SOCK, "getInputStream", IS), 6), ('move-result-object', 2),
        ('invoke-direct', m(ISR, "<init>", "V", IS), 1, 2), ('invoke-direct', m(BR, "<init>", "V", RDR), 0, 1),
        ('invoke-virtual', m(BR, "readLine", STR), 0), ('move-result-object', 1),
        ('if-eqz', 1, 'close'),
        ('label', 'hdr'),
        ('invoke-virtual', m(BR, "readLine", STR), 0), ('move-result-object', 2),
        ('if-eqz', 2, 'parsed'),
        ('invoke-virtual', m(STR, "length", "I"), 2), ('move-result', 2),
        ('if-nez', 2, 'hdr'),
        ('label', 'parsed'),
        ('const/16', 2, 32), ('invoke-virtual', m(STR, "indexOf", "I", "I"), 1, 2), ('move-result', 2),
        ('add-int/lit8', 2, 2, 1),
        ('const/16', 3, 32), ('invoke-virtual', m(STR, "indexOf", "I", "I", "I"), 1, 3, 2), ('move-result', 3),
        ('invoke-virtual', m(STR, "substring", STR, "I", "I"), 1, 2, 3), ('move-result-object', 1),
        ('const-string', 0, "ok"),
        ('const-string', 2, "/a?"), ('invoke-virtual', m(STR, "startsWith", "Z", STR), 1, 2), ('move-result', 2),
        ('if-eqz', 2, 'notA'),
        ('const/4', 2, 3), ('invoke-virtual', m(STR, "substring", STR, "I"), 1, 2), ('move-result-object', 2),
        ('invoke-static', m(NET, "add", "V", STR), 2),
        ('goto/16', 'send'),
        ('label', 'notA'),
        ('const-string', 2, "/s?"), ('invoke-virtual', m(STR, "startsWith", "Z", STR), 1, 2), ('move-result', 2),
        ('if-eqz', 2, 'ping'),
        ('const/4', 2, 3), ('invoke-virtual', m(STR, "substring", STR, "I"), 1, 2), ('move-result-object', 2),
        ('invoke-static', m(NET, "get", STR, STR), 2), ('move-result-object', 0),
        ('if-nez', 0, 'send'),
        ('const-string', 0, ""),
        ('goto/16', 'send'),
        ('label', 'ping'),
        ('const-string', 0, "mafia-dealer"),
        ('label', 'send'),
        ('new-instance', 1, SB), ('invoke-direct', m(SB, "<init>", "V"), 1),
        ('const-string', 2, HEADER), ('invoke-virtual', m(SB, "append", SB, STR), 1, 2),
        ('invoke-virtual', m(SB, "append", SB, STR), 1, 0),
        ('invoke-virtual', m(SB, "toString", STR), 1), ('move-result-object', 1),
        ('const-string', 2, "UTF-8"), ('invoke-virtual', m(STR, "getBytes", "[B", STR), 1, 2), ('move-result-object', 1),
        ('invoke-virtual', m(SOCK, "getOutputStream", OS), 6), ('move-result-object', 2),
        ('invoke-virtual', m(OS, "write", "V", "[B"), 2, 1),
        ('invoke-virtual', m(OS, "flush", "V"), 2),
        ('label', 'a1'),
        ('label', 'close'),
        ('invoke-virtual', m(SOCK, "close", "V"), 6),
        ('label', 'b1'),
        ('label', 'ret'), ('return-void',),
        ('label', 'fail'), ('goto/16', 'close'),
        ('try', 'a0', 'a1', 'fail'), ('try', 'close', 'b1', 'ret')]),
])

def build_dex():
    return build([main, voice, net, srv])
