FACTORY MONITOR — WATERJET 8 LOOM — पूरा सेटअप (step by step)
================================================================
इस zip में:
  1_ESP32_firmware/loom_monitor_8loom_fast/   → ESP32-S3 code (1 ESP = 8 looms, interrupt गिनती)
  2_loom_apps_script/                         → Loom Google Sheet का Code.gs + pages
  2b_embroidery_apps_script/Code.gs           → Embroidery customers के लिए नया Code.gs (View_Key वाला)
  3_website_github_netlify/                   → ★ एक ही website सारे customers (loom + embroidery) के लिए
  highspeed_loom_wiring.png                   → 4.7K + 10nF wiring

-------------------------------------------------------------
भाग A — ESP32 (हर 8 looms पर एक)
-------------------------------------------------------------
1. Arduino IDE ▶ 1_ESP32_firmware/loom_monitor_8loom_fast/loom_monitor_8loom_fast.ino खोलें.
   Board: ESP32S3 Dev Module, USB CDC On Boot: Enabled. Libraries: RTClib, ArduinoJson v7.
2. Upload.
3. Pins:  L1=39  L2=40  L3=41  L4=42  L5=4  L6=5  L7=15  L8=16   RTC: SDA 8, SCL 9
   हर GPIO पर 4.7K pull-up (3.3V) + 10nF (103) GND की तरफ़.
4. Phone से WiFi "LOOM-SETUP-…" (password loom1234) → WiFi, exec link, ESP नंबर भरें.
   ESP नंबर 1 = L1–L8,  2 = L9–L16,  3 = L17–L24 …
5. Serial Monitor (115200) में  d  → RPM मशीन जैसा, noise rejected कम = ठीक.

-------------------------------------------------------------
भाग B — Customer की Google Sheet (उसकी अपनी Gmail से)
-------------------------------------------------------------
1. नई Google Sheet ▶ Extensions ▶ Apps Script.
2. 2_loom_apps_script की files डालें: Code.gs, और HTML files (Floor, Andon, Compare, Index, App)
   — + ▶ HTML से वही नाम (बिना .html).
3. setup ▶ Run (permission दें).
4. Settings tab में:  Looms_Per_ESP = 8   (waterjet / airjet)
                      Company_Name = customer का नाम
5. makeViewKey ▶ Run → Execution log में  url  और  View_Key  लिख लें.
6. Deploy ▶ New deployment ▶ Web app ▶ Execute as: Me ▶ Who has access: Anyone ▶ Deploy.
   (पहले से deploy है तो: Manage deployments ▶ ✏ ▶ New version ▶ Deploy)

Embroidery customer के लिए यही, बस 2b_embroidery_apps_script/Code.gs और embroidery वाली pages.

-------------------------------------------------------------
भाग C — GitHub: एक repository सबके लिए (एक बार)
-------------------------------------------------------------
1. github.com ▶ + ▶ New repository ▶ नाम: factory-monitor ▶ Public (अभी) ▶ Create.
2. "uploading an existing file" ▶ 3_website_github_netlify folder खोलें,
   उसके अंदर का सब कुछ (index.html, api.js, customers.json, netlify.toml, robots.txt,
   emb folder, loom folder) एक साथ select करके खींचकर डालें. ▶ Commit changes.
   जाँच: repo में सबसे ऊपर index.html दिखे, और emb / loom दो folders.

-------------------------------------------------------------
भाग D — Customer list (customers.json)
-------------------------------------------------------------
GitHub ▶ customers.json ▶ ✏ ▶ हर customer की एक line:

{
  "gvs":   { "name": "GVS Embroidery", "type": "emb",  "url": "https://script.google.com/macros/s/AKfy...1/exec", "active": true },
  "surat1":{ "name": "Shree Waterjet", "type": "loom", "url": "https://script.google.com/macros/s/AKfy...2/exec", "active": true }
}

  • "surat1" = customer code (छोटे अक्षर, बिना space) — यही link में जाएगा.
  • "type": "loom" = waterjet / airjet / साधारण loom,   "emb" = embroidery.
  • हर line के बाद कॉमा — आख़िरी के बाद नहीं.
  • पैसे बाकी?  "active": false  → उसका dashboard बंद.
  • View_Key यहाँ कभी न लिखें.
