# SVAI: Safe Vitals AI

A hackathon web app that puts three health and civic tools in one place: a step-by-step guide for government paperwork, an emergency medical card, and a doctor's dashboard that watches patient vitals and raises alerts.

Built at **Sunhacks 2025** (Arizona State University's student hackathon), where it placed **2nd in the Healthcare category**.

## Features

**CivicBot**: ask how to get a document and get a short checklist. Currently covers birth certificates, marriage certificates and ID cards.

**Emergency Wallet**: a personal emergency profile (name, ID, emergency contact, medical notes) that can be edited and saved, turned into a QR code, printed as a card, or downloaded as an image.

**Doctor Dashboard**: a patient list with status and risk levels, plus per-patient pages with:
- charts of heart rate, SpO₂, blood pressure, respiratory rate and temperature over 48 hours
- automatic alerts for low SpO₂ (below 92), tachycardia (heart rate above 110), fever (38.0 °C or higher) and high systolic blood pressure (160 or higher)
- a risk summary, and clinician notes saved per patient

## Built with

| Part | Tech |
| --- | --- |
| `backend/` | Python, Flask, Flask-CORS, `qrcode` |
| `frontend/` | HTML, CSS, JavaScript, Chart.js, html2canvas |

## Run it locally

You need Python 3.

```bash
# 1. Start the backend (http://127.0.0.1:5000)
cd backend
python3 -m venv .venv
source .venv/bin/activate        # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open `frontend/index.html` in a browser (in a second terminal you can also run `python3 -m http.server 8000` inside `frontend/` and visit http://localhost:8000). The frontend expects the backend at `http://127.0.0.1:5000`.

## Notes

- This is a hackathon prototype. **All patient data and vitals are simulated** (generated on the server), and it is not a medical device or medical advice.
- Data is saved to a local `backend/data.json` file; there is no database or login.

## Team

Built by Gamat Karimli and teammates. See the [Contributors](https://github.com/GamatK/SVAI/graphs/contributors) page.

## Author

Gamat Karimli: [gamatkarimli.com](https://gamatkarimli.com)
