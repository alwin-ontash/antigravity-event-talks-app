# 📢 BigQuery Release Notes Hub

A modern, responsive, and glassmorphic web application built with **Python Flask** and **Vanilla Web Tech** (HTML5, CSS3, JavaScript ES6) that fetches live BigQuery release notes and makes them easy to read, filter, and share to X (formerly Twitter).

---

## ✨ Features

- **🔄 Live Atom Feed Syncing**: Fetches release notes directly from the official Google Cloud BigQuery RSS/Atom feed.
- **✨ Premium Dark Mode UI**: Beautiful glassmorphic workspace aesthetic with smooth transitions and subtle glow animations.
- **⚡ Micro-Announcements Extraction**: Automatically parses complex daily release HTML content into individual, highlighted, selectable blocks.
- **🐦 Direct X (Twitter) Composer**: Integrates with X's Web Intent to draft, trim (ensuring the 280-character limit), copy, and post updates directly.
- **🔍 Real-time Search**: Search and filter updates instantly as you type.
- **📱 Responsive Layout**: Seamless experience across Desktop, Tablet, and Mobile screens.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Variables, Shimmer animations, Flexbox/Grid), Vanilla JavaScript (ES6, DOMParser, Async/Fetch API)
- **Feeds**: Google Cloud BigQuery Atom XML Feed

---

## 🚀 Getting Started

### Prerequisites

- Python 3.x installed
- Git installed

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/alwin-ontash/antigravity-event-talks-app.git
   cd antigravity-event-talks-app
   ```

2. **Install dependencies** (Flask):
   ```bash
   pip install Flask
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. Open your browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.

---

## 📂 Project Directory Structure

```text
antigravity-event-talks-app/
├── templates/
│   └── index.html        # Main template structure
├── static/
│   ├── css/
│   │   └── style.css     # Styling, layouts, custom themes & animations
│   └── js/
│       └── main.js       # App logic, XML/HTML parsing, X-composer Integration
├── app.py                # Flask Server & API endpoint
├── palindrome.py         # Sandbox Palindrome checking script
├── .gitignore            # Git exclusion files
└── README.md             # Project documentation
```

---

> [!NOTE]
> This application communicates dynamically with the Google Cloud feed endpoint `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml` to display real-time release details.
