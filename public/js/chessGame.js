const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');
let playerRole = null;
let sourceSquare = null;

socket.on("playerRole", (role) => {
    playerRole = role;
    console.log(`🔵 You are playing as ${role}`);
    requestBoardState();
});

const requestBoardState = () => {
    socket.emit("requestBoardState");
};

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const isFlipped = playerRole === "B";
            const file = String.fromCharCode(97 + squareIndex);
            const rank = 8 - rowIndex;
            const position = file + rank;

            const visualRow = isFlipped ? 7 - rowIndex : rowIndex;
            const visualCol = isFlipped ? 7 - squareIndex : squareIndex;

            const squareElement = document.createElement('div');
            squareElement.classList.add(
                'square',
                (visualRow + visualCol) % 2 === 0 ? 'light' : 'dark'
            );
            squareElement.dataset.position = position;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add(
                    'piece',
                    square.color === "w" ? "white" : "black",
                    'cursor-grab',
                    'active:cursor-grabbing'
                );
                pieceElement.innerHTML = getPieceUnicode(square);
                pieceElement.dataset.type = square.type;
                pieceElement.dataset.color = square.color;

                if (playerRole && square.color === playerRole.toLowerCase()) {
                    pieceElement.draggable = true;

                    pieceElement.addEventListener('dragstart', (e) => {
                        sourceSquare = position;
                        e.dataTransfer.setData('text/plain', sourceSquare);
                        pieceElement.classList.add('opacity-50');
                    });

                    pieceElement.addEventListener('dragend', () => {
                        pieceElement.classList.remove('opacity-50');
                    });
                }

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();
                squareElement.classList.add('bg-yellow-200');
            });

            squareElement.addEventListener('dragleave', () => {
                squareElement.classList.remove('bg-yellow-200');
            });

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                squareElement.classList.remove('bg-yellow-200');
                const targetSquare = position;
                if (!sourceSquare || sourceSquare === targetSquare) return;
                handleMove(sourceSquare, targetSquare);
                sourceSquare = null;
            });

            boardElement.appendChild(squareElement);
        });
    });

    boardElement.classList.toggle("flipped", playerRole === "B");
};

const handleMove = (from, to) => {
    if (!from || !to) return;

    if ((chess.turn() === "w" && playerRole !== "W") ||
        (chess.turn() === "b" && playerRole !== "B")) {
        console.log("⚠️ Not your turn!");
        return;
    }

    const move = { from, to, promotion: 'q' };

    if (!chess.move(move)) {
        console.log(`❌ Invalid move: ${JSON.stringify(move)}`);
        renderBoard();
        return;
    }

    chess.undo();
    socket.emit('move', move);
};

const getPieceUnicode = (piece) => {
    if (!piece) return "";
    const unicodePieces = {
        'p': { w: "♙", b: "♙" },
        'r': { w: "♖", b: "♖" },
        'n': { w: "♘", b: "♘" },
        'b': { w: "♗", b: "♗" },
        'q': { w: "♕", b: "♕" },
        'k': { w: "♔", b: "♔" }
    };
    return unicodePieces[piece.type]?.[piece.color] || "";
};

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("invalidMove", () => {
    chess.undo();
    renderBoard();
});

socket.on("gameOver", (message) => {
    alert(message);
    chess.reset();
    renderBoard();
});

socket.on("connect", () => {
    console.log("✅ Connected to server");
});

socket.on("disconnect", () => {
    console.log("🔴 Disconnected from server");
});

requestBoardState();
