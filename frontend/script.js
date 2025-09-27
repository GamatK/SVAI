// If backend is not running yet, the UI still works with demo data.
const API_BASE = "http://localhost:5000";

const $  = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);

// Tabs
$$(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll("main .card").forEach(sec => sec.classList.remove("show"));
    document.querySelector(btn.dataset.target).classList.add("show");
  });
});

// CivicBot
$("#askBtn").addEventListener("click", async () => {
  const topic = $("#topic").value.trim();
  if (!topic) return toast("#civicStatus", "Type a topic, e.g. birth certificate");

  btnLoading("#askBtn", true);
  toast("#civicStatus", "Loading…");
  try {
    const res = await fetch(`${API_BASE}/api/steps?topic=${encodeURIComponent(topic)}`, {mode:"cors"});
    if (!res.ok) throw new Error("Bad response");
    const data = await res.json();
    renderSteps(data.steps);
    toast("#civicStatus", "Ready");
  } catch (e) {
    // fallback demo data if backend not ready
    renderSteps(demoSteps(topic));
    toast("#civicStatus", "Backend not reachable — showing demo data.", false, true);
  } finally {
    btnLoading("#askBtn", false);
  }
});

function renderSteps(steps){
  $("#steps").innerHTML = steps.map(s => `<li>${s}</li>`).join("");
}

function demoSteps(topic){
  const t = topic.toLowerCase();
  if (t.includes("birth")) return [
    "Open eGov portal", "Fill applicant form", "Upload ID scan", "Pay fee", "Track status"
  ];
  if (t.includes("marriage")) return [
    "Schedule appointment", "Bring IDs & witnesses", "Sign registry", "Get digital copy"
  ];
  return ["Demo: No steps found. Try “birth certificate” or “marriage certificate”."]; 
}

// Emergency Wallet
$("#walletBtn").addEventListener("click", async () => {
  btnLoading("#walletBtn", true);
  try {
    const res = await fetch(`${API_BASE}/api/emergency`, {mode:"cors"});
    if (!res.ok) throw new Error("Bad response");
    const data = await res.json();
    fillWallet(data.name, data.id, data.ice);
  } catch (e) {
    // demo data
    fillWallet("Demo User", "AZ-ABC-123456", "+1 480 555 1212");
  } finally {
    btnLoading("#walletBtn", false);
  }
});

function fillWallet(name, id, ice){
  $("#wName").textContent = name;
  $("#wId").textContent = id;
  $("#wIce").textContent = ice;
  $("#walletBox").classList.remove("hidden");
  // Simple placeholder “QR” (ASCII) — real QR comes later from backend or a lib
  $("#qrBox").textContent = "■ □ ■\n□ ■ □\n■ □ ■";
}

// helpers
function toast(sel, msg, ok=true, warn=false){
  const el = $(sel);
  el.textContent = msg;
  el.classList.toggle("error", !ok || warn);
}
function btnLoading(sel, on){
  const b = $(sel);
  b.disabled = on;
  if (on){ b.dataset.label = b.textContent; b.textContent = "Loading…"; }
  else   { b.textContent = b.dataset.label || "Done"; }
}
