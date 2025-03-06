const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();
let players = {}; // Stores white & black players

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniqueSocket) {
    console.log("Connected:", uniqueSocket.id);

    // Assign player roles (white, black, or spectator)
    if (!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "W");
    } else if (!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "B");
    } else {
        uniqueSocket.emit("playerRole", "Spectator");
    }

    uniqueSocket.on("disconnect", function () {
        console.log("Disconnected:", uniqueSocket.id);

        if (uniqueSocket.id === players.white) {
            delete players.white;
            assignNextPlayer("white");
        } else if (uniqueSocket.id === players.black) {
            delete players.black;
            assignNextPlayer("black");
        }
    });

    uniqueSocket.on("move", (move) => {
        try {
            // Reject spectators from moving
            if (uniqueSocket.id !== players.white && uniqueSocket.id !== players.black) {
                return uniqueSocket.emit("invalidMove", "Spectators cannot move.");
            }

            // Ensure the right player moves
            if ((chess.turn() === "w" && uniqueSocket.id !== players.white) ||
                (chess.turn() === "b" && uniqueSocket.id !== players.black)) {
                return;
            }

            // Validate the move
            const result = chess.move(move);
            if (!result) {
                console.log("Invalid Move:", move);
                return uniqueSocket.emit("invalidMove", move);
            }

            // Broadcast valid move
            io.emit("move", move);
            io.emit("boardState", chess.fen());

        } catch (err) {
            console.error("Move Error:", err);
            uniqueSocket.emit("invalidMove", move);
        }
    });
});

// Assign next available player when someone disconnects
const assignNextPlayer = (color) => {
    const availableSockets = Array.from(io.sockets.sockets.keys());
    for (let socketId of availableSockets) {
        if (!players.white && color === "white") {
            players.white = socketId;
            io.to(socketId).emit("playerRole", "W");
            break;
        } else if (!players.black && color === "black") {
            players.black = socketId;
            io.to(socketId).emit("playerRole", "B");
            break;
        }
    }
};

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});
