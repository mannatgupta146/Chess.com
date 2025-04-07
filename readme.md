# ♟️ Chess.com Clone

A real-time multiplayer Chess game inspired by Chess.com. Built using **Node.js**, **Socket.IO**, **Express**, and **chess.js**, with a clean **Tailwind CSS** UI.

## 🚀 Live Demo

Check it out on Render:  
👉 [https://chess-com.onrender.com](https://chess-com-phga.onrender.com) 

---

## 📸 Preview

![Chess.com Clone Screenshot](screenshot.png) 

---

## 🛠 Tech Stack

- **Frontend**: HTML, Tailwind CSS, JavaScript
- **Backend**: Node.js, Express.js, Socket.IO
- **Game Logic**: chess.js

---

## 🔧 Features

- 🔁 Real-time multiplayer chess with two players
- ♟️ Valid chess rules and legal moves
- 🔄 Board flips for black player
- 📡 Instant updates using WebSockets (Socket.IO)
- ✅ Simple UI with drag-and-drop support

---

## 📦 Installation

### 1. Clone the repository
git clone https://github.com/mannatgupta146/Chess.com.git

### 2. Navigate into the project directory
cd Chess.com

### 3. Install dependencies
npm install


## 🔄 Run Locally
### Start the development server
npm run dev
Once the server is running, open your browser and visit:

👉 http://localhost:3000

## 🚢 Deployment (Render)
1. Create a new Web Service on Render
2. Set:
- Build Command: npm install
- Start Command: node app.js
3. Auto-deploy from main branch

## 📁 Project Structure
Chess.com/
├── public/
│   └── js/
│       └── chessGame.js   # Client-side logic
├── views/
│   └── index.ejs          # Game UI template
├── app.js                 # Main server file
├── package.json
└── README.md

## ✨ Future Improvements
- ✅ Display move history
- 💬 In-game chat feature
- 🎉 Sound effects on move
- 🔐 User authentication
- 🧠 AI bot for single-player mode