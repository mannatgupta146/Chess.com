const socket = io();

const chess = new Chess();
const boardElement = document.querySelector('.chessboard');  

let dragPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row,rowIndex)=>{
        row.forEach((square,squareIndex)=>{
            const squareElement = document.createElement('div');
            squareElement.classList.add('square',
                (rowIndex+squareIndex) % 2 === 0?'light':'dark');

        squareElement.dataset.row = rowIndex;
        squareElement.dataset.square = squareIndex;
        
        if(square){
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece',
                square.color === "w" ? "white" : "black",
            );
            pieceElement.innerText = "";
            pieceElement.draggable = playerRole === square.color;

            pieceElement.addEventListener('dragstart',()=>{
                if(pieceElement.draggable){
                    dragPiece = pieceElement;
                    sourceSquare = {row:rowIndex, col:squareIndex};
                }
            });
            
        }

        })
    })
}

const handleMove = () => {}

const getPieceUnicode = () => {}

renderBoard();