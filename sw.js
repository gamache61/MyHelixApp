<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover">
  <title>Helix v48.8 - Memory & Copy</title>
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/7159/7159502.png">
  <style>
    body { background: #000; color: #fff; font-family: -apple-system, sans-serif; height: 100dvh; margin: 0; display: flex; flex-direction: column; overflow: hidden; }
    #scene { height: 25%; min-height: 140px; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle at center, #1a1a1a 0%, #000 100%); border-bottom: 1px solid #333; position: relative; }
    #core { width: 90px; height: 90px; background: radial-gradient(circle at 30% 30%, #fff, #0ff, #001); border-radius: 50%; box-shadow: 0 0 30px cyan; display: flex; justify-content: center; align-items: center; transition: 0.3s; z-index: 2; animation: float 6s ease-in-out infinite; }
    #core span { font-size: 10px; font-weight: 900; letter-spacing: 1px; color: rgba(0,0,0,0.6); font-family: monospace; pointer-events: none; }
    #core.listening { background: radial-gradient(circle at 30% 30%, #fff, #5f5, #010) !important; box-shadow: 0 0 60px lime !important; transform: scale(1.1); }
    #core.thinking { background: radial-gradient(circle at 30% 30%, #fff, #fb0, #420) !important; box-shadow: 0 0 50px orange !important; animation: pulseFast 0.5s alternate infinite !important; }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes pulseFast { 0% { transform: scale(0.95); opacity: 0.8; } 100% { transform: scale(1.0); opacity: 1; } }
    
    #ui-layer { flex: 1; display: flex; flex-direction: column; padding: 10px; background: #0a0a0a; gap: 10px; overflow: hidden; position: relative; }
    #header-row { display: flex; justify-content: space-between; align-items: center; min-height: 30px; }
    #model-badge { background: #112; color: #aaf; border: 1px solid #336; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; font-family: monospace; }
    #console { flex-grow: 1; overflow-y: auto; padding: 10px; border: 1px solid #222; border-radius: 8px; background: #000; display: flex; flex-direction: column; gap: 12px; }
    
    .msg { padding: 12px; border-radius: 12px; font-size: 15px; max-width: 90%; line-height: 1.4; word-wrap: break-word; position: relative; }
    .user { align-self: flex-end; background: #222; color: #fff; border-bottom-right-radius: 2px; }
    .ai { align-self: flex-start; background: #111; color: #ccc; border: 1px solid #333; width: 95%; border-bottom-left-radius: 2px; }
    
    /* New UI Components */
    .ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #222; }
    .ai-title { font-size: 11px; font-weight: 900; color: cyan; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; }
    .copy-btn { background: #222; border: 1px solid #444; color: #888; font-size: 10px; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: 0.2s; }
    .copy-btn:active { background: #0ff; color: #000; }
    .thought-trace { display: block; font-size: 11px; color: #666; font-style: italic; margin-bottom: 8px; border-left: 2px solid #444; padding-left: 8px; }

    #settings-panel { display: none; position: absolute; inset: 0; background: #000; z-index: 9999; flex-direction: column; align-items: center; padding: 30px; box-sizing: border-box; overflow-y: auto; }
    #settings-panel.active { display: flex !important; }
    .setting-label { color:#888; font-size:12px; margin-top:15px; width:100%; font-weight:bold; text-align: left; }
    .key-input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #444; background: #111; color: white; margin-bottom: 10px; font-family: monospace; }
    #input-row { display: flex; gap: 8px; align-items: center; margin-top: auto; padding: 10px; }
    #txt-input { flex-grow: 1; padding: 12px; border-radius: 12px; border: 1px solid #333; background: #111; color: white; font-size: 16px; outline: none; }
    .action-btn { background: #222; color: #aaa; border: 1px solid #333; border-radius: 12px; width: 48px; height: 48px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    #mic-btn.active { background: #060; color: #fff; border-color: lime; box-shadow: 0 0 15px #060; }
  </style>
</head>
<body>

<div id="settings-panel">
    <h2 style="color:cyan; font-family:monospace;">HELIX CONFIG</h2>
    <div class="setting-label">Active Model</div>
    <select id="model-select" class="key-input">
        <option value="llama-3.3-70b-versatile">Groq: Llama 3.3</option>
        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
    </select>
    <div class="setting-label">Groq API Key</div>
    <input type="text" id="groq-key-input" class="key-input" placeholder="gsk_...">
    <div class="setting-label">Google API Key</div>
    <input type="text" id="google-key-input" class="key-input" placeholder="AIza...">
    
    <button style="width:100%; padding:15px; background:cyan; border-radius:10px; font-weight:bold; color:black; margin-bottom:10px;" onclick="saveSettings()">SAVE & REFRESH</button>
    <button style="width:100%; padding:10px; background:transparent; border:1px solid #f44; border-radius:10px; font-weight:bold; color:#f44;" onclick="clearHistory()">CLEAR MEMORY</button>
</div>

<div id="scene"><div id="core"><span id="orb-text">HELIX</span></div></div>

<div id="ui-layer">
  <div id="header-row">
    <div id="model-badge">READY</div>
    <button class="action-btn" style="width:auto; padding:0 15px; font-size:12px;" onclick="toggleSettings()">⚙ SETTINGS</button>
  </div>
  <div id="console"></div>
  <div id="input-row">
      <input id="txt-input" placeholder="Message..." onkeydown="if(event.key==='Enter') sendText()">
      <button id="mic-btn" class="action-btn" onclick="handleMicClick()">🎤</button>
      <button class="action-btn" onclick="sendText()" style="color:cyan;">▶</button>
  </div>
</div>

<script>
let googleKey = localStorage.getItem('helix_google_key_v47') || "";
let groqKey = localStorage.getItem('helix_groq_key_v47') || "";
let currentModel = localStorage.getItem('helix_model_v47') || "llama-3.3-70b-versatile";
let chatHistory = JSON.parse(localStorage.getItem('helix_history_v47')) || [];

let micEnabled = false;
let recognition = null;
const systemRules = "You are HELIX. Rule: Be concise. Use markdown for code. Identify if you are giving a fix, a thought, or a general answer.";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.onstart = () => { updateOrb('listening', 'LISTENING'); document.getElementById('mic-btn').classList.add('active'); };
    recognition.onend = () => { micEnabled = false; document.getElementById('mic-btn').classList.remove('active'); updateOrb('', 'HELIX'); };
    recognition.onresult = (e) => { document.getElementById('txt-input').value = e.results[0][0].transcript; sendText(); };
}

window.onload = () => {
    updateBadge();
    chatHistory.forEach(msg => addMessage(msg.role === 'assistant' ? 'ai' : 'user', msg.content));
    if (!googleKey && !groqKey) toggleSettings();
};

function toggleSettings() { 
    document.getElementById('settings-panel').classList.toggle('active');
}

function saveSettings() {
    localStorage.setItem('helix_google_key_v47', document.getElementById('google-key-input').value.trim());
    localStorage.setItem('helix_groq_key_v47', document.getElementById('groq-key-input').value.trim());
    localStorage.setItem('helix_model_v47', document.getElementById('model-select').value);
    location.reload();
}

function clearHistory() {
    if(confirm("Clear AI memory?")) {
        chatHistory = [];
        localStorage.removeItem('helix_history_v47');
        document.getElementById('console').innerHTML = "";
    }
}

async function sendText() {
    const input = document.getElementById('txt-input'); 
    const t = input.value.trim();
    if (!t) return;

    const isGroq = currentModel.includes('llama');
    const activeKey = isGroq ? groqKey : googleKey;
    if (!activeKey) return toggleSettings();

    input.value = ""; 
    addMessage('user', t);
    chatHistory.push({ role: 'user', content: t });
    updateOrb('thinking', 'ANALYZING...');

    try {
        let response;
        if (isGroq) {
            response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${activeKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: currentModel, messages: [{ role: 'system', content: systemRules }, ...chatHistory], temperature: 0.3 })
            });
        } else {
            const geminiContents = chatHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${activeKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ system_instruction: { parts: [{ text: systemRules }] }, contents: geminiContents })
            });
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Failed");

        let aiText = isGroq ? data.choices[0].message.content : data.candidates[0].content.parts[0].text;
        
        chatHistory.push({ role: 'assistant', content: aiText });
        if (chatHistory.length > 20) chatHistory.shift();
        localStorage.setItem('helix_history_v47', JSON.stringify(chatHistory));

        addMessage('ai', aiText);
        updateOrb('', 'HELIX');
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(aiText.slice(0, 300)));
        
    } catch (e) { 
        addMessage('system', "❌ " + e.message); 
        updateOrb('', 'ERROR'); 
    }
}

function updateOrb(cls, txt) { document.getElementById('core').className = cls; document.getElementById('orb-text').innerText = txt; }
function updateBadge() { document.getElementById('model-badge').innerText = currentModel.toUpperCase(); }

function handleMicClick() {
    if (!recognition) return alert("Mic not supported.");
    if (!micEnabled) { micEnabled = true; recognition.start(); } else { micEnabled = false; recognition.stop(); }
}

function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const oldText = btn.innerText;
        btn.innerText = "COPIED!";
        btn.style.color = "cyan";
        setTimeout(() => { btn.innerText = oldText; btn.style.color = "#888"; }, 2000);
    });
}

function addMessage(role, text) {
    const consoleDiv = document.getElementById('console'); 
    const msg = document.createElement('div');
    msg.className = 'msg ' + (role === 'assistant' ? 'ai' : role);
    
    if (role === 'assistant' || role === 'ai') {
        // Simple logic to determine a title based on content
        let title = "Helix Response";
        if (text.includes("```")) title = "Code Fix Detected";
        else if (text.length < 100) title = "Quick Note";
        else if (text.toLowerCase().includes("how to")) title = "Instructional Guide";

        msg.innerHTML = `
            <div class="ai-header">
                <span class="ai-title">${title}</span>
                <button class="copy-btn" onclick="copyToClipboard(\`${text.replace(/`/g, '\\`')}\`, this)">COPY</button>
            </div>
            <div class="ai-content">${text.replace(/\n/g, '<br>')}</div>
        `;
    } else {
        msg.innerHTML = text.replace(/\n/g, '<br>');
    }
    
    consoleDiv.appendChild(msg); 
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}
</script>
</body>
</html>