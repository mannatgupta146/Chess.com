const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add(
                'square',
                (rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark'
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);

                if (square.color === playerRole) {
                    pieceElement.draggable = true;
                    pieceElement.classList.add('draggable');

                    pieceElement.addEventListener('dragstart', (e) => {
                        sourceSquare = `${String.fromCharCode(97 + squareIndex)}${8 - rowIndex}`;
                        e.dataTransfer.setData('text/plain', sourceSquare);
                    });
                }

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => e.preventDefault());

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                const targetSquare = `${String.fromCharCode(97 + squareIndex)}${8 - rowIndex}`;
                handleMove(sourceSquare, targetSquare);
            });

            boardElement.appendChild(squareElement);
        });
    });

    boardElement.classList.toggle("flipped", playerRole === "b");
};

const handleMove = (from, to) => {
    if (!from || !to) return;
    
    const move = { from, to, promotion: 'q' };

    if (chess.move(move)) {
        socket.emit('move', move);
    }

    renderBoard();
};

const getPieceUnicode = (piece) => {
    if (!piece) return "";

    const unicodePieces = {
        p: { w: "♙", b: "♟" },
        r: { w: "♖", b: "♜" },
        n: { w: "♘", b: "♞" },
        b: { w: "♗", b: "♝" },
        q: { w: "♕", b: "♛" },
        k: { w: "♔", b: "♚" }
    };

    return unicodePieces[piece.type]?.[piece.color] || "";
};

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

renderBoard();
