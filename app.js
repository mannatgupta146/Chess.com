const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();
let players = {}; // { white: socketId, black: socketId }

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", (socket) => {
    console.log("✅ Connected:", socket.id);

    if (Object.keys(players).length === 0) chess.reset();

    // 🔹 Assign roles to players
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "W");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "B");
    } else {
        socket.emit("playerRole", "Spectator");
    }

    // 🔹 Send current board state
    socket.emit("boardState", chess.fen());
    console.log("👥 Current players:", players);

    // 🔹 Handle disconnection
    socket.on("disconnect", () => {
        console.log("🔴 Disconnected:", socket.id);

        if (socket.id === players.white) {
            delete players.white;
            assignNextPlayer("white");
        } else if (socket.id === players.black) {
            delete players.black;
            assignNextPlayer("black");
        }

        console.log("👥 Updated players:", players);
    });

    // 🔹 Handle player move
    socket.on("move", (move) => {
        try {
            console.log(`♟️ Move received from ${socket.id}:`, move);

            const isWhitePlayer = socket.id === players.white;
            const isBlackPlayer = socket.id === players.black;

            if (!isWhitePlayer && !isBlackPlayer) {
                return socket.emit("invalidMove", "Spectators cannot make moves.");
            }

            // 🔸 Check turn validity
            if ((chess.turn() === 'w' && !isWhitePlayer) ||
                (chess.turn() === 'b' && !isBlackPlayer)) {
                return socket.emit("invalidMove", "Not your turn.");
            }

            // 🔸 Remove unnecessary promotion unless it's a pawn reaching last rank
            const promotionSquares = [
                "a8","b8","c8","d8","e8","f8","g8","h8",
                "a1","b1","c1","d1","e1","f1","g1","h1"
            ];
            if (!promotionSquares.includes(move.to)) {
                delete move.promotion;
            }

            // 🔸 Validate and apply move
            const result = chess.move(move);
            if (!result) {
                console.log("❌ Invalid move attempted:", move);
                return socket.emit("invalidMove", "Invalid move.");
            }

            // 🔸 Broadcast updated board
            io.emit("boardState", chess.fen());

            // 🔸 Game end checks
            if (chess.isGameOver()) {
                const message = chess.isCheckmate()
                    ? `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`
                    : "Game drawn!";
                io.emit("gameOver", message);
                chess.reset();
            }

        } catch (err) {
            console.error("❗ Move processing error:", err.message);
            socket.emit("invalidMove", "Move processing error.");
        }
    });
});

// 🔹 Assign next waiting client to vacant color
const assignNextPlayer = (color) => {
    const available = Array.from(io.sockets.sockets.keys())
        .filter(id => !Object.values(players).includes(id));

    if (available.length > 0) {
        const newPlayer = available[0];
        players[color] = newPlayer;
        io.to(newPlayer).emit("playerRole", color === "white" ? "W" : "B");
        io.to(newPlayer).emit("boardState", chess.fen());
        console.log(`🔄 Reassigned ${color} to ${newPlayer}`);
    }
};

server.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