Commit ▶ 1 मिनट में site पर अपने आप.

-------------------------------------------------------------
भाग E — Netlify (एक बार)
-------------------------------------------------------------
1. app.netlify.com ▶ Sign up with GitHub.
2. Add new project ▶ Import an existing project ▶ GitHub ▶ factory-monitor चुनें.
3. Build command खाली, Publish directory  .  ▶ Deploy.
4. Site configuration ▶ Change site name ▶ जैसे  factorymonitor
   → https://factorymonitor.netlify.app

-------------------------------------------------------------
भाग F — Repository PRIVATE (छुपाना)
-------------------------------------------------------------
1. GitHub ▶ factory-monitor ▶ Settings ▶ सबसे नीचे Danger Zone ▶ Change visibility ▶ Make private.
2. Netlify चलता रहेगा. जाँच: customers.json में कुछ बदलें ▶ Netlify ▶ Deploys में नया "Published".
   न आए: Netlify ▶ Site configuration ▶ Build & deploy ▶ Link repository दोबारा.

-------------------------------------------------------------
भाग G — Customer को link (सबके लिए एक ही site)
-------------------------------------------------------------
   https://factorymonitor.netlify.app/?c=surat1&k=<उसकी View_Key>

  • site अपने आप loom या embroidery dashboard खोलती है (customers.json के type से).
  • phone एक बार खुलने के बाद याद रखता है.
  • MIT App Inventor: WebViewer ▶ HomeUrl = यही link.
  • Loom Floor में card दबाकर Quality / Next Beam बदलना भी इसी link से चलता है
    (Settings में Edit_PIN भरा हो तो PIN माँगेगा).
  • list के बिना:  /?t=loom&s=<deployment ID>&k=<key>

-------------------------------------------------------------
सुरक्षा
-------------------------------------------------------------
  • Repo private → code GitHub पर नहीं दिखेगा.
  • customers.json में key नहीं → बिना key कोई data नहीं देख सकता.
  • View_Key भरने के बाद पुराना exec link (?page=app) बिना &k=KEY नहीं खुलेगा.
  • key leak हो → उस Sheet में makeViewKey ▶ Run → नया link भेजें.

दिक्कत:
  "Customer … list में नहीं है"  → customers.json में code / कॉमा.
  "Link की key गलत है"           → link का k= और Settings का View_Key एक जैसा.
  "Script access Anyone नहीं है" → Deploy में Anyone + New version.
  Card पर ESP नंबर ग़लत           → Settings ▶ Looms_Per_ESP = 8.

-------------------------------------------------------------
TFO भी उसी app में (एक app, नीचे TFO tabs)
-------------------------------------------------------------
  1. TFO वाली Google Sheet में नया Code.gs (tfo_monitor_v2) ▶ setup ▶ Run ▶ New version deploy.
     Settings में View_Key = loom Sheet वाली View_Key जैसी ही (तो एक ही link चलेगा).
     showWebLink ▶ Run → Execution log में TFO का exec URL.
  2. customers.json में उसी customer की line में "tfo" जोड़ें:
       "surat1": { "name": "Shree Tex", "type": "loom", "url": "<loom exec URL>",
                   "tfo": "<TFO exec URL>", "active": true }
     → loom app के नीचे दो नए tabs:  ⟳ TFO  (Floor + yarn kg)   ☷ TFO Rep (Report)
     Embroidery customer ("type": "emb") में भी "tfo" जोड़ सकते हैं — वही tabs.
  3. सिर्फ़ TFO वाला customer:
       "tfo1": { "name": "XYZ Twisting", "type": "tfo", "url": "<TFO exec URL>", "active": true }
  4. TFO Sheet की View_Key अलग रखी है तो link में  &k2=TFO_KEY  जोड़ें.
  Link वही:  https://<site>.netlify.app/?c=surat1&k=KEY
