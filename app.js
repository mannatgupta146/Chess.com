const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();
let players = {}; // Stores player IDs

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    // Reset players if both disconnected
    if (Object.keys(players).length === 0) chess.reset();

    // Assign roles
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "W");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "B");
    } else {
        socket.emit("playerRole", "Spectator");
    }

    // Send board state
    socket.emit("boardState", chess.fen());
    console.log("Current players:", players);

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
        
        // Handle player leaving
        if (socket.id === players.white) {
            delete players.white;
            assignNextPlayer("white");
        } else if (socket.id === players.black) {
            delete players.black;
            assignNextPlayer("black");
        }
        
        console.log("Updated players:", players);
    });

    socket.on("move", (move) => {
        try {
            console.log(`Move received from ${socket.id}:`, move);

            // Validate player
            const isWhitePlayer = socket.id === players.white;
            const isBlackPlayer = socket.id === players.black;

            if (!isWhitePlayer && !isBlackPlayer) {
                return socket.emit("invalidMove", "Spectators cannot move");
            }

            // Check turn
            if ((chess.turn() === 'w' && socket.id !== players.white) || 
            (chess.turn() === 'b' && socket.id !== players.black)) {
            return socket.emit("invalidMove", "Not your turn");
        }



            // Validate move format
            const handleMove = (from, to) => {
                if (!from || !to) return;
            
                // 🔸 Ensure it's the player's turn (server will validate)
                if ((chess.turn() === "w" && playerRole !== "W") ||
                    (chess.turn() === "b" && playerRole !== "B")) {
                    return;
                }
            
                const move = { from, to, promotion: 'q' };
                socket.emit('move', move); // Let server handle validation
            };

            // Remove unnecessary promotion field if not needed
            if (!["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8", 
                  "a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"].includes(move.to)) {
                delete move.promotion;
            }

            // Attempt move
            const result = chess.move(move);
            if (!result) {
                console.log("Invalid move attempted:", move);
                return socket.emit("invalidMove", "Invalid move: " + JSON.stringify(move));
            }

            // Broadcast board update
            io.emit("boardState", chess.fen());

            // Check game status
            if (chess.isGameOver()) {
                const message = chess.isCheckmate()
                    ? `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`
                    : "Game drawn!";
                io.emit("gameOver", message);
                chess.reset();
            }
        } catch (err) {
            console.error("Move error:", err);
            socket.emit("invalidMove", "Error processing move: " + err.message);
        }
    });
});

// Assigns next available player
const assignNextPlayer = (color) => {
    const available = Array.from(io.sockets.sockets.keys())
        .filter(id => !Object.values(players).includes(id));

    if (available.length > 0) {
        const newPlayer = available[0];
        players[color] = newPlayer;
        io.to(newPlayer).emit("playerRole", color === "white" ? "W" : "B");
        io.to(newPlayer).emit("boardState", chess.fen());
        console.log(`Assigned ${color} to ${newPlayer}`);
    }
};

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
