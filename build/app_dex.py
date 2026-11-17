from dexasm import *

P = "Lcom/mafiadealer/app/"
MAIN, VOICE, NET, SRV, KEEP, APK, CHROME = P + "MainActivity;", P + "Voice;", P + "Net;", P + "Srv;", P + "Keep;", P + "Apk;", P + "Chrome;"
ACT = "Landroid/app/Activity;"; WV = "Landroid/webkit/WebView;"; WS = "Landroid/webkit/WebSettings;"
WIN = "Landroid/view/Window;"; CTX = "Landroid/content/Context;"; BUN = "Landroid/os/Bundle;"
VIEW = "Landroid/view/View;"; STR = "Ljava/lang/String;"; OBJ = "Ljava/lang/Object;"
TTS = "Landroid/speech/tts/TextToSpeech;"; OIL = "Landroid/speech/tts/TextToSpeech$OnInitListener;"
LOC = "Ljava/util/Locale;"; CS = "Ljava/lang/CharSequence;"
CHM = "Ljava/util/concurrent/ConcurrentHashMap;"; CLQ = "Ljava/util/concurrent/ConcurrentLinkedQueue;"
THR = "Ljava/lang/Thread;"; SS = "Ljava/net/ServerSocket;"; SOCK = "Ljava/net/Socket;"
BR = "Ljava/io/BufferedReader;"; ISR = "Ljava/io/InputStreamReader;"; RDR = "Ljava/io/Reader;"; IS = "Ljava/io/InputStream;"
OS = "Ljava/io/OutputStream;"; SB = "Ljava/lang/StringBuilder;"
INTENT = "Landroid/content/Intent;"; CN = "Landroid/content/ComponentName;"; SVC = "Landroid/app/Service;"
NOTIF = "Landroid/app/Notification;"; NB = "Landroid/app/Notification$Builder;"; NCH = "Landroid/app/NotificationChannel;"
NM = "Landroid/app/NotificationManager;"; PM = "Landroid/os/PowerManager;"; WL = "Landroid/os/PowerManager$WakeLock;"
FL = "Landroid/net/wifi/WifiManager$WifiLock;"; IB = "Landroid/os/IBinder;"; URI = "Landroid/net/Uri;"; CBM = "Landroid/content/ClipboardManager;"; CLIP = "Landroid/content/ClipData;"; FILE = "Ljava/io/File;"; FOS = "Ljava/io/FileOutputStream;"; B64 = "Landroid/util/Base64;"
CP = "Landroid/content/ContentProvider;"; PFD = "Landroid/os/ParcelFileDescriptor;"; CUR = "Landroid/database/Cursor;"; CV = "Landroid/content/ContentValues;"; SA = "[Ljava/lang/String;"
WCC = "Landroid/webkit/WebChromeClient;"; FCP = "Landroid/webkit/WebChromeClient$FileChooserParams;"; VCB = "Landroid/webkit/ValueCallback;"; URIA = "[Landroid/net/Uri;"
F_CB = (CHROME, "cb", VCB); F_A = (CHROME, "a", ACT)
APK_URI = "content://com.mafiadealer.app.apk/update.apk"; APK_MIME = "application/vnd.android.package-archive"
WM = "Landroid/net/wifi/WifiManager;"; WI = "Landroid/net/wifi/WifiInfo;"; DHCP = "Landroid/net/DhcpInfo;"

