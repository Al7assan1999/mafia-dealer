from dexasm import *

P = "Lcom/mafiadealer/app/"
MAIN, VOICE, NET, SRV, KEEP, APK, CHROME = P + "MainActivity;", P + "Voice;", P + "Net;", P + "Srv;", P + "Keep;", P + "Apk;", P + "Chrome;"
UPDRX, UPD = P + "UpdRx;", P + "Upd;"
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
BRX = "Landroid/content/BroadcastReceiver;"; PR = "Landroid/content/BroadcastReceiver$PendingResult;"; AM = "Landroid/app/AlarmManager;"; PI = "Landroid/app/PendingIntent;"
CAL = "Ljava/util/Calendar;"; SP = "Landroid/content/SharedPreferences;"; SPE = "Landroid/content/SharedPreferences$Editor;"
JURL = "Ljava/net/URL;"; UCON = "Ljava/net/URLConnection;"; SCAN = "Ljava/util/Scanner;"; JO = "Lorg/json/JSONObject;"
RELAY_BASE = "https://mafia-relay.mafiadealer.workers.dev"; F_UC = (UPD, "c", CTX); F_UR = (UPD, "r", PR)

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
    Method(NET, "quit", "V", [], ACC_PUBLIC, 2, [  # p0=v1: close the app (the page asked first); c is the MainActivity
        ('label', 't0'), ('iget-object', 0, 1, F_C), ('check-cast', 0, ACT), ('invoke-virtual', m(ACT, "finish", "V"), 0),
        ('label', 't1'), ('label', 'ret'), ('return-void',), ('label', 'fail'), ('goto/16', 'ret'), ('try', 't0', 't1', 'fail')], js=True),
    Method(NET, "updAlarm", "V", ["Z"], ACC_PUBLIC, 6, [  # p0=v4 on=v5 (v2.18): the update checks at 11:00-17:00 on or off; plan() sets or cancels the alarm
        ('label', 't0'),
        ('iget-object', 0, 4, F_C), ('invoke-virtual', m(CTX, "getApplicationContext", CTX), 0), ('move-result-object', 0),
        ('const-string', 1, "upd"), ('const/4', 2, 0), ('invoke-virtual', m(CTX, "getSharedPreferences", SP, STR, "I"), 0, 1, 2), ('move-result-object', 1),
        ('invoke-interface', m(SP, "edit", SPE), 1), ('move-result-object', 1),
        ('const/4', 3, 1), ('if-eqz', 5, 'put'), ('const/4', 3, 0), ('label', 'put'),  # off = !on
        ('const-string', 2, "off"), ('invoke-interface', m(SPE, "putBoolean", SPE, STR, "Z"), 1, 2, 3), ('move-result-object', 1),
        ('invoke-interface', m(SPE, "commit", "Z"), 1),
        ('invoke-static', m(UPDRX, "plan", "Z", CTX), 0),
        ('label', 't1'), ('label', 'ret'), ('return-void',), ('label', 'fail'), ('goto/16', 'ret'), ('try', 't0', 't1', 'fail')], js=True),
    Method(NET, "updClear", "V", [], ACC_PUBLIC, 3, [  # p0=v2: the app is open, so the update notification (and the icon badge) goes
        ('label', 't0'),
        ('iget-object', 0, 2, F_C), ('const-string', 1, "notification"), ('invoke-virtual', m(CTX, "getSystemService", OBJ, STR), 0, 1),
        ('move-result-object', 0), ('check-cast', 0, NM), ('const/4', 1, 2), ('invoke-virtual', m(NM, "cancel", "V", "I"), 0, 1),
        ('label', 't1'), ('label', 'ret'), ('return-void',), ('label', 'fail'), ('goto/16', 'ret'), ('try', 't0', 't1', 'fail')], js=True),
    Method(NET, "askNotif", "V", [], ACC_PUBLIC, 4, [  # p0=v3: Android 13+ asks "Allow notifications?" (String[] made with split: no array opcodes)
        ('label', 't0'),
        ('sget', 0, F_SDK), ('const/16', 1, 33), ('if-lt', 0, 1, 'ret'),
        ('iget-object', 0, 3, F_C), ('check-cast', 0, ACT),
        ('const-string', 1, "android.permission.POST_NOTIFICATIONS"), ('const-string', 2, ","),
        ('invoke-virtual', m(STR, "split", SA, STR), 1, 2), ('move-result-object', 1),
        ('const/16', 2, 9), ('invoke-virtual', m(ACT, "requestPermissions", "V", SA, "I"), 0, 1, 2),
        ('label', 't1'), ('label', 'ret'), ('return-void',), ('label', 'fail'), ('goto/16', 'ret'), ('try', 't0', 't1', 'fail')], js=True),
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
        ('new-instance', 0, INTENT), ('const-string', 1, "android.intent.action.INSTALL_PACKAGE"), ('invoke-direct', m(INTENT, "<init>", "V", STR), 0, 1),
        ('const-string', 1, APK_URI), ('invoke-static', m(URI, "parse", URI, STR), 1), ('move-result-object', 1),
        ('const-string', 2, APK_MIME), ('invoke-virtual', m(INTENT, "setDataAndType", INTENT, URI, STR), 0, 1, 2),
        # v2.13: RETURN_RESULT = the installer reports back instead of showing its last "Done / Open" page (the app restarts by itself)
        ('const-string', 2, "android.intent.extra.RETURN_RESULT"), ('const/4', 3, 1), ('invoke-virtual', m(INTENT, "putExtra", INTENT, STR, "Z"), 0, 2, 3),
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
        # v2.18.1: tapping it opens the app on the room (MainActivity is singleTask: onNewIntent -> deepLink('md:room'))
        ('new-instance', 3, INTENT), ('invoke-direct', m(INTENT, "<init>", "V"), 3),
        ('const-string', 4, "com.mafiadealer.app.MainActivity"), ('invoke-virtual', m(INTENT, "setClassName", INTENT, CTX, STR), 3, 5, 4),
        ('const-string', 4, "md:room"), ('invoke-static', m(URI, "parse", URI, STR), 4), ('move-result-object', 4),
        ('invoke-virtual', m(INTENT, "setData", INTENT, URI), 3, 4),
        ('const/4', 4, 1), ('const', 2, 0x0C000000), ('invoke-static', m(PI, "getActivity", PI, CTX, "I", INTENT, "I"), 5, 4, 3, 2), ('move-result-object', 3),
        ('invoke-virtual', m(NB, "setContentIntent", NB, PI), 1, 3),
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

