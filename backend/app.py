from flask import Flask, jsonify, request
from flask_cors import CORS
import io, base64, os, json
from datetime import datetime, timedelta
import random

# ---------- Optional QR support ----------
try:
    import qrcode
    QR_ENABLED = True
except Exception:
    QR_ENABLED = False

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["*", "http://localhost:*", "file://*"]}})

DATA_FILE = "data.json"

# ==========================
# Persistence helpers
# ==========================
def _now_iso():
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"

def load_store():
    if not os.path.exists(DATA_FILE):
        store = {
            "emergency_profile": {
                "name": "Demo User",
                "id": "AZ-ABC-123456",
                "ice": "+1 480 555 1212",
                "medical_notes": "No known allergies. Blood type O+.",
                "updated_at": _now_iso(),
            },
            "patients": [
                {"id": "p001", "name": "Amina E.", "age": 64, "bed": "3B-12", "mrn": "MRN-1001", "status": "Stable",   "risk": 12},
                {"id": "p002", "name": "Rahim K.", "age": 72, "bed": "4A-03", "mrn": "MRN-1002", "status": "Watch",    "risk": 38},
                {"id": "p003", "name": "Leyla S.", "age": 58, "bed": "2C-07", "mrn": "MRN-1003", "status": "Critical", "risk": 72},
            ],
            "notes": {"p001": [], "p002": [], "p003": []},
        }
        save_store(store)
        return store
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_store(store):
    tmp = DATA_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(store, f, ensure_ascii=False, indent=2)
    os.replace(tmp, DATA_FILE)

STORE = load_store()

# ==========================
# CivicBot demo DB
# ==========================
STEP_DB = {
    "birth_certificate": [
        "Open eGov portal",
        "Fill applicant form",
        "Upload ID scan",
        "Pay fee",
        "Track status in dashboard",
    ],
    "marriage_certificate": [
        "Schedule appointment",
        "Bring IDs & witnesses",
        "Sign registry",
        "Receive digital copy",
    ],
    "id_card": [
        "Submit online request",
        "Photo & fingerprint at office",
        "Pay fee",
        "Pickup or receive by mail",
    ],
}

# ==========================
# Mock vitals generator
# ==========================
def gen_series(hours=48, step_min=30, seed=0):
    rnd = random.Random(seed or int(datetime.now().timestamp()))
    points = max(2, int(hours * 60 / step_min))
    start = datetime.now() - timedelta(hours=hours)

    ts, hr, spo2, rr, temp, bp_sys, bp_dia = [], [], [], [], [], [], []

    base_hr   = rnd.randint(68, 78)
    base_spo2 = rnd.randint(94, 97)
    base_rr   = rnd.randint(14, 18)
    base_temp = 36.8 + rnd.random() * 0.4
    base_sys  = rnd.randint(110, 125)
    base_dia  = rnd.randint(70, 82)

    for i in range(points):
        t = start + timedelta(minutes=i * step_min)
        ts.append(t.isoformat(timespec="minutes"))

        hr.append(max(40,  min(150, int(rnd.gauss(base_hr,   4)))))
        spo2.append(max(85, min(100, int(rnd.gauss(base_spo2, 1.2)))))
        rr.append(max(6,   min(40,  int(rnd.gauss(base_rr,   2)))))
        temp.append(round(max(34.0, min(41.0, rnd.gauss(base_temp, 0.15))), 1))

        sys = max(80,  min(200, int(rnd.gauss(base_sys, 6))))
        dia = max(40,  min(120, int(rnd.gauss(base_dia, 5))))
        if dia > sys - 20:
            dia = sys - 20 if sys - 20 > 40 else 40
        bp_sys.append(sys)
        bp_dia.append(dia)

    return {
        "timestamps": ts,
        "hr": hr,
        "spo2": spo2,
        "rr": rr,
        "temp": temp,
        "bp_sys": bp_sys,
        "bp_dia": bp_dia,
        "last_updated": ts[-1] if ts else None,
    }

def summarize_24h(series):
    if not series["timestamps"]:
        return {"latest": {}, "range24h": {}, "deltas": {}}

    cut = max(1, int(len(series["timestamps"]) * 24 / 48))
    idx = -cut

    def rng(arr):
        window = arr[idx:]
        return {"min": min(window), "max": max(window)}

    latest = {k: v[-1] for k, v in series.items() if k not in ("timestamps", "last_updated")}

    deltas = {
        "hr":      latest["hr"]      - series["hr"][idx],
        "spo2":    latest["spo2"]    - series["spo2"][idx],
        "bp_sys":  latest["bp_sys"]  - series["bp_sys"][idx],
        "bp_dia":  latest["bp_dia"]  - series["bp_dia"][idx],
        "rr":      latest["rr"]      - series["rr"][idx],
        "temp":    round(latest["temp"] - series["temp"][idx], 1),
    }

    return {
        "latest": latest,
        "range24h": {
            "hr": rng(series["hr"]),
            "spo2": rng(series["spo2"]),
            "bp_sys": rng(series["bp_sys"]),
            "bp_dia": rng(series["bp_dia"]),
            "rr": rng(series["rr"]),
            "temp": rng(series["temp"]),
        },
        "deltas": deltas,
    }