m = lambda c, n, r, *ps: (c, n, r, tuple(ps))
COLOR = 0xff0b0a0f
HEADER = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nCache-Control: no-store\r\nContent-Type: text/plain; charset=utf-8\r\nConnection: close\r\n\r\n"
F_W = (MAIN, "w", WV); F_T = (VOICE, "t", TTS); F_US = (LOC, "US", LOC)
F_L = (NET, "L", STR); F_S = (NET, "S", CHM); F_Q = (NET, "Q", CLQ); F_TH = (NET, "T", SRV); F_C = (NET, "c", CTX); F_P = (SRV, "p", "I")
F_SDK = ("Landroid/os/Build$VERSION;", "SDK_INT", "I"); F_WL = (KEEP, "w", WL); F_FL = (KEEP, "f", FL)

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
        ('invoke-virtual', m(ACT, "getIntent", INTENT), 3), ('move-result-object', 1),  # opened from an invite link? the page asks Net.link()
        ('invoke-virtual', m(INTENT, "getDataString", STR), 1), ('move-result-object', 1), ('sput-object', 1, F_L),
        ('new-instance', 1, CHROME), ('invoke-direct', m(CHROME, "<init>", "V", ACT), 1, 3),
        ('invoke-virtual', m(WV, "setWebChromeClient", "V", WCC), 0, 1),  # <input type=file> opens the phone's picker
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
    Method(MAIN, "onActivityResult", "V", ["I", "I", INTENT], ACC_PUBLIC, 6, [  # p0=v2 req=v3 res=v4 data=v5: picked photo back to the page
        ('invoke-super', m(ACT, "onActivityResult", "V", "I", "I", INTENT), 2, 3, 4, 5),
        ('label', 't0'),
        ('sget-object', 0, F_CB), ('if-eqz', 0, 't1'),
        ('invoke-static', m(FCP, "parseResult", URIA, "I", INTENT), 4, 5), ('move-result-object', 1),
        ('invoke-interface', m(VCB, "onReceiveValue", "V", OBJ), 0, 1),
        ('const/4', 0, 0), ('sput-object', 0, F_CB),
        ('label', 't1'),
        ('label', 'ret'), ('return-void',),
        ('label', 'fail'), ('const/4', 0, 0), ('sput-object', 0, F_CB), ('goto/16', 'ret'),
        ('try', 't0', 't1', 'fail')]),
    Method(MAIN, "onNewIntent", "V", [INTENT], ACC_PUBLIC, 5, [  # p0=v3 intent=v4: an invite link while the app is open
        ('invoke-super', m(ACT, "onNewIntent", "V", INTENT), 3, 4),
        ('invoke-virtual', m(ACT, "setIntent", "V", INTENT), 3, 4),
        ('invoke-virtual', m(INTENT, "getDataString", STR), 4), ('move-result-object', 0),
        ('if-eqz', 0, 'done'), ('sput-object', 0, F_L),
        ('iget-object', 0, 3, F_W), ('const-string', 1, "window.deepLink&&deepLink()"), ('const/4', 2, 0),
        ('invoke-virtual', m(WV, "evaluateJavascript", "V", STR, VCB), 0, 1, 2),
        ('label', 'done'), ('return-void',)]),
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
net = Class(NET, OBJ, [("L", STR, ACC_PUBLIC | ACC_STATIC), ("S", CHM, ACC_PUBLIC | ACC_STATIC), ("Q", CLQ, ACC_PUBLIC | ACC_STATIC),
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
    Method(NET, "link", STR, [], ACC_PUBLIC, 3, [  # p0=v2: the invite link the app was opened with, once
        ('sget-object', 0, F_L), ('const/4', 1, 0), ('sput-object', 1, F_L), ('return-object', 0)], js=True),
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
    Method(NET, "keep", "V", ["Z"], ACC_PUBLIC, 6, [  # p0=v4 on=v5
        # ponytail: Android 7 hosts get no service (Notification channels need 8+); add a pre-26 path if a friend runs 7
        ('label', 't0'),
        ('sget', 0, F_SDK), ('const/16', 1, 26), ('if-lt', 0, 1, 'ret'),
        ('iget-object', 0, 4, F_C), ('invoke-virtual', m(CTX, "getApplicationContext", CTX), 0), ('move-result-object', 0),
        ('new-instance', 1, INTENT), ('invoke-direct', m(INTENT, "<init>", "V"), 1),
        ('const-string', 2, "com.mafiadealer.app.Keep"), ('invoke-virtual', m(INTENT, "setClassName", INTENT, CTX, STR), 1, 0, 2),
        ('if-eqz', 5, 'stop'),
        ('invoke-virtual', m(CTX, "startForegroundService", CN, INTENT), 0, 1),
        ('goto/16', 'ret'),
        ('label', 'stop'), ('invoke-virtual', m(CTX, "stopService", "Z", INTENT), 0, 1),
        ('label', 't1'),
        ('label', 'ret'), ('return-void',),
        ('label', 'fail'), ('goto/16', 'ret'),
        ('try', 't0', 't1', 'fail')], js=True),
    Method(NET, "open", "V", [STR], ACC_PUBLIC, 5, [  # p0=v3 url=v4: hand a link (the update APK) to the browser
        ('label', 't0'),
        ('new-instance', 0, INTENT), ('const-string', 1, "android.intent.action.VIEW"),
        ('invoke-static', m(URI, "parse", URI, STR), 4), ('move-result-object', 2),
        ('invoke-direct', m(INTENT, "<init>", "V", STR, URI), 0, 1, 2),
        ('const', 1, 0x10000000), ('invoke-virtual', m(INTENT, "addFlags", INTENT, "I"), 0, 1),  # FLAG_ACTIVITY_NEW_TASK
        ('iget-object', 1, 3, F_C), ('invoke-virtual', m(CTX, "startActivity", "V", INTENT), 1, 0),
        ('label', 't1'),
        ('label', 'ret'), ('return-void',),
        ('label', 'fail'), ('goto/16', 'ret'),
        ('try', 't0', 't1', 'fail')], js=True),
    Method(NET, "share", "V", [STR], ACC_PUBLIC, 6, [  # p0=v4 text=v5: Android share sheet (WhatsApp, Telegram...)
        ('label', 't0'),
        ('new-instance', 0, INTENT), ('const-string', 1, "android.intent.action.SEND"),
        ('invoke-direct', m(INTENT, "<init>", "V", STR), 0, 1),
        ('const-string', 1, "text/plain"), ('invoke-virtual', m(INTENT, "setType", INTENT, STR), 0, 1),
        ('const-string', 1, "android.intent.extra.TEXT"), ('invoke-virtual', m(INTENT, "putExtra", INTENT, STR, STR), 0, 1, 5),
        ('const/4', 1, 0), ('invoke-static', m(INTENT, "createChooser", INTENT, INTENT, CS), 0, 1), ('move-result-object', 0),
        ('const', 1, 0x10000000), ('invoke-virtual', m(INTENT, "addFlags", INTENT, "I"), 0, 1),
        ('iget-object', 1, 4, F_C), ('invoke-virtual', m(CTX, "startActivity", "V", INTENT), 1, 0),
        ('label', 't1'),
        ('label', 'ret'), ('return-void',),
        ('label', 'fail'), ('goto/16', 'ret'),
        ('try', 't0', 't1', 'fail')], js=True),
    Method(NET, "saveApk", "Z", [STR], ACC_PUBLIC, 6, [  # p0=v4 b64=v5: write the downloaded update to cache/update.apk
        ('label', 't0'),
        ('const/4', 0, 0), ('invoke-static', m(B64, "decode", "[B", STR, "I"), 5, 0), ('move-result-object', 0),
        ('iget-object', 1, 4, F_C), ('invoke-virtual', m(CTX, "getCacheDir", FILE), 1), ('move-result-object', 1),
        ('new-instance', 2, FILE), ('const-string', 3, "update.apk"), ('invoke-direct', m(FILE, "<init>", "V", FILE, STR), 2, 1, 3),
        ('new-instance', 1, FOS), ('invoke-direct', m(FOS, "<init>", "V", FILE), 1, 2),
        ('invoke-virtual', m(FOS, "write", "V", "[B"), 1, 0), ('invoke-virtual', m(FOS, "close", "V"), 1),
        ('const/4', 0, 1), ('return', 0),
        ('label', 't1'),
        ('label', 'fail'), ('const/4', 0, 0), ('return', 0),
        ('try', 't0', 't1', 'fail')], js=True),
    Method(NET, "install", "V", [], ACC_PUBLIC, 5, [  # p0=v4: open Android's "Update this app?" screen for cache/update.apk
        ('label', 't0'),
        ('new-instance', 0, INTENT), ('const-string', 1, "android.intent.action.VIEW"), ('invoke-direct', m(INTENT, "<init>", "V", STR), 0, 1),
        ('const-string', 1, APK_URI), ('invoke-static', m(URI, "parse", URI, STR), 1), ('move-result-object', 1),
        ('const-string', 2, APK_MIME), ('invoke-virtual', m(INTENT, "setDataAndType", INTENT, URI, STR), 0, 1, 2),
        ('const', 1, 0x10000001), ('invoke-virtual', m(INTENT, "addFlags", INTENT, "I"), 0, 1),  # NEW_TASK | GRANT_READ_URI_PERMISSION
        ('iget-object', 1, 4, F_C), ('invoke-virtual', m(CTX, "startActivity", "V", INTENT), 1, 0),
        ('label', 't1'),
        ('label', 'ret'), ('return-void',),
        ('label', 'fail'), ('goto/16', 'ret'),
        ('try', 't0', 't1', 'fail')], js=True),
    Method(NET, "copy", "V", [STR], ACC_PUBLIC, 5, [  # p0=v3 text=v4: put the room code / address on the clipboard
        ('label', 't0'),
        ('iget-object', 0, 3, F_C), ('const-string', 1, "clipboard"), ('invoke-virtual', m(CTX, "getSystemService", OBJ, STR), 0, 1),
        ('move-result-object', 0), ('check-cast', 0, CBM),
        ('const-string', 1, "Mafia Dealer"), ('invoke-static', m(CLIP, "newPlainText", CLIP, CS, CS), 1, 4), ('move-result-object', 1),
        ('invoke-virtual', m(CBM, "setPrimaryClip", "V", CLIP), 0, 1),
        ('label', 't1'),
        ('label', 'ret'), ('return-void',),
        ('label', 'fail'), ('goto/16', 'ret'),
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

# ---- Keep: foreground service so Android doesn't kill the host's server; holds CPU + Wi-Fi locks while hosting
keep = Class(KEEP, SVC, [("w", WL, ACC_PUBLIC | ACC_STATIC), ("f", FL, ACC_PUBLIC | ACC_STATIC)], [
    Method(KEEP, "<init>", "V", [], ACC_PUBLIC | ACC_CONSTRUCTOR, 1, [
        ('invoke-direct', m(SVC, "<init>", "V"), 0), ('return-void',)]),
    Method(KEEP, "onBind", IB, [INTENT], ACC_PUBLIC, 3, [('const/4', 0, 0), ('return-object', 0)]),
    Method(KEEP, "onTaskRemoved", "V", [INTENT], ACC_PUBLIC, 2, [  # app swiped away -> stop hosting
        ('invoke-virtual', m(SVC, "stopSelf", "V"), 0), ('return-void',)]),
    Method(KEEP, "onStartCommand", "I", [INTENT, "I", "I"], ACC_PUBLIC, 9, [  # p0=v5
        ('label', 't0'),
        ('const-string', 2, "notification"), ('invoke-virtual', m(CTX, "getSystemService", OBJ, STR), 5, 2),
        ('move-result-object', 0), ('check-cast', 0, NM),
        ('const-string', 2, "game"), ('const-string', 3, "Game in progress"), ('const/4', 4, 2),  # IMPORTANCE_LOW
        ('new-instance', 1, NCH), ('invoke-direct', m(NCH, "<init>", "V", STR, CS, "I"), 1, 2, 3, 4),
        ('invoke-virtual', m(NM, "createNotificationChannel", "V", NCH), 0, 1),
        ('new-instance', 1, NB), ('invoke-direct', m(NB, "<init>", "V", CTX, STR), 1, 5, 2),
        ('const', 3, 0x7f010000), ('invoke-virtual', m(NB, "setSmallIcon", NB, "I"), 1, 3),
        ('const-string', 3, "Mafia Dealer"), ('invoke-virtual', m(NB, "setContentTitle", NB, CS), 1, 3),
        ('const-string', 3, "Hosting a game. The room stays open."), ('invoke-virtual', m(NB, "setContentText", NB, CS), 1, 3),
        ('const/4', 3, 1), ('invoke-virtual', m(NB, "setOngoing", NB, "Z"), 1, 3),
        ('invoke-virtual', m(NB, "build", NOTIF), 1), ('move-result-object', 1),
        ('const/4', 3, 1), ('invoke-virtual', m(SVC, "startForeground", "V", "I", NOTIF), 5, 3, 1),
        ('sget-object', 0, F_WL), ('if-nez', 0, 't1'),  # locks already held
        ('const-string', 2, "power"), ('invoke-virtual', m(CTX, "getSystemService", OBJ, STR), 5, 2),
        ('move-result-object', 0), ('check-cast', 0, PM),
        ('const/4', 3, 1), ('const-string', 4, "mafiadealer:host"),  # PARTIAL_WAKE_LOCK
        ('invoke-virtual', m(PM, "newWakeLock", WL, "I", STR), 0, 3, 4), ('move-result-object', 0),
        ('invoke-virtual', m(WL, "acquire", "V"), 0), ('sput-object', 0, F_WL),
        ('invoke-virtual', m(CTX, "getApplicationContext", CTX), 5), ('move-result-object', 0),
        ('const-string', 2, "wifi"), ('invoke-virtual', m(CTX, "getSystemService", OBJ, STR), 0, 2),
        ('move-result-object', 0), ('check-cast', 0, WM),
        # ponytail: FULL_HIGH_PERF is a no-op on Android 14+; the wake lock + foreground service carry it there
        ('const/4', 3, 3), ('invoke-virtual', m(WM, "createWifiLock", FL, "I", STR), 0, 3, 4), ('move-result-object', 0),
        ('invoke-virtual', m(FL, "acquire", "V"), 0), ('sput-object', 0, F_FL),
        ('label', 't1'),
        ('label', 'ret'), ('const/4', 0, 2), ('return', 0),  # START_NOT_STICKY
        ('label', 'fail'), ('goto/16', 'ret'),
        ('try', 't0', 't1', 'fail')]),
    Method(KEEP, "onDestroy", "V", [], ACC_PUBLIC, 2, [  # p0=v1
        ('label', 't0'),
        ('sget-object', 0, F_WL), ('if-eqz', 0, 'nf'), ('invoke-virtual', m(WL, "release", "V"), 0),
        ('label', 'nf'),
        ('sget-object', 0, F_FL), ('if-eqz', 0, 't1'), ('invoke-virtual', m(FL, "release", "V"), 0),
        ('label', 't1'),
        ('label', 'end'), ('const/4', 0, 0), ('sput-object', 0, F_WL), ('sput-object', 0, F_FL),
        ('invoke-super', m(SVC, "onDestroy", "V"), 1), ('return-void',),
        ('label', 'fail'), ('goto/16', 'end'),
        ('try', 't0', 't1', 'fail')]),
])

# ---- Apk: minimal read-only file provider so the system installer can read cache/update.apk
apk = Class(APK, CP, [], [
    Method(APK, "<init>", "V", [], ACC_PUBLIC | ACC_CONSTRUCTOR, 1, [('invoke-direct', m(CP, "<init>", "V"), 0), ('return-void',)]),
    Method(APK, "onCreate", "Z", [], ACC_PUBLIC, 2, [('const/4', 0, 1), ('return', 0)]),
    Method(APK, "getType", STR, [URI], ACC_PUBLIC, 3, [('const-string', 0, APK_MIME), ('return-object', 0)]),
    Method(APK, "query", CUR, [URI, SA, STR, SA, STR], ACC_PUBLIC, 7, [('const/4', 0, 0), ('return-object', 0)]),
    Method(APK, "insert", URI, [URI, CV], ACC_PUBLIC, 4, [('const/4', 0, 0), ('return-object', 0)]),
    Method(APK, "delete", "I", [URI, STR, SA], ACC_PUBLIC, 5, [('const/4', 0, 0), ('return', 0)]),
    Method(APK, "update", "I", [URI, CV, STR, SA], ACC_PUBLIC, 6, [('const/4', 0, 0), ('return', 0)]),
    Method(APK, "openFile", PFD, [URI, STR], ACC_PUBLIC, 6, [  # p0=v3 uri=v4 mode=v5 (always the one file, read-only)
        ('invoke-virtual', m(CP, "getContext", CTX), 3), ('move-result-object', 0),
        ('invoke-virtual', m(CTX, "getCacheDir", FILE), 0), ('move-result-object', 0),
        ('new-instance', 1, FILE), ('const-string', 2, "update.apk"), ('invoke-direct', m(FILE, "<init>", "V", FILE, STR), 1, 0, 2),
        ('const', 2, 0x10000000), ('invoke-static', m(PFD, "open", PFD, FILE, "I"), 1, 2), ('move-result-object', 0),  # MODE_READ_ONLY
        ('return-object', 0)]),
])

# ---- Chrome: lets <input type=file> open the system picker (profile photo)
chrome = Class(CHROME, WCC, [("cb", VCB, ACC_PUBLIC | ACC_STATIC), ("a", ACT, ACC_PRIVATE)], [
    Method(CHROME, "<init>", "V", [ACT], ACC_PUBLIC | ACC_CONSTRUCTOR, 2, [
        ('invoke-direct', m(WCC, "<init>", "V"), 0), ('iput-object', 1, 0, F_A), ('return-void',)]),
    Method(CHROME, "onShowFileChooser", "Z", [WV, VCB, FCP], ACC_PUBLIC, 7, [  # p0=v3 cb=v5 params=v6
        ('label', 't0'),
        ('sget-object', 0, F_CB), ('if-eqz', 0, 'fresh'),
        ('const/4', 1, 0), ('invoke-interface', m(VCB, "onReceiveValue", "V", OBJ), 0, 1),  # an older request is cancelled
        ('label', 'fresh'),
        ('sput-object', 5, F_CB),
        ('invoke-virtual', m(FCP, "createIntent", INTENT), 6), ('move-result-object', 0),
        ('iget-object', 1, 3, F_A), ('const/16', 2, 7), ('invoke-virtual', m(ACT, "startActivityForResult", "V", INTENT, "I"), 1, 0, 2),
        ('const/4', 0, 1), ('return', 0),
        ('label', 't1'),
        ('label', 'fail'),
        ('sget-object', 0, F_CB), ('if-eqz', 0, 'no'), ('const/4', 1, 0), ('invoke-interface', m(VCB, "onReceiveValue", "V", OBJ), 0, 1), ('sput-object', 1, F_CB),
        ('label', 'no'), ('const/4', 0, 1), ('return', 0),  # we answered the page (nothing chosen): report handled
        ('try', 't0', 't1', 'fail')]),
])

def build_dex():
    return build([main, voice, net, srv, keep, apk, chrome])
