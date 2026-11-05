# ◉ StreamVerse — Futuristic Cinematic Stream & Discovery Hub

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-Backend-blue.svg)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-orange.svg)](https://deepmind.google/technologies/gemini/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-informational.svg)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**StreamVerse** is a modern, Apple TV / Arc-inspired cinematic discovery and streaming platform. Powered by TMDB metadata, a distributed network of streaming uplink gateway nodes, and futuristic AI recommendation engines, StreamVerse delivers an immersive, ad-conscious interface for movies, TV series, anime, and K-dramas.

---

## 🚀 Key Features

- **Cinematic Discovery Rails:** Dynamic hero spotlights, trending rails, top-rated lists, and genre filters powered by TMDB and local behavior tracking.
- **Distributed Uplink Gateways:** Multi-source streaming architecture supporting multiple gateway providers (`2embed`, `multiembed`, `videasy`, `vidcore`, `streamimdb`, `vidApi`, and `vidKing`).
- **Real-Time Gateway Health Monitoring:** Automated DNS resolution checks and HTTP HEAD latency pings to identify offline gateways or ISP-level blockades, routing viewers to healthy nodes.
- **Cinematic AI Intelligence:** Futuristic sci-fi summaries and node routing recommendations powered by Google Gemini (`gemini-2.5-flash`), with automatic fallback to OpenRouter (`meta-llama/llama-3.3-70b-instruct`).
- **Natural Language Mood Search:** Natural language mood discovery (e.g. *"moody cyberpunk thriller"*, *"feel-good romantic comedy"*) mapped to matching titles and live TMDB posters.
- **Comprehensive TV Episode Engine:** Full season and episode selector with localized watching progress and resume-playback memory.
- **Anonymous Device Watchlist:** Persistent personal list powered by Prisma and SQLite with seamless in-memory fallback.
- **Phase 2 Modular Design System:** Tokenized design architecture (`tokens.css`), lifecycle mixins (`Accessibility`, `ComponentLifecycle`, `Events`), and automated component build pipelines.

---

## 📂 Repository Structure

```text
Streamverse/
├── config/
│   └── icons.config.js               # Icon registry configuration
├── prisma/
│   └── schema.prisma                 # Prisma schema for AnonymousUser and WatchItem
├── public/                           # Active client application & engines
│   ├── index.html                    # Single Page Application entrypoint
│   ├── style.css                     # Custom glassmorphic cinematic styles
│   ├── app.js                        # App routing, modal controller & player HUD
│   ├── homeEngine.js                 # Carousel discovery & behavior tracker
│   ├── episodeEngine.js              # Season/episode loader & progress tracker
│   └── providers/                    # Streaming provider adapters & player manager
│       ├── playerManager.js
│       ├── multiembed.js
│       ├── videasy.js
│       ├── vidcore.js
│       ├── twoEmbed.js
│       ├── vidApi.js
│       └── vidKing.js
├── scripts/                          # Component pipeline & build automation
│   ├── build-components.js           # Master component build pipeline
│   ├── generate-component-manifest.js# Auto-generates component manifest
│   ├── generate-components-css.js    # Aggregates component stylesheets
│   ├── generate-docs.js              # Markdown documentation generator
│   ├── generate-icon-registry.js     # Compiles Lucide icon registry
│   └── validate-components.js        # Strict component contract validator
├── src/                              # Phase 2 Component Framework & Core
│   ├── assets/css/                   # Design tokens, reset, utilities
│   ├── components/                   # Base mixins, shared primitives, registry
│   │   ├── _base/                    # Component, Accessibility, Events, Lifecycle
│   │   ├── _shared/                  # Elevation, spacing, variants, animations
│   │   ├── manifest.js
│   │   └── registry.js
│   ├── config/                       # App, navigation, and theme configurations
│   ├── core/                         # Router, state store, keyboard, logger
│   └── ui/                           # Layout layer manager
├── templates/                        # Component scaffolding templates
├── build.config.json                 # Build pipeline configuration
├── server.js                         # Express backend API & AI services
├── test-api.js                       # Comprehensive automated API test suite
└── package.json
```

---

## 🛠️ API Endpoints

The Express backend (`server.js`) exposes the following endpoints:

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/gateways-health` | `POST` | Probes health status and latency for provider domains |
| `/api/resolve-link` | `POST` | Resolves direct embed or search URLs across streaming nodes |
| `/api/stream-ai` | `POST` | Generates sci-fi title analyses and routing tips via Gemini AI |
| `/api/mood-recommend` | `POST` | AI-driven mood recommendations enriched with TMDB metadata |
| `/api/imdb-rating/:imdbId` | `GET` | Fetches and caches IMDb ratings via Gemini |
| `/api/watchlist` | `GET/POST/DELETE` | Device-specific watchlist management |

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js** v18 or later
- **npm** v9 or later

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Samala-Hari-prasad/streamverse.git
cd streamverse
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
TMDB_API_KEY=your_tmdb_api_key_here
DATABASE_URL="file:./dev.db"
```

### 4. Running the Application
Start the backend server:
```bash
node server.js
```
The application will be live at `http://localhost:3000`.

### 5. Running API Tests
Execute the integration test suite:
```bash
node test-api.js
```

---

## 📄 License

This project is licensed under the MIT License.

