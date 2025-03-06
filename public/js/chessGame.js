const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');
let playerRole = null;
let sourceSquare = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const isFlipped = playerRole === "B";
            const displayRow = isFlipped ? 7 - rowIndex : rowIndex;
            const displayCol = isFlipped ? 7 - squareIndex : squareIndex;

            const squareElement = document.createElement('div');
            squareElement.classList.add(
                'square',
                (displayRow + displayCol) % 2 === 0 ? 'light' : 'dark'
            );

            const position = `${String.fromCharCode(97 + displayCol)}${8 - displayRow}`;
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

                    pieceElement.addEventListener('dragend', (e) => {
                        pieceElement.classList.remove('opacity-50');
                    });
                }

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();
                squareElement.classList.add('bg-yellow-200');
            });

            squareElement.addEventListener('dragleave', (e) => {
                squareElement.classList.remove('bg-yellow-200');
            });

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                squareElement.classList.remove('bg-yellow-200');
                const targetSquare = position;
                handleMove(sourceSquare, targetSquare);
            });

            boardElement.appendChild(squareElement);
        });
    });

    boardElement.classList.toggle("flipped", playerRole === "B");
};

const handleMove = (from, to) => {
    const move = { from, to, promotion: 'q' };
    socket.emit('move', move);
};

const getPieceUnicode = (piece) => {
    if (!piece) return "";

    const unicodePieces = {
        'p': { w: "♙", b: "♟" }, // Corrected white/black pawn symbols
        'r': { w: "♖", b: "♜" },
        'n': { w: "♘", b: "♞" },
        'b': { w: "♗", b: "♝" },
        'q': { w: "♕", b: "♛" },
        'k': { w: "♔", b: "♚" }
    };

    return unicodePieces[piece.type]?.[piece.color] || "";
};

// Socket event handlers
socket.on("playerRole", (role) => {
    playerRole = role;
    console.log(`You are playing as ${role}`);
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("invalidMove", (move) => {
    console.log("Invalid move attempted:", move);
    renderBoard(); // Reset board view
});

socket.on("gameOver", (message) => {
    alert(message);
    chess.reset();
    renderBoard();
});

// Connection status handlers
socket.on("connect", () => {
    console.log("Connected to server");
    if (playerRole) {
        socket.emit("requestReconnect", playerRole);
    }
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});

// Initial render
renderBoard();