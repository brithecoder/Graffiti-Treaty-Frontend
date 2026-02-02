# 🎨 Graffiti Treaty Mural Engine | Frontend

A dynamic, real-time collaborative graffiti application. This frontend is built with React and Vite, utilizing high-performance canvas rendering and WebSocket synchronization to allow multiple artists to tag a shared wall simultaneously.

## 🚀 Key Features

* **Real-time Collaborative Canvas:** High-frequency stroke rendering using Socket.io.
* **Synchronized Mission Ticker:** A server-authoritative countdown timer that keeps all clients in perfect sync.
* **Spectator Mode:** Automatic reconciliation for late joiners, allowing them to view live progress without interrupting active sessions.
* **Role-Based UI:** Distinct interfaces for Session Admins (Lobby controls) and Artists (Toolbelt/Canvas).
* **Dynamic Reveal:** An automated transition to a global "Masterpiece Reveal" once the mission timer hits zero.

---

## 🛠 Tech Stack

* **Framework:** React 18 (Vite)
* **State Management:** React Context API (Auth) & Hooks (`useState`, `useEffect`, `useRef`)
* **Real-time Communication:** Socket.io-client
* **Routing:** React Router DOM
* **Styling:** Tailwind CSS (for high-speed, responsive UI)
* **Audio:** HTML5 Audio API for immersive SFX (spray can rattling)

---

## 🏗 Component Architecture

### Core Components
* **`MuralCanvas.jsx`**: The primary engine. Manages socket listeners, timer logic, and spectator overlays.
* **`Toolbelt.jsx`**: Custom UI for color selection, brush sizing, and tool switching (Eraser/Cap types).
* **`SessionHUD.jsx`**: Heads-Up Display showing the live timer, artist count, and wall metadata.
* **`AdminOverlay.jsx`**: The pre-mission lobby interface where the host initiates the connection.
* **`MuralReveal.jsx`**: A post-session gallery view that fetches and displays the final state of the wall.

### Custom Hooks
* **`useMuralEngine.js`**: Abstracts the complex Canvas 2D API logic, handling drawing coordinates and stroke interpolation.

---

## 🔄 Real-Time Synchronization Logic

The frontend follows a **"Listen-First"** architecture:
1.  **Mount:** Component registers socket listeners (`mission_start_confirmed`, `already_started`).
2.  **Join:** Component emits `join_wall` with the user's credentials.
3.  **Sync:** If a mission is active, the server pushes a `finishAt` timestamp; the client then calculates the local remaining time relative to the server's clock to prevent drift.

---

## ⚙️ Setup & Installation

**1. Clone and Install:**
```bash
git clone [your-repo-link]
cd treaty-frontend
npm install
```
**2. Environment Configuration: Create a .env file in the root:**

```Code snippet
VITE_SOCKET_URL=http://localhost:3000
```
**3. Run Development Server:**

```Bash
npm run dev
```

# 📱 Responsive Design
The UI is optimized for a "Mobile-First" approach:

Desktop: Full-screen canvas with side-aligned toolbelts.

Tablet/Mobile: Bottom-docked toolbelts and scaled aspect-ratio containers to ensure the canvas remains interactive on smaller touch devices.