# ==========================
# Health/version
# ==========================
@app.get("/api/ping")
def ping():
    return jsonify({"ok": True, "version": "1.1.0", "time": _now_iso()})

# ==========================
# CivicBot
# ==========================
@app.get("/api/steps")
def steps():
    topic_raw = (request.args.get("topic") or "").strip()
    key = topic_raw.lower().replace(" ", "_")
    steps = STEP_DB.get(key)
    if not steps:
        for k in STEP_DB:
            if all(word in k for word in key.split("_") if word):
                steps = STEP_DB[k]
                break
    if not steps:
        steps = ["Sorry, no steps found for this topic yet."]
    return jsonify({"topic": topic_raw, "steps": steps})

# ==========================
# Emergency Wallet (persisted)
# ==========================
@app.get("/api/emergency")
def emergency():
    ep = STORE["emergency_profile"]
    return jsonify({
        "name": ep.get("name", ""),
        "id": ep.get("id", ""),
        "ice": ep.get("ice", ""),
        "medical_notes": ep.get("medical_notes", ""),
        "updated_at": ep.get("updated_at"),
    })

@app.post("/api/emergency")
def update_emergency():
    data = request.get_json(force=True, silent=True) or {}
    ep = STORE["emergency_profile"]
    for k in ["name", "id", "ice", "medical_notes"]:
        if k in data and isinstance(data[k], str):
            ep[k] = data[k]
    ep["updated_at"] = _now_iso()
    STORE["emergency_profile"] = ep
    save_store(STORE)
    return jsonify({"ok": True, "profile": ep})

@app.get("/api/qr")
def qr():
    if not QR_ENABLED:
        return jsonify({"error": "QR not enabled on server (pip install qrcode[pil])"}), 501
    text = (request.args.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Missing ?text="}), 400
    img = qrcode.make(text)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return jsonify({"data_url": f"data:image/png;base64,{b64}"})

# ==========================
# Doctor Dashboard APIs
# ==========================
@app.get("/api/patients")
def patients():
    return jsonify({"patients": STORE.get("patients", [])})

@app.post("/api/patients")
def add_patient():
    data = request.get_json(force=True, silent=True) or {}
    name = (data.get("name") or "").strip()
    bed  = (data.get("bed") or "").strip()
    if not name or not bed:
        return jsonify({"error": "name and bed are required"}), 400
    pid = "p" + format(abs(hash(name + bed + _now_iso())) % 10**6, "06d")
    newp = {
        "id": pid,
        "name": name,
        "age": int(data.get("age") or 0) or None,
        "bed": bed,
        "mrn": data.get("mrn") or f"MRN-{random.randint(1000,9999)}",
        "status": data.get("status") or "Stable",
        "risk": int(data.get("risk") or 10),
    }
    STORE["patients"].append(newp)
    STORE["notes"].setdefault(pid, [])
    save_store(STORE)
    return jsonify({"ok": True, "patient": newp}), 201

@app.get("/api/patient/<pid>/notes")
def get_notes(pid):
    notes = STORE.get("notes", {}).get(pid, [])
    return jsonify({"notes": notes})

@app.post("/api/patient/<pid>/notes")
def add_note(pid):
    data = request.get_json(force=True, silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text required"}), 400
    note = {"text": text, "author": (data.get("author") or "system").strip(), "ts": _now_iso()}
    STORE.setdefault("notes", {}).setdefault(pid, []).append(note)
    save_store(STORE)
    return jsonify({"ok": True, "note": note}), 201

@app.get("/api/patient/<pid>/vitals")
def patient_vitals(pid):
    hours = int(request.args.get("hours", 48))
    seed = sum(bytearray(pid.encode()))
    s = gen_series(hours=hours, step_min=30, seed=seed)
    return jsonify(s)

@app.get("/api/patient/<pid>/summary")
def patient_summary(pid):
    seed = sum(bytearray(pid.encode()))
    s = gen_series(hours=48, step_min=30, seed=seed)
    summ = summarize_24h(s)

    alerts = []
    if summ["latest"].get("spo2", 100) < 92:
        alerts.append("Low SpO₂")
    if summ["latest"].get("hr", 0) > 110:
        alerts.append("Tachycardia")
    if summ["latest"].get("temp", 0) >= 38.0:
        alerts.append("Fever")
    if summ["latest"].get("bp_sys", 0) >= 160:
        alerts.append("Hypertension")

    return jsonify({"summary": summ, "alerts": alerts, "last_updated": s.get("last_updated")})

# ---------- Run ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
