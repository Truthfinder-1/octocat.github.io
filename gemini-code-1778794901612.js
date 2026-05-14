// ═══════════════════════════════════════════
// CONFIGURATION - CHANGE THIS
// ═══════════════════════════════════════════
// 1. Get the HTTP tunnel URL from your Playit.gg dashboard
// 2. It should look like https://something-something.playit.gg
const BACKEND_URL = "https://YOUR-PLAYIT-AGENT-HERE.playit.gg"; 

// ═══════════════════════════════════════════
// UPDATED CORE FUNCTIONS
// ═══════════════════════════════════════════

async function checkBackend() {
  if (!S.user) return;
  try {
    const res = await fetch(`${BACKEND_URL}/api/status`);
    const data = await res.json();
    
    // Update the UI with real data from your phone
    const s = S.servers.find(x => x.id === S.selectedId);
    if (s) {
      s.status = data.running ? 'online' : 'offline';
      s.address = data.playitAddress || 'Configuring...';
      render();
    }
    
    // Auto-pull logs if the server is running
    if (data.running) fetchLogs();
  } catch (err) {
    console.log("Backend offline or URL incorrect.");
  }
}

async function fetchLogs() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/server-logs`);
    const data = await res.json();
    if (data.logs) {
      const cb = document.getElementById('console-box');
      if (cb) {
        cb.innerHTML = data.logs.map(l => `<div>${l}</div>`).join('');
        cb.scrollTop = cb.scrollHeight;
      }
    }
  } catch (e) {}
}

async function startInstall() {
  const s = S.servers.find(x => x.id === S.selectedId);
  if (!s) return;

  s.status = 'installing';
  render();

  try {
    const res = await fetch(`${BACKEND_URL}/api/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: s.version,
        type: s.type,
        ram: s.ram
      })
    });
    
    const data = await res.json();
    if (data.success) {
      fakeAlert("SUCCESS", "Server launch signal sent to phone!");
    } else {
      fakeAlert("ERROR", data.error || "Launch failed");
      s.status = 'offline';
    }
  } catch (err) {
    fakeAlert("ERROR", "Could not reach phone. Check Playit tunnel!");
    s.status = 'offline';
  }
  render();
}

async function stopServer() {
  try {
    await fetch(`${BACKEND_URL}/api/stop`, { method: 'POST' });
    fakeAlert("SYSTEM", "Stop command sent.");
  } catch (e) {
    fakeAlert("ERROR", "Failed to stop server.");
  }
}

async function sendCommand() {
  const inp = document.getElementById('console-input');
  const cmd = inp.value.trim();
  if (!cmd) return;

  try {
    await fetch(`${BACKEND_URL}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd })
    });
    inp.value = '';
  } catch (e) {
    fakeAlert("ERROR", "Command failed to send.");
  }
}