// ================== CONFIG & HELPERS ==================
const API_BASE = "http://127.0.0.1:5000";

// --- Hardcoded "AI" fallback (by patient id) ---
const MOCK_AI_BANK = {
  p001: { // Amina
    level: "Stable",
    risk: 12,
    messages: [
      "Stable; continue routine monitoring.",
      "Stable today; mild fatigue reported.",
      "Stable and responding well to care."
    ],
    reasons: [
      "Vitals within expected range",
      "No acute issues flagged",
      "Symptoms controlled"
    ],
    color: "#3a873a"
  },
  p002: { // Rahim
    level: "Watch",
    risk: 42,
    messages: [
      "Warning; reassess within 15 minutes.",
      "Borderline stable; keep a close eye.",
      "Slightly elevated risk; repeat checks."
    ],
    reasons: [
      "Mild BP elevation",
      "Occasional SpO₂ dips",
      "HR trending up"
    ],
    color: "#e6a700"
  },
  p003: { // Leyla
    level: "Critical",
    risk: 78,
    messages: [
      "Critical risk; nurse check within 5 minutes.",
      "High concern; interventions ongoing.",
      "Unstable; continuous monitoring required."
    ],
    reasons: [
      "Low SpO₂",
      "Tachycardia episodes",
      "Temperature elevated"
    ],
    color: "#d11a2d"
  }
};
function mockAI(pid) {
  const row = MOCK_AI_BANK[pid] || {
    level: "Stable", risk: 10,
    messages: ["Stable; routine monitoring."],
    reasons: ["No specific risks detected."],
    color: "#3a873a"
  };
  const msg = row.messages[Math.floor(Math.random() * row.messages.length)];
  return { level: row.level, risk: row.risk, message: msg, reasons: row.reasons, color: row.color };
}

const $  = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);

function toast(sel, msg, ok = true) {
  const el = $(sel);
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("error", !ok);
}
function btnLoading(sel, on) {
  const b = $(sel);
  if (!b) return;
  b.disabled = on;
  if (on) { b.dataset.label = b.textContent; b.textContent = "Loading…"; }
  else    { b.textContent = b.dataset.label || b.textContent; }
}

// ================== TABS & THEME ==================
$$(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    if (!target) return;
    $$(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll("main .card").forEach(sec => sec.classList.remove("show"));
    document.querySelector(target).classList.add("show");
  });
});

$("#themeBtn")?.addEventListener("click", () => {
  document.body.classList.toggle("light");
});

// ================== CIVICBOT: Government Steps ==================


// ================== CIVICBOT MINI CHAT (hardcoded doctor AI) ==================
// ===== CivicBot mini chat (phone-like) — DROP-IN REPLACEMENT =====
(function civicMini() {
  function $(id) { return document.getElementById(id); }

  const modal   = $("civicModal");
  const closeBt = $("civicClose");
  const chat    = $("civicChat");
  const input   = $("civicInput");
  const sendBt  = $("civicSend");
  const openBt  = $("openCivic");

  if (!modal || !closeBt || !chat || !input || !sendBt || !openBt) return;

  // Open/Close
  openBt.addEventListener("click", () => {
    modal.classList.remove("hidden");
    setTimeout(() => input.focus(), 0);
  });
  closeBt.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

  // Bubble helpers
  function pushUser(text) {
    const b = document.createElement("div"); b.className = "me"; b.textContent = text;
    chat.appendChild(b); chat.scrollTop = chat.scrollHeight;
  }
  function pushBot(text) {
    const b = document.createElement("div"); b.className = "bot"; b.textContent = text;
    chat.appendChild(b); chat.scrollTop = chat.scrollHeight;
  }

  // --- Patient & Intent detection ---
  function detectPatient(q) {
    const t = q.toLowerCase();
    if (t.includes("amina")) return "amina";
    if (t.includes("rahim")) return "rahim";
    if (t.includes("leyla")) return "leyla";
    if (t.includes("first")) return "amina";
    if (t.includes("second")) return "rahim";
    if (t.includes("third")) return "leyla";
    return null;
  }
  function detectIntent(q) {
    const t = q.toLowerCase();
    if (/(risk|status|stable|condition|how is|how's)/.test(t)) return "status";
    if (/(fever|temperature|temp)/.test(t)) return "fever";
    if (/(oxygen|spo2|ox|saturation)/.test(t)) return "oxygen";
    if (/(heart rate|hr|pulse)/.test(t)) return "hr";
    if (/(blood pressure|bp|pressure)/.test(t)) return "bp";
    if (/(alert|alerts|issues|problems|flags)/.test(t)) return "alerts";
    return "status"; // default
  }

  // --- Hardcoded reply bank (feels alive via randomness) ---
  const BANK = {
    amina: {
      status: [
        "Amina is stable and responding well to treatment.",
        "Amina feels a bit tired, but overall stable today.",
        "Amina’s condition looks good; no acute issues noted."
      ],
      fever: [
        "No fever for Amina today.",
        "Amina reports mild warmth earlier, but no fever recorded.",
        "Amina is afebrile at this time."
      ],
      oxygen: [
        "Amina’s oxygen looks fine today.",
        "SpO₂ is within normal range for Amina.",
        "No oxygen concerns for Amina right now."
      ],
      hr: [
        "Amina’s heart rate is within a comfortable range.",
        "Pulse is steady for Amina.",
        "Amina’s HR is acceptable; no tachycardia currently."
      ],
      bp: [
        "Amina’s blood pressure is within expected limits.",
        "BP is controlled for Amina today.",
        "No BP spikes for Amina at this check."
      ],
      alerts: [
        "No active alerts for Amina.",
        "Amina has a low-risk profile right now.",
        "Nothing urgent flagged for Amina."
      ]
    },
    rahim: {
      status: [
        "Rahim is weak today; recommend closer monitoring.",
        "Rahim shows slight improvement but remains under watch.",
        "Rahim is borderline stable; continue routine checks."
      ],
      fever: [
        "Rahim is afebrile currently.",
        "No fever recorded for Rahim.",
        "Rahim had mild elevation earlier; now normal."
      ],
      oxygen: [
        "Rahim’s oxygen is a little low at times; keep an eye on it.",
        "SpO₂ dips were noted for Rahim; re-check in a bit.",
        "Oxygen saturation is acceptable but trending watchful."
      ],
      hr: [
        "Rahim’s HR is mildly elevated; monitor for tachycardia.",
        "Pulse slightly high for Rahim; reassess after rest.",
        "Rahim’s heart rate is fluctuating—clinically watchful."
      ],
      bp: [
        "Rahim’s BP is a little high; not critical.",
        "BP is elevated for Rahim; re-check later.",
        "Rahim’s blood pressure needs monitoring today."
      ],
      alerts: [
        "Alerts: mild BP elevation, occasional O₂ dips.",
        "Issues noted: BP and HR trending up—watch.",
        "Current flags: hemodynamic variability; stay observant."
      ]
    },
    leyla: {
      status: [
        "Leyla’s condition is critical; under close observation.",
        "High risk for Leyla; interventions ongoing.",
        "Leyla remains unstable; team is monitoring closely."
      ],
      fever: [
        "Leyla has intermittent fever spikes.",
        "Fever risk is present for Leyla; antipyretics considered.",
        "Temperature elevated for Leyla; keep monitoring."
      ],
      oxygen: [
        "Leyla’s oxygen saturation is low; supplemental O₂ in place.",
        "SpO₂ is concerning for Leyla; continuous monitoring.",
        "Oxygen remains a primary concern for Leyla."
      ],
      hr: [
        "Tachycardia episodes present for Leyla.",
        "Leyla’s HR is high; managing accordingly.",
        "Heart rate remains elevated; close watch maintained."
      ],
      bp: [
        "Leyla’s BP is unstable; careful titration ongoing.",
        "Pressure swings detected for Leyla; managing.",
        "BP requires continuous monitoring for Leyla."
      ],
      alerts: [
        "Active alerts: low SpO₂, tachycardia, instability.",
        "Critical flags for Leyla—team notified.",
        "Multiple alerts present; escalation pathways active."
      ]
    }
  };

  function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function makeReply(patientKey, intent) {
    const bucket = BANK[patientKey];
    if (!bucket) return "I don’t know that patient. Try Amina, Rahim, or Leyla.";
    // If the intent isn't present, fall back to status
    const list = bucket[intent] || bucket.status;
    let msg = randomPick(list);

    // Add a short tail to feel dynamic
    const tails = [
      " Reassess in 15 minutes.",
      " Continue routine monitoring.",
      " Nurse notified.",
      " Team aware.",
      " Follow standard protocol."
    ];
    if (intent !== "alerts") msg += randomPick(tails);
    return msg;
  }

  function handleQuestion(text) {
    pushUser(text);
    const who = detectPatient(text);
    if (!who) {
      pushBot("I couldn’t find that patient. Try: “How is Amina?”, “Rahim BP?”, “Does Leyla have fever?”");
      return;
    }
    const intent = detectIntent(text);
    const reply = makeReply(who, intent);
    pushBot(reply);
  }

  // Send handlers
  sendBt.addEventListener("click", () => {
    const txt = (input.value || "").trim();
    if (!txt) return;
    input.value = "";
    handleQuestion(txt);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const txt = (input.value || "").trim();
      if (!txt) return;
      input.value = "";
      handleQuestion(txt);
    }
  });
})();


// ================== EMERGENCY WALLET ==================
$("#walletBtn")?.addEventListener("click", async () => {
  btnLoading("#walletBtn", true);
  try {
    const res = await fetch(`${API_BASE}/api/emergency`, { mode: "cors" });
    const data = await res.json();
    fillWallet(data.name, data.id, data.ice, data.medical_notes);
  } catch {
    fillWallet("Demo User", "AZ-ABC-123456", "+1 480 555 1212", "No known allergies. Blood type O+.");
  } finally {
    btnLoading("#walletBtn", false);
  }
});

function fillWallet(name, id, ice, notes) {
  $("#wName").textContent = name || "—";
  $("#wId").textContent   = id   || "—";
  $("#wIce").textContent  = ice  || "—";
  $("#wNotes").textContent= notes|| "—";
  $("#walletBox")?.classList.remove("hidden");
  renderQR(id || "");
}

async function renderQR(text) {
  const box = $("#qrBox");
  if (!box) return;
  if (!text) { box.textContent = "QR"; return; }
  try {
    const res = await fetch(`${API_BASE}/api/qr?text=${encodeURIComponent(text)}`);
    const data = await res.json();
    if (data.data_url) {
      box.innerHTML = `<img src="${data.data_url}" alt="QR" style="width:120px;height:120px;border-radius:8px;" />`;
    } else { box.textContent = "QR not available"; }
  } catch { box.textContent = "QR not available"; }
}

// Save profile (POST)
$("#saveWalletBtn")?.addEventListener("click", async () => {
  const body = {
    name:  $("#nameIn")?.value || $("#wName")?.textContent,
    id:    $("#idIn")?.value   || $("#wId")?.textContent,
    ice:   $("#iceIn")?.value  || $("#wIce")?.textContent,
    medical_notes: $("#notesIn")?.value || $("#wNotes")?.textContent
  };
  try {
    const res = await fetch(`${API_BASE}/api/emergency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const d = await res.json();
    fillWallet(d.profile.name, d.profile.id, d.profile.ice, d.profile.medical_notes);
    if ($("#nameIn"))  $("#nameIn").value = "";
    if ($("#idIn"))    $("#idIn").value = "";
    if ($("#iceIn"))   $("#iceIn").value = "";
    if ($("#notesIn")) $("#notesIn").value = "";
  } catch {
    alert("Could not save profile");
  }
});

// Copy / Print / Download / Share
$("#copyIdBtn")?.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("#wId").textContent); alert("ID copied"); }
  catch { alert("Copy failed"); }
});

$("#printBtn")?.addEventListener("click", () => window.print());

$("#dlBtn")?.addEventListener("click", async () => {
  const card = $("#walletBox");
  if (!card || typeof html2canvas === "undefined") return;
  const canvas = await html2canvas(card);
  const link = document.createElement("a");
  link.download = "svai-wallet.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

$("#shareBtn")?.addEventListener("click", async () => {
  const id = $("#wId")?.textContent || "";
  try {
    await navigator.share({ title: "SVAI Emergency ID", text: `My ID: ${id}` });
  } catch { /* user canceled or unsupported */ }
});

// ================== DOCTOR DASHBOARD ==================
let chHr, chSpO2, chBp, chRrTemp;

async function api(path) {
  const r = await fetch(`${API_BASE}${path}`, { mode: "cors" });
  if (!r.ok) throw new Error(`API ${path} failed`);
  return r.json();
}

function kpiSet(id, value, delta) {
  const el = document.getElementById(id);
  if (!el) return;
  el.childNodes[0].nodeValue = el.childNodes[0].nodeValue.split(":")[0] + `: ${value} `;
  const d = el.querySelector(".delta");
  if (d) {
    const sign = (typeof delta === "number") ? (delta > 0 ? "+" : (delta < 0 ? "" : "±")) : "";
    d.textContent = (typeof delta === "string") ? `(${delta})` : `(${sign}${delta})`;
    d.style.color = (typeof delta === "string") ? "var(--muted)" :
      delta > 0 ? "var(--action)" : (delta < 0 ? "var(--action-2)" : "var(--muted)");
  }
}
function setBadge(id, text, colorHex) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.boxShadow = colorHex ? `inset 0 0 0 9999px ${colorHex}20` : "none";
}
function fillRangeTable(range) {
  const tb = document.querySelector("#rangeTable tbody");
  if (!tb || !range) return;
  tb.innerHTML = [
    ["HR (bpm)", range.hr.min, range.hr.max],
    ["SpO₂ (%)", range.spo2.min, range.spo2.max],
    ["BP Sys (mmHg)", range.bp_sys.min, range.bp_sys.max],
    ["BP Dia (mmHg)", range.bp_dia.min, range.bp_dia.max],
    ["RR (breaths/min)", range.rr.min, range.rr.max],
    ["Temp (°C)", range.temp.min, range.temp.max],
  ].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("");
}
function mkChart(ctxId, config) {
  const ctx = document.getElementById(ctxId);
  if (!ctx) return null;
  config.options = Object.assign({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  }, config.options || {});
  return new Chart(ctx, config);
}

async function loadPatients() {
  const sel = $("#ptSelect");
  if (!sel) return null;
  const data = await api("/api/patients");
  sel.innerHTML = data.patients.map(p => `<option value="${p.id}">${p.name} — Bed ${p.bed}</option>`).join("");
  return data.patients[0]?.id || null;
}

async function loadDashboard(pid) {
  $("#dashStatus").textContent = "Loading…";
  try {
    const [vitals, summ] = await Promise.all([
      api(`/api/patient/${pid}/vitals?hours=48`),
      api(`/api/patient/${pid}/summary`)
    ]);

    const L = summ.summary.latest, D = summ.summary.deltas;
    kpiSet("kpiHr",   `${L.hr} bpm`,                  D.hr);
    kpiSet("kpiSpO2", `${L.spo2}%`,                   D.spo2);
    kpiSet("kpiBp",   `${L.bp_sys}/${L.bp_dia} mmHg`, `${D.bp_sys}/${D.bp_dia}`);
    kpiSet("kpiRr",   `${L.rr}/min`,                  D.rr);
    kpiSet("kpiTemp", `${L.temp} °C`,                 D.temp);
    fillRangeTable(summ.summary.range24h);

    const risk = (summ.alerts.length >= 2) ? "High" : (summ.alerts.length ? "Moderate" : "Low");
    setBadge("riskBadge", `Risk: ${risk}`, risk === "High" ? "#d11" : risk === "Moderate" ? "#e6a700" : "#3a873a");
    setBadge("statusBadge", summ.alerts[0] ? `Status: ${summ.alerts.join(", ")}` : "Status: Stable",
      summ.alerts[0] ? "#d11" : "#3a873a");

    const labels = vitals.timestamps.map(t => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    chHr && chHr.destroy(); chSpO2 && chSpO2.destroy(); chBp && chBp.destroy(); chRrTemp && chRrTemp.destroy();

    chHr = mkChart("chartHr", {
      type: "line",
      data: { labels, datasets: [{ label: "HR (bpm)", data: vitals.hr, tension: 0.3 }] }
    });
    chSpO2 = mkChart("chartSpO2", {
      type: "line",
      data: { labels, datasets: [{ label: "SpO₂ (%)", data: vitals.spo2, tension: 0.3 }] }
    });
    chBp = mkChart("chartBp", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Systolic", data: vitals.bp_sys, tension: 0.3 },
          { label: "Diastolic", data: vitals.bp_dia, tension: 0.3 }
        ]
      }
    });
    chRrTemp = mkChart("chartRrTemp", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "RR (/min)", data: vitals.rr, tension: 0.3 },
          { label: "Temp (°C)", data: vitals.temp, tension: 0.3, yAxisID: "y1" }
        ]
      },
      options: { scales: { y1: { position: "right" } } }
    });

    $("#dashStatus").textContent = "";
  } catch (e) {
    $("#dashStatus").textContent = "Could not load data.";
    console.error(e);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  renderSteps(demoSteps("birth certificate"));

  const sel = $("#ptSelect");
  const refresh = $("#ptRefreshBtn");
  if (sel && refresh) {
    try {
      const firstId = await loadPatients();
      if (firstId) { sel.value = firstId; await loadDashboard(firstId); }
    } catch { $("#dashStatus").textContent = "Could not load patients."; }

    sel.addEventListener("change", () => loadDashboard(sel.value));
    refresh.addEventListener("click", () => loadDashboard(sel.value));
  }
});
// Build patient list sidebar with risk dots
async function buildPatientList() {
  const list = document.getElementById("ptList");
  if (!list) return;
  const data = await api("/api/patients");
  list.innerHTML = "";
  data.patients.forEach(p => {
    const li = document.createElement("div");
    li.className = "pt-item";
    li.innerHTML = `
      <div>
        <div class="pt-name">${p.name}</div>
        <div class="pt-sub">Bed ${p.bed} — ${p.mrn}</div>
      </div>
      <div class="pt-risk ${p.risk>=70?'high':p.risk>=40?'mod':'low'}"></div>
    `;
    li.onclick = async () => {
      const sel = document.getElementById("ptSelect");
      if (sel) sel.value = p.id;
      currentPid = p.id;
      await loadDashboard(p.id);
      await loadAnalysis(p.id);
    };
    list.appendChild(li);
  });

  // search
  const q = document.getElementById("ptSearch");
  if (q && !q._wiredup) {
    q._wiredup = true;
    q.addEventListener("input", () => {
      const term = q.value.toLowerCase();
      [...list.children].forEach(c => {
        const txt = c.textContent.toLowerCase();
        c.style.display = txt.includes(term) ? "" : "none";
      });
    });
  }
}

// Fill the AI card headline/reasons from your /analyze
// Fill the AI card headline/reasons (with hardcoded fallback)
async function loadAnalysis(pid) {
  const hl = document.getElementById("aiHeadline");
  const rs = document.getElementById("aiReasons");
  const aiCard = document.querySelector(".ai-card");
  const moodSel = document.getElementById("moodSelect");

  // Helper to paint the UI
  const render = (a) => {
    if (hl) hl.textContent = `${a.level.toUpperCase()} • Risk ${a.risk} — ${a.message}`;
    if (rs) rs.textContent = (a.reasons || []).join(" • ") || "No specific risks.";
    if (aiCard) aiCard.style.borderColor = a.color || "var(--line)";
  };

  try {
    // Try real backend first
    const res = await fetch(`${API_BASE}/api/patient/${pid}/analyze`, { mode: "cors" });
    if (!res.ok) throw new Error("analyze failed");
    const a = await res.json();
    // Pick a border color by level
    const color = a.level === "Stable" ? "#3a873a" : a.level === "Watch" ? "#e6a700" : "#d11a2d";
    render({ ...a, color });
    if (moodSel && a.mood) moodSel.value = a.mood;
  } catch (e) {
    // Fallback to our hardcoded “AI”
    const a = mockAI(pid);
    render(a);
  }
}

// Boot the shell sidebar
document.addEventListener("DOMContentLoaded", () => {
  buildPatientList();
});
