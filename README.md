📡 Live Attendance System (WebSockets + React)

A real-time attendance system built using WebSockets, TypeScript, and React.
This project demonstrates how real-time communication works between backend and frontend without using Socket.io.

🎯 Built as part of backend learning to understand WebSockets, JWT auth, in-memory state, and real-time events.


🚀 Features

🔗 Real-time communication using WebSockets (ws)

👨‍🏫 Teacher can mark attendance live

👨‍🎓 Students can view their attendance instantly

🧠 In-memory active session handling

📤 Broadcast & unicast messaging

⚛️ Simple React frontend to test WebSocket events

🧩 Clean separation of frontend & backend


project-root/
│
├── backend/
│   ├── src/
│   │   └── index.ts        # WebSocket + HTTP server
│   ├── tsconfig.json
│   ├── package.json
│
├── frontend/
│   ├── src/
│   │   └── App.jsx         # React WebSocket client(future)
│   ├── vite.config.js
│   ├── package.json
│
└── README.md

🧠 Tech Stack
* Backend
* Node.js
* TypeScript
* WebSockets (ws)
*HTTP Server
*Native Browser WebSocket API
