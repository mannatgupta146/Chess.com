const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

let dragPiece = null;
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
                pieceElement.draggable = playerRole === square.color;

                if (pieceElement.draggable) {
                    pieceElement.classList.add('draggable');
                }

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        dragPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData('text/plain', "");
                    }
                });

                pieceElement.addEventListener('dragend', () => {
                    dragPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => e.preventDefault());

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                if (dragPiece) {
                    const targetSquare = e.target.closest('.square');
                    if (!targetSquare) return;

                    const targetSource = {
                        row: parseInt(targetSquare.dataset.row),
                        col: parseInt(targetSquare.dataset.col),
                    };

                    handleMove(sourceSquare, targetSource);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    boardElement.classList.toggle("flipped", playerRole === "b");
};

const handleMove = (sourceSquare, targetSquare) => {
    if (!sourceSquare || !targetSquare) return;

    const move = {
        from: `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`,
        to: `${String.fromCharCode(97 + targetSquare.col)}${8 - targetSquare.row}`,
        promotion: 'q'
    };

    socket.emit('move', move);
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
