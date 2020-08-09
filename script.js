const gridContainer = document.querySelector(".grid-container");

let ACTIVE_CELL = null;
let VALID_CELLS = null;

const players = {
    light: {
        moves: 0,
        enPassantPossible: false,
    },
    dark: {
        moves: 0,
        enPassantPossible: false,
    }
}

function clearHighlightedCells() {
    document.querySelectorAll(".highlight").forEach(c => {c.classList.remove("highlight")});
}

function setActiveCell(cell) {
    const previousActive = document.querySelector(".active");
    if (previousActive) {
        previousActive.classList.remove("active");
    }

    if (cell) {
        cell.classList.add("active");
        ACTIVE_CELL = cell;
    }
}

function highlightCell(cell) {
    cell.classList.add("highlight");
}

function pieceBetween(cellA, cellB) {
    const cellARow = parseInt(cellA.dataset.row);
    const cellACol = parseInt(cellA.dataset.col);
    const cellBRow = parseInt(cellB.dataset.row);
    const cellBCol = parseInt(cellB.dataset.col);

    if (cellARow === cellBRow) {
        let small;
        let big;

        if (cellACol < cellBCol) {
            small = cellACol;
            big = cellBCol;
        } else {
            small = cellBCol;
            big = cellACol;
        }

        for (let i = small + 1; i < big; i++) {
            const cell = document.querySelector(`[data-col='${i}'][data-row='${cellARow}']`);
            if (cell.dataset.piece) {
                return true;
            }
        }
    } else if (cellACol === cellBCol) {
        let small;
        let big;

        if (cellARow < cellBRow) {
            small = cellARow;
            big = cellBRow;
        } else {
            small = cellBRow;
            big = cellARow;
        }

        for (let i = small + 1; i < big; i++) {
            const cell = document.querySelector(`[data-col='${cellACol}'][data-row='${i}']`);
            if (cell.dataset.piece) {
                return true;
            }
        }
    }

    return false;
}

function pieceOn(row, col) {
    if (document.querySelector(`[data-row='${row}'][data-col='${col}']`).dataset.piece) {
        return true;
    } else {
        return false;
    }
}

function getValidCells(cell) {
    const activePieceType = cell.dataset.piece.split(" ")[0];
    const activePieceColor = cell.dataset.piece.split(" ")[1];
    const currentRow = parseInt(cell.dataset.row);
    const currentCol = parseInt(cell.dataset.col);

    const validCells = [];

    if (activePieceType === "pawn" && activePieceColor === "light") {
        // Two forward from initial board position
        if (currentRow === 2 && !pieceOn(currentRow + 2, currentCol) && !pieceBetween(cell, document.querySelector(`[data-row='${currentRow + 2}'][data-col='${currentCol}']`))) {
            validCells.push(document.querySelector(`[data-row='${currentRow + 2}'][data-col='${currentCol}']`))
        }
        // One forward from initial board position
        const cellTop = document.querySelector(`[data-row='${currentRow + 1}'][data-col='${currentCol}']`);
        if (cellTop && !cellTop.dataset.piece)
        validCells.push(document.querySelector(`[data-row='${currentRow + 1}'][data-col='${currentCol}']`))
        // Take piece diagonally left
        const cellTopLeft = document.querySelector(`[data-row='${currentRow + 1}'][data-col='${currentCol - 1}']`);
        if (cellTopLeft && cellTopLeft.dataset.piece && cellTopLeft.dataset.piece.includes("dark")) {
            validCells.push(cellTopLeft);
        }
        // Take piece diagonally right
        const cellTopRight = document.querySelector(`[data-row='${currentRow + 1}'][data-col='${currentCol + 1}']`);
        if (cellTopRight && cellTopRight.dataset.piece && cellTopRight.dataset.piece.includes("dark")) {
            validCells.push(cellTopRight);
        }
        // En Passant diagonally left
        const cellLeft = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol - 1}']`);
        if (players.dark.enPassantPossible && cellLeft && cellLeft.dataset.piece && cellLeft.dataset.piece === "pawn dark") {
            validCells.push(cellTopLeft);
        }
    } else if (activePieceType === "pawn" && activePieceColor === "dark") {
        if (currentRow === 7 && !pieceOn(currentRow - 2, currentCol) && !pieceBetween(cell, document.querySelector(`[data-row='${currentRow - 2}'][data-col='${currentCol}']`))) {
            validCells.push(document.querySelector(`[data-row='${currentRow - 2}'][data-col='${currentCol}']`))
        }
        if (!document.querySelector(`[data-row='${currentRow - 1}'][data-col='${currentCol}']`).dataset.piece)
        validCells.push(document.querySelector(`[data-row='${currentRow - 1}'][data-col='${currentCol}']`))
    } 

    return validCells;
}

function movePieceToNewDestination(cell) {
    const piece = ACTIVE_CELL.dataset.piece;

    if (piece === "pawn light" && parseInt(cell.dataset.row) === 8) {
        cell.setAttribute("data-piece", "queen light");
    } else if (piece === "pawn dark" && parseInt(cell.dataset.row) === 1) {
        cell.setAttribute("data-piece", "queen dark");
    // En Passant
    } else if (piece === "pawn light" && parseInt(ACTIVE_CELL.dataset.row) === 2 && parseInt(cell.dataset.row) === 4) {
        players.light.enPassantPossible = true;
        cell.setAttribute("data-piece", piece);
    } else if (piece === "pawn dark" && parseInt(ACTIVE_CELL.dataset.row) === 7 && parseInt(cell.dataset.row) === 5) {
        players.dark.enPassantPossible = true;
        cell.setAttribute("data-piece", piece);
    } else {
        cell.setAttribute("data-piece", piece);
    }

    ACTIVE_CELL.classList.remove("active", "highlight");
    ACTIVE_CELL.removeAttribute("data-piece");
    ACTIVE_CELL = null;
    clearHighlightedCells();
    setActiveCell(null);
}

function initBoard() {
    let color = "dark";

    for (let i = 8; i > 0; i--) {
        color = (color === "light") ? "dark" : "light";
        for (let j = 1; j < 9; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell", color);
            cell.setAttribute("data-col", j);
            cell.setAttribute("data-row", i);

            let pieceColor;
            let pieceType;

            if (i > 6 || i < 3) {
                if (i < 3) {
                    pieceColor = "light";
                } else if (i >= 7) {
                    pieceColor = "dark";
                }
    
                if (i === 2 || i === 7) {
                    pieceType = "pawn";
                } else if (j === 1 || j === 8) {
                    pieceType = "rook";
                } else if (j === 2 || j === 7) {
                    pieceType = "knight";  
                } else if (j === 3 || j === 6) {
                    pieceType = "bishop";
                } else if (j === 4) {
                    pieceType = "queen";
                } else {
                    pieceType = "king";
                }

                cell.setAttribute("data-piece", `${pieceType} ${pieceColor}`);
            }

            cell.addEventListener("click", (e) => {
                const cell = e.target;

                if (ACTIVE_CELL && VALID_CELLS.includes(cell)) {
                    movePieceToNewDestination(cell);
                } else if (cell.dataset.piece) {
                    clearHighlightedCells();
                    setActiveCell(cell);
                    VALID_CELLS = getValidCells(cell);
                    VALID_CELLS.forEach(cell => highlightCell(cell));
                }
            });

            gridContainer.appendChild(cell);
            
            color = (color === "light") ? "dark" : "light";
        }
    }
}

initBoard();