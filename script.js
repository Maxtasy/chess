const gridContainer = document.querySelector(".grid-container");

let ACTIVE_CELL = null;
let VALID_CELLS = null;
let CURRENT_PLAYER = "light";
let CHECK = false;
let CHECKMATE = false;

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

    // Light Pawn
    if (activePieceType === "pawn" && activePieceColor === "light") {
        // Two forward from initial board position
        if (currentRow === 2 && !pieceOn(currentRow + 2, currentCol) && !pieceBetween(cell, document.querySelector(`[data-row='${currentRow + 2}'][data-col='${currentCol}']`))) {
            validCells.push(document.querySelector(`[data-row='${currentRow + 2}'][data-col='${currentCol}']`))
        }
        // One forward from initial board position
        const cellTop = document.querySelector(`[data-row='${currentRow + 1}'][data-col='${currentCol}']`);
        if (cellTop && !cellTop.dataset.piece) {
            validCells.push(document.querySelector(`[data-row='${currentRow + 1}'][data-col='${currentCol}']`))
        }
        // Take piece diagonally left
        const cellDiagLeft = document.querySelector(`[data-row='${currentRow + 1}'][data-col='${currentCol - 1}']`);
        if (cellDiagLeft && cellDiagLeft.dataset.piece && cellDiagLeft.dataset.piece.includes("dark")) {
            validCells.push(cellDiagLeft);
        }
        // Take piece diagonally right
        const cellDiagRight = document.querySelector(`[data-row='${currentRow + 1}'][data-col='${currentCol + 1}']`);
        if (cellDiagRight && cellDiagRight.dataset.piece && cellDiagRight.dataset.piece.includes("dark")) {
            validCells.push(cellDiagRight);
        }
        // En Passant diagonally left
        const cellLeft = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol - 1}']`);
        if (players.dark.enPassantPossible && cellLeft && cellLeft.dataset.piece && cellLeft.dataset.piece === "pawn dark") {
            validCells.push(cellDiagLeft);
        }
        // En Passant diagonally right
        const cellRight = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol + 1}']`);
        if (players.dark.enPassantPossible && cellRight && cellRight.dataset.piece && cellRight.dataset.piece === "pawn dark") {
            validCells.push(cellDiagRight);
        }
    // Dark Pawn
    } else if (activePieceType === "pawn" && activePieceColor === "dark") {
        // Two forward from initial board position
        if (currentRow === 7 && !pieceOn(currentRow - 2, currentCol) && !pieceBetween(cell, document.querySelector(`[data-row='${currentRow - 2}'][data-col='${currentCol}']`))) {
            validCells.push(document.querySelector(`[data-row='${currentRow - 2}'][data-col='${currentCol}']`))
        }
        // One forward from initial board position
        const cellTop = document.querySelector(`[data-row='${currentRow - 1}'][data-col='${currentCol}']`);
        if (cellTop && !cellTop.dataset.piece) {
            validCells.push(document.querySelector(`[data-row='${currentRow - 1}'][data-col='${currentCol}']`))
        }
        // Take piece diagonally left
        const cellDiagLeft = document.querySelector(`[data-row='${currentRow - 1}'][data-col='${currentCol - 1}']`);
        if (cellDiagLeft && cellDiagLeft.dataset.piece && cellDiagLeft.dataset.piece.includes("dark")) {
            validCells.push(cellDiagLeft);
        }
        // Take piece diagonally right
        const cellDiagRight = document.querySelector(`[data-row='${currentRow - 1}'][data-col='${currentCol + 1}']`);
        if (cellDiagRight && cellDiagRight.dataset.piece && cellDiagRight.dataset.piece.includes("dark")) {
            validCells.push(cellDiagRight);
        }
        // En Passant diagonally left
        const cellLeft = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol - 1}']`);
        if (players.light.enPassantPossible && cellLeft && cellLeft.dataset.piece && cellLeft.dataset.piece === "pawn light") {
            validCells.push(cellDiagLeft);
        }
        // En Passant diagonally right
        const cellRight = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol + 1}']`);
        if (players.light.enPassantPossible && cellRight && cellRight.dataset.piece && cellRight.dataset.piece === "pawn light") {
            validCells.push(cellDiagRight);
        }
    // Knights
    } else if (activePieceType === "knight") {
        const movePattern = [[2, -1], [2, 1], [1, -2], [1, 2], [-1, -2], [-1, 2], [-2, -1],  [-2, 1]];
        movePattern.forEach(move => {
            const possibleCell = document.querySelector(`[data-row='${currentRow + move[0]}'][data-col='${currentCol + move[1]}']`);
            
            if (possibleCell && (!possibleCell.dataset.piece || possibleCell.dataset.piece.split(" ")[1] !== activePieceColor)) {
                validCells.push(possibleCell);
            }
        });
    // Bishops
    } else if (activePieceType === "bishop") {
        let diagTopLeftEnd = false;
        let diagTopRightEnd = false;
        let diagBotLeftEnd = false;
        let diagBotRightEnd = false;

        for (let i = 1; i < 8; i++) {
            if (diagTopRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow + i}'][data-col='${currentCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    diagTopRightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    diagTopRightEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (diagBotLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow - i}'][data-col='${currentCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    diagBotLeftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    diagBotLeftEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (diagTopLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow + i}'][data-col='${currentCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    diagTopLeftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    diagTopLeftEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (diagBotRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow - i}'][data-col='${currentCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    diagBotRightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    diagBotRightEnd = true;
                }
            }
        }
    // Rooks
    } else if (activePieceType === "rook") {
        let leftEnd = false;
        let rightEnd = false;
        let topEnd = false;
        let botEnd = false;
        
        for (let i = 1; i < 8; i++) {
            if (leftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    leftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    leftEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (rightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    rightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    rightEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (topEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow + i}'][data-col='${currentCol}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    topEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    topEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (botEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow - i}'][data-col='${currentCol}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    botEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    botEnd = true;
                }
            }
        }
    // Queens
    } else if (activePieceType === "queen") {
        let diagTopLeftEnd = false;
        let diagTopRightEnd = false;
        let diagBotLeftEnd = false;
        let diagBotRightEnd = false;
        let leftEnd = false;
        let rightEnd = false;
        let topEnd = false;
        let botEnd = false;

        for (let i = 1; i < 8; i++) {
            if (diagTopRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow + i}'][data-col='${currentCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    diagTopRightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    diagTopRightEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (diagBotLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow - i}'][data-col='${currentCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    diagBotLeftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    diagBotLeftEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (diagTopLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow + i}'][data-col='${currentCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    diagTopLeftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    diagTopLeftEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (diagBotRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow - i}'][data-col='${currentCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    diagBotRightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    diagBotRightEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (leftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    leftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    leftEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (rightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow}'][data-col='${currentCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    rightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    rightEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (topEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow + i}'][data-col='${currentCol}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    topEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    topEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (botEnd) break;

            const possibleCell = document.querySelector(`[data-row='${currentRow - i}'][data-col='${currentCol}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validCells.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] !== activePieceColor) {
                    validCells.push(possibleCell);
                    botEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.piece.split(" ")[1] === activePieceColor) {
                    botEnd = true;
                }
            }
        }
    // Kings
    } else if (activePieceType === "king") {
        const movePattern = [[1, -1], [1, 0], [1, 1], [0, -1], [0, 1], [-1, -1], [-1, 0], [-1, 1]];
        movePattern.forEach(move => {
            const possibleCell = document.querySelector(`[data-row='${currentRow + move[0]}'][data-col='${currentCol + move[1]}']`);
            
            if (possibleCell && (!possibleCell.dataset.piece || possibleCell.dataset.piece.split(" ")[1] !== activePieceColor)) {
                validCells.push(possibleCell);
            }
        });
    }

    return validCells;
}

function movePieceToNewDestination(cell) {
    const activePieceType = ACTIVE_CELL.dataset.piece.split(" ")[0];
    const activePieceColor = ACTIVE_CELL.dataset.piece.split(" ")[1];
    const currentRow = parseInt(ACTIVE_CELL.dataset.row);
    const currentCol = parseInt(ACTIVE_CELL.dataset.col);
    const destinationRow = parseInt(cell.dataset.row);
    const destinationCol = parseInt(cell.dataset.col);

    // TODO: Give player selection of pieces to promote to
    // Promote pawn to queen
    if (activePieceType === "pawn" && activePieceColor === "light" && destinationRow === 8) {
        cell.setAttribute("data-piece", "queen light");
    } else if (activePieceType === "pawn" && activePieceColor === "dark" && destinationRow === 1) {
        cell.setAttribute("data-piece", "queen dark");
    // Enable En Passant if pawn moves 2 cells forward
    } else if (activePieceType === "pawn" && activePieceColor === "light" && currentRow === 2 && destinationRow === 4) {
        players.light.enPassantPossible = true;
        cell.setAttribute("data-piece", `${activePieceType} ${activePieceColor}`);
    } else if (activePieceType === "pawn" && activePieceColor === "dark" && currentRow === 7 && destinationRow === 5) {
        players.dark.enPassantPossible = true;
        cell.setAttribute("data-piece", `${activePieceType} ${activePieceColor}`);
    // Light moved En Passant
    } else if (activePieceType === "pawn" && activePieceColor === "light" &&
                players.dark.enPassantPossible &&
                currentRow === 5 &&
                destinationCol === 6 &&
                (currentCol - 1 === destinationCol || currentCol + 1 === destinationCol))
    {
        cell.setAttribute("data-piece", `${activePieceType} ${activePieceColor}`);
        document.querySelector(`[data-row='${currentRow}'][data-col='${destinationCol}']`).removeAttribute("data-piece");
    // Dark moved En Passant
    } else if (activePieceType === "pawn" && activePieceColor === "dark" &&
                players.light.enPassantPossible &&
                currentRow === 4 &&
                destinationCol === 3 &&
                (currentCol - 1 === parseInt(cell.dataset.col) || currentCol + 1 === destinationCol)) {
        cell.setAttribute("data-piece", `${activePieceType} ${activePieceColor}`);
        document.querySelector(`[data-row='${currentRow}'][data-col='${destinationCol}']`).removeAttribute("data-piece");
    } else {
        cell.setAttribute("data-piece", `${activePieceType} ${activePieceColor}`);
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