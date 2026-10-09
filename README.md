<div align="center">
  <img src="resized-logo.png" alt="Chaos2Calm Logo" width="120" />
  <h1>Chaos2Calm</h1>
  <p><strong>Turning urban chaos into calm</strong></p>

  <p>
    <a href="https://developer.mozilla.org/en-US/docs/Web/HTML"><img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" /></a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/CSS"><img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" /></a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" /></a>
    <a href="https://leafletjs.com/"><img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white" alt="Leaflet" /></a>
    <a href="https://www.openstreetmap.org/"><img src="https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=OpenStreetMap&logoColor=white" alt="OpenStreetMap" /></a>
    <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
  </p>
</div>

---

🌐 **Live Demo:** [https://chaos2calm.vercel.app/](https://chaos2calm.vercel.app/) &nbsp;|&nbsp; 💻 **Repo:** [https://github.com/Yashhsurve/Chaos2Calm](https://github.com/Yashhsurve/Chaos2Calm)

---

## 🎯 Problem
City life information is fragmented and overwhelming. Finding reliable tourist spots, checking neighborhood safety, tracking traffic bottlenecks, and getting weather updates typically requires juggling multiple disconnected apps.

## 💡 Solution
**Chaos2Calm** is a unified interactive city exploration platform for the **Pune Metropolitan Region** (Pune, Pimpri-Chinchwad, Talegaon, and Lonavala). It consolidates real-world places, live weather, safety layers, and crowd-sourced alerts into a single calm, intuitive map interface.

## ✨ Features
- 🗺️ **Interactive PMR Map:** Color-coded pins for Food, History & Culture, Hospitality, and Parks/Attractions across Pune, PCMC, Talegaon, and Lonavala.
- 🔍 **Multi-Dimensional Filters:** Filter places instantly by region, category, budget, and minimum safety score with live text search.
- ⚠️ **Overlay Layers:** Toggleable visual layers for unsafe zones and traffic jam areas.
- 📢 **Citizen Incident Reporting:** Report safety concerns, traffic jams, and road hazards with map pinpointing, saved locally in the browser.
- 📊 **City Insights Dashboard:** Neighborhood comparison tool ranking areas across Safety, Cleanliness, and Affordability.
- ⚡ **Live Weather & Alerts:** Real-time temperature, wind speed, weather conditions, and automatic safety advisories powered by Open-Meteo.
- 📱 **Responsive Design:** Premium dark-mode glassmorphic interface tailored for both desktop and mobile devices.

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla ES6+) |
| **Map** | Leaflet.js + OpenStreetMap |
| **Weather** | Open-Meteo API |
| **Data** | JSON (`data.json`) & LocalStorage |
| **Hosting** | Vercel |
| **Built with** | Google Antigravity |

## 📸 Screenshots

Add screenshots here
<!-- ![Chaos2Calm Map View](screenshots/map-view.png) -->
<!-- ![City Insights View](screenshots/insights-view.png) -->
<!-- ![Citizen Reports](screenshots/reports-view.png) -->

## 🚀 Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Yashhsurve/Chaos2Calm.git
   ```

2. **Open the project folder:**
   ```bash
   cd Chaos2Calm
   ```

3. **Run a simple local server:**
   ```bash
   npx serve .
   # or
   python -m http.server 8080
   ```
   Open `http://localhost:8080` (or the URL shown in your terminal) in your browser.

## ⚠️ Note
Scores for safety, cleanliness, and affordability are demo data for this MVP, not verified real-world data.

## 🔮 Future Scope
- 🤖 **AI-Powered Recommendations:** Smart personalized itineraries based on user preferences and live city conditions.
- 🛡️ **Safer Route Suggestions:** Navigation suggestions prioritizing well-lit and high-safety corridors.
- 🚦 **Real-Time Traffic & Crime Data:** Live integration with municipal traffic sensors and verified open safety feeds.
- 📸 **Photo & Voice Reports:** Allow citizens to attach photos and voice notes to incident reports.

## 👨‍💻 Built by Yash Surve

Built by **Yash Surve** (GitHub: [@Yashhsurve](https://github.com/Yashhsurve)) for **PromptWars x BRAIN DYPCOEI**.