# ---- v2.18 update alerts. UpdRx: an inexact alarm at the next full hour from 11:00 to 17:00 (phone clock; setAndAllowWhileIdle also
# fires in Doze, no exact-alarm permission needed); boot and app updates set it again. Each firing in that window starts Upd, which
# reads version.json and, when there is a newer version not announced yet, posts a notification (the launcher shows its badge).
updrx = Class(UPDRX, BRX, [], [
    Method(UPDRX, "<init>", "V", [], ACC_PUBLIC | ACC_CONSTRUCTOR, 1, [('invoke-direct', m(BRX, "<init>", "V"), 0), ('return-void',)]),
    Method(UPDRX, "onReceive", "V", [CTX, INTENT], ACC_PUBLIC, 6, [  # p0=v3 ctx=v4 intent=v5
        ('label', 't0'),
        ('invoke-virtual', m(CTX, "getApplicationContext", CTX), 4), ('move-result-object', 0),
        ('invoke-static', m(UPDRX, "plan", "Z", CTX), 0), ('move-result', 1), ('if-eqz', 1, 'ret'),  # switched off
        ('invoke-static', m(CAL, "getInstance", CAL)), ('move-result-object', 1),
        ('const/16', 2, 11), ('invoke-virtual', m(CAL, "get", "I", "I"), 1, 2), ('move-result', 2),  # HOUR_OF_DAY
        ('const/16', 1, 11), ('if-lt', 2, 1, 'ret'),
        ('const/16', 1, 18), ('if-lt', 2, 1, 'go'), ('goto/16', 'ret'),
        ('label', 'go'),
        ('invoke-virtual', m(BRX, "goAsync", PR), 3), ('move-result-object', 1),
        ('new-instance', 2, UPD), ('invoke-direct', m(UPD, "<init>", "V", CTX, PR), 2, 0, 1),
        ('invoke-virtual', m(THR, "start", "V"), 2),
        ('label', 't1'),
        ('label', 'ret'), ('return-void',),
        ('label', 'fail'), ('goto/16', 'ret'),
        ('try', 't0', 't1', 'fail')]),
    Method(UPDRX, "plan", "Z", [CTX], ACC_PUBLIC | ACC_STATIC, 10, [  # ctx=v9 -> false when switched off (alarm cancelled)
        ('label', 't0'),
        ('const-string', 0, "upd"), ('const/4', 1, 0),
        ('invoke-virtual', m(CTX, "getSharedPreferences", SP, STR, "I"), 9, 0, 1), ('move-result-object', 0),
        ('const-string', 1, "off"), ('const/4', 2, 0),
        ('invoke-interface', m(SP, "getBoolean", "Z", STR, "Z"), 0, 1, 2), ('move-result', 8),
        ('const-string', 0, "alarm"), ('invoke-virtual', m(CTX, "getSystemService", OBJ, STR), 9, 0), ('move-result-object', 0), ('check-cast', 0, AM),
        ('new-instance', 1, INTENT), ('invoke-direct', m(INTENT, "<init>", "V"), 1),
        ('const-string', 2, "com.mafiadealer.app.UpdRx"), ('invoke-virtual', m(INTENT, "setClassName", INTENT, CTX, STR), 1, 9, 2),
        ('const/4', 2, 0), ('const', 3, 0x0C000000),  # FLAG_IMMUTABLE | FLAG_UPDATE_CURRENT
        ('invoke-static', m(PI, "getBroadcast", PI, CTX, "I", INTENT, "I"), 9, 2, 1, 3), ('move-result-object', 1),
        ('if-eqz', 8, 'on'),
        ('invoke-virtual', m(AM, "cancel", "V", PI), 0, 1), ('const/4', 0, 0), ('return', 0),
        ('label', 'on'),
        ('invoke-static', m(CAL, "getInstance", CAL)), ('move-result-object', 2),
        ('const/16', 3, 11), ('invoke-virtual', m(CAL, "get", "I", "I"), 2, 3), ('move-result', 4),  # v4 = hour now
        ('const/4', 5, 0),
        ('const/16', 3, 12), ('invoke-virtual', m(CAL, "set", "V", "I", "I"), 2, 3, 5),  # :00.000
        ('const/16', 3, 13), ('invoke-virtual', m(CAL, "set", "V", "I", "I"), 2, 3, 5),
        ('const/16', 3, 14), ('invoke-virtual', m(CAL, "set", "V", "I", "I"), 2, 3, 5),
        ('const/16', 3, 11),
        ('const/16', 5, 11), ('if-lt', 4, 5, 'at'),  # before 11: 11:00 today
        ('const/16', 5, 17), ('if-lt', 4, 5, 'next'),  # 11..16: the next hour
        ('const/4', 6, 5), ('const/4', 7, 1), ('invoke-virtual', m(CAL, "add", "V", "I", "I"), 2, 6, 7),  # 17 or later: 11:00 tomorrow
        ('const/16', 5, 11), ('goto/16', 'at'),
        ('label', 'next'), ('add-int/lit8', 5, 4, 1),
        ('label', 'at'), ('invoke-virtual', m(CAL, "set", "V", "I", "I"), 2, 3, 5),
        ('invoke-virtual', m(CAL, "getTimeInMillis", "J"), 2), ('move-result-wide', 4),
        ('const/4', 6, 0),  # RTC_WAKEUP
        ('invoke-virtual', m(AM, "setAndAllowWhileIdle", "V", "I", "J", PI), 0, 6, 4, 5, 1),
        ('const/4', 0, 1), ('return', 0),
        ('label', 't1'),
        ('label', 'fail'), ('const/4', 0, 0), ('return', 0),
        ('try', 't0', 't1', 'fail')]),
])

