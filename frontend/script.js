// ================== CONFIG & HELPERS ==================
const API_BASE = "http://127.0.0.1:5000";

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

// ================== CIVICBOT ==================
$("#askBtn")?.addEventListener("click", async () => {
  const topic = $("#topic")?.value.trim();
  if (!topic) return toast("#civicStatus", "Type a topic, e.g. birth certificate", false);

  btnLoading("#askBtn", true);
  toast("#civicStatus", "Loading…");
  try {
    const res = await fetch(`${API_BASE}/api/steps?topic=${encodeURIComponent(topic)}`, { mode: "cors" });
    const data = await res.json();
    renderSteps(data.steps || []);
    toast("#civicStatus", "Ready");
  } catch {
    renderSteps(demoSteps(topic));
    toast("#civicStatus", "Backend not reachable — showing demo data.", false);
  } finally {
    btnLoading("#askBtn", false);
  }
});

function renderSteps(steps) {
  $("#steps").innerHTML = steps.map(s => `<li>${s}</li>`).join("");
}
function demoSteps(topic) {
  const t = (topic || "").toLowerCase();
  if (t.includes("birth"))    return ["Open eGov portal", "Fill applicant form", "Upload ID scan", "Pay fee", "Track status"];
  if (t.includes("marriage")) return ["Schedule appointment", "Bring IDs & witnesses", "Sign registry", "Get digital copy"];
  if (t.includes("id"))       return ["Submit online request", "Photo & fingerprint at office", "Pay fee", "Pickup or mail"];
  return ["Demo: No steps found. Try “birth certificate” or “marriage certificate”."];
}

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
    // clear inputs
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
  if (!card) return;
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
  // Small charts: container controls height; we disable aspect ratio
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
  // Initial Civic demo list rendering
  renderSteps(demoSteps("birth certificate"));

  // Dashboard boot
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
