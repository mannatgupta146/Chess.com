const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function (socket) {
    console.log("Connected:", socket.id);

    // Reset players if both disconnected
    if (Object.values(players).every(v => !v)) players = {};

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

    // Send initial state
    socket.emit("boardState", chess.fen());
    console.log("Current players:", players);

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
        
        // Handle player disconnection
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
            // Validate player turn
            const isWhitePlayer = socket.id === players.white;
            const isBlackPlayer = socket.id === players.black;
            
            if (!isWhitePlayer && !isBlackPlayer) {
                return socket.emit("invalidMove", "Spectators cannot move");
            }

            if ((chess.turn() === 'w' && !isWhitePlayer) || 
                (chess.turn() === 'b' && !isBlackPlayer)) {
                return socket.emit("invalidMove", "Not your turn");
            }

            // Attempt move
            const result = chess.move(move);
            if (!result) return socket.emit("invalidMove", "Invalid move");

            // Broadcast updates
            io.emit("boardState", chess.fen());

            // Handle game end
            if (chess.isGameOver()) {
                const message = chess.isCheckmate() 
                    ? `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`
                    : "Game drawn!";
                io.emit("gameOver", message);
                chess.reset();
            }

        } catch (err) {
            socket.emit("invalidMove", err.message);
        }
    });
});

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
