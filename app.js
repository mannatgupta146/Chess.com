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

io.on("connection", function (uniqueSocket) {
    console.log("Connected:", uniqueSocket.id);

    if (!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "W");
    } else if (!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "B");
    } else {
        uniqueSocket.emit("playerRole", "Spectator");
    }

    // Fix: Use uniqueSocket instead of socket
    uniqueSocket.on("disconnect", function () {
        console.log("Disconnected:", uniqueSocket.id);
        if (uniqueSocket.id === players.white) {
            delete players.white;
        } else if (uniqueSocket.id === players.black) {
            delete players.black;
        }
    });

    uniqueSocket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && uniqueSocket.id !== players.white) return;
            if (chess.turn() === "b" && uniqueSocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid Move:", move);
                uniqueSocket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log(err);
            uniqueSocket.emit("invalidMove", move);
        }
    });
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});