def make_upd(ver):
    return Class(UPD, THR, [("c", CTX, ACC_PRIVATE), ("r", PR, ACC_PRIVATE)], [
    Method(UPD, "<init>", "V", [CTX, PR], ACC_PUBLIC | ACC_CONSTRUCTOR, 3, [
        ('invoke-direct', m(THR, "<init>", "V"), 0), ('iput-object', 1, 0, F_UC), ('iput-object', 2, 0, F_UR), ('return-void',)]),
    Method(UPD, "run", "V", [], ACC_PUBLIC, 12, [  # p0=v11
        ('label', 't0'),
        ('new-instance', 0, JURL), ('const-string', 1, RELAY_BASE + "/version.json"), ('invoke-direct', m(JURL, "<init>", "V", STR), 0, 1),
        ('invoke-virtual', m(JURL, "openConnection", UCON), 0), ('move-result-object', 0),
        ('const/16', 1, 15000), ('invoke-virtual', m(UCON, "setConnectTimeout", "V", "I"), 0, 1), ('invoke-virtual', m(UCON, "setReadTimeout", "V", "I"), 0, 1),
        ('const/4', 1, 0), ('invoke-virtual', m(UCON, "setUseCaches", "V", "Z"), 0, 1),
        ('invoke-virtual', m(UCON, "getInputStream", IS), 0), ('move-result-object', 0),
        ('new-instance', 1, SCAN), ('const-string', 2, "UTF-8"), ('invoke-direct', m(SCAN, "<init>", "V", IS, STR), 1, 0, 2),
        ('const-string', 2, "\\A"), ('invoke-virtual', m(SCAN, "useDelimiter", SCAN, STR), 1, 2),
        ('invoke-virtual', m(SCAN, "next", STR), 1), ('move-result-object', 1),
        ('new-instance', 0, JO), ('invoke-direct', m(JO, "<init>", "V", STR), 0, 1),
        ('const-string', 1, "code"), ('invoke-virtual', m(JO, "optInt", "I", STR), 0, 1), ('move-result', 2),  # v2 = newest code
        ('const-string', 1, "name"), ('invoke-virtual', m(JO, "optString", STR, STR), 0, 1), ('move-result-object', 3),  # v3 = its name
        ('const/16', 1, ver), ('if-lt', 1, 2, 'newer'), ('goto/16', 'done'),  # this app is up to date
        ('label', 'newer'),
        ('iget-object', 4, 11, F_UC),
        ('const-string', 0, "upd"), ('const/4', 1, 0),
        ('invoke-virtual', m(CTX, "getSharedPreferences", SP, STR, "I"), 4, 0, 1), ('move-result-object', 5),
        ('const-string', 0, "n"), ('invoke-interface', m(SP, "getInt", "I", STR, "I"), 5, 0, 1), ('move-result', 0),
        ('if-lt', 0, 2, 'tell'), ('goto/16', 'done'),  # this version was announced already
        ('label', 'tell'),
        ('sget', 0, F_SDK), ('const/16', 1, 26), ('if-lt', 0, 1, 'done'),  # ponytail: no channel API on Android 7, no notification there
        ('const-string', 0, "notification"), ('invoke-virtual', m(CTX, "getSystemService", OBJ, STR), 4, 0), ('move-result-object', 6), ('check-cast', 6, NM),
        ('new-instance', 7, NCH), ('const-string', 0, "upd"), ('const-string', 1, "New versions"), ('const/4', 9, 3),  # IMPORTANCE_DEFAULT
        ('invoke-direct', m(NCH, "<init>", "V", STR, CS, "I"), 7, 0, 1, 9),
        ('invoke-virtual', m(NM, "createNotificationChannel", "V", NCH), 6, 7),
        ('new-instance', 7, NB), ('invoke-direct', m(NB, "<init>", "V", CTX, STR), 7, 4, 0),
        ('const', 1, 0x7f010000), ('invoke-virtual', m(NB, "setSmallIcon", NB, "I"), 7, 1),
        ('new-instance', 1, SB), ('const-string', 9, "Mafia Dealer "), ('invoke-direct', m(SB, "<init>", "V", STR), 1, 9),
        ('invoke-virtual', m(SB, "append", SB, STR), 1, 3), ('const-string', 9, " is available"), ('invoke-virtual', m(SB, "append", SB, STR), 1, 9),
        ('invoke-virtual', m(SB, "toString", STR), 1), ('move-result-object', 1),
        ('invoke-virtual', m(NB, "setContentTitle", NB, CS), 7, 1),
        ('const-string', 1, "Tap to see what's new and update."), ('invoke-virtual', m(NB, "setContentText", NB, CS), 7, 1),
        ('const/4', 1, 1), ('invoke-virtual', m(NB, "setNumber", NB, "I"), 7, 1), ('invoke-virtual', m(NB, "setAutoCancel", NB, "Z"), 7, 1),
        ('const-string', 1, RELAY_BASE + "/u"), ('invoke-static', m(URI, "parse", URI, STR), 1), ('move-result-object', 1),
        ('new-instance', 9, INTENT), ('const-string', 10, "android.intent.action.VIEW"), ('invoke-direct', m(INTENT, "<init>", "V", STR, URI), 9, 10, 1),
        ('const-string', 10, "com.mafiadealer.app.MainActivity"), ('invoke-virtual', m(INTENT, "setClassName", INTENT, CTX, STR), 9, 4, 10),
        ('const/4', 1, 0), ('const', 10, 0x0C000000), ('invoke-static', m(PI, "getActivity", PI, CTX, "I", INTENT, "I"), 4, 1, 9, 10), ('move-result-object', 1),
        ('invoke-virtual', m(NB, "setContentIntent", NB, PI), 7, 1),
        ('invoke-virtual', m(NB, "build", NOTIF), 7), ('move-result-object', 1),
        ('const/4', 9, 2), ('invoke-virtual', m(NM, "notify", "V", "I", NOTIF), 6, 9, 1),  # id 2 (1 is the host's "game in progress")
        ('invoke-interface', m(SP, "edit", SPE), 5), ('move-result-object', 0),
        ('const-string', 1, "n"), ('invoke-interface', m(SPE, "putInt", SPE, STR, "I"), 0, 1, 2), ('move-result-object', 0),
        ('invoke-interface', m(SPE, "apply", "V"), 0),
        ('label', 't1'),
        ('label', 'done'),
        ('iget-object', 0, 11, F_UR), ('if-eqz', 0, 'end'), ('invoke-virtual', m(PR, "finish", "V"), 0),
        ('label', 'end'), ('return-void',),
        ('label', 'fail'), ('goto/16', 'done'),
        ('try', 't0', 't1', 'fail')]),
    ])

def build_dex(ver=0):
    return build([main, voice, net, srv, keep, apk, chrome, updrx, make_upd(ver)])
