const gridContainer = document.querySelector(".grid-container");

const soundMove = new Audio();
soundMove.src = "audio/Move.mp3";

const soundCheckmate = new Audio();
soundCheckmate.src = "audio/Checkmate.mp3";

let ACTIVE_CELL = null;
let VALID_DESTINATIONS = null;
let CURRENT_PLAYER = "light";

const players = {
    light: {
        moves: 0,
        enPassant: null,
        canCastleLong: true,
        canCastleShort: true,
    },
    dark: {
        moves: 0,
        enPassant: null,
        canCastleLong: true,
        canCastleShort: true,
    }
}

function clearHighlightedCells() {
        document.querySelectorAll(".take-overlay").forEach(overlay => {overlay.style.display = "none"});
        document.querySelectorAll(".move-overlay").forEach(overlay => {overlay.style.display = "none"});
}

function setActiveCell(cell) {
    const previousActive = document.querySelector(".active");
    if (previousActive) {
        previousActive.classList.remove("active");
    }

    if (cell) {
        cell.classList.add("active");
        ACTIVE_CELL = cell;
    } else {
        ACTIVE_CELL = null;
    }
}

function highlightCell(cell) {
    if (cell.dataset.piece) {
        cell.querySelector(".take-overlay").style.display = "block";
    } else {
        cell.querySelector(".move-overlay").style.display = "block";
    }
}

function getCoveredCells(cell) {
    const cellRow = parseInt(cell.dataset.row);
    const cellCol = parseInt(cell.dataset.col);
    const cellPiece = cell.dataset.piece;
    const cellColor = cell.dataset.color;

    const coveredCells = [];

    if (cellPiece === "pawn" && cellColor === "light") {
        const cellDiagLeft = document.querySelector(`[data-row='${cellRow + 1}'][data-col='${cellCol - 1}']`);
        if (cellDiagLeft) coveredCells.push(cellDiagLeft);
        const cellDiagRight = document.querySelector(`[data-row='${cellRow + 1}'][data-col='${cellCol + 1}']`);
        if (cellDiagRight) coveredCells.push(cellDiagRight);
    } else if (cellPiece === "pawn" && cellColor === "dark") {
        const cellDiagLeft = document.querySelector(`[data-row='${cellRow - 1}'][data-col='${cellCol - 1}']`);
        if (cellDiagLeft) coveredCells.push(cellDiagLeft);
        const cellDiagRight = document.querySelector(`[data-row='${cellRow - 1}'][data-col='${cellCol + 1}']`);
        if (cellDiagRight) coveredCells.push(cellDiagRight);
    } else if (cellPiece === "knight") {
        const movePattern = [[2, -1], [2, 1], [1, -2], [1, 2], [-1, -2], [-1, 2], [-2, -1],  [-2, 1]];
        movePattern.forEach(move => {
            const possibleCell = document.querySelector(`[data-row='${cellRow + move[0]}'][data-col='${cellCol + move[1]}']`);
            if (possibleCell) coveredCells.push(possibleCell);
        });
    } else if (cellPiece === "bishop") {
        let diagTopLeftEnd = false;
        let diagTopRightEnd = false;
        let diagBotLeftEnd = false;
        let diagBotRightEnd = false;

        for (let i = 1; i < 8; i++) {
            if (diagTopLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    diagTopLeftEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }

        for (let i = 1; i < 8; i++) {
            if (diagTopRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    diagTopRightEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }

        for (let i = 1; i < 8; i++) {
            if (diagBotLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    diagBotLeftEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }

        for (let i = 1; i < 8; i++) {
            if (diagBotRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    diagBotRightEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
    } else if (cellPiece === "rook") {
        let leftEnd = false;
        let rightEnd = false;
        let topEnd = false;
        let botEnd = false;
        
        for (let i = 1; i < 8; i++) {
            if (leftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    leftEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (rightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    rightEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (topEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + 1}'][data-col='${cellCol}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    topEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (botEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - 1}'][data-col='${cellCol}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    botEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
    } else if (cellPiece === "queen") {
        let diagTopLeftEnd = false;
        let diagTopRightEnd = false;
        let diagBotLeftEnd = false;
        let diagBotRightEnd = false;
        let leftEnd = false;
        let rightEnd = false;
        let topEnd = false;
        let botEnd = false;
        
        for (let i = 1; i < 8; i++) {
            if (diagTopLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    diagTopLeftEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (diagTopRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    diagTopRightEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (diagBotLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    diagBotLeftEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (diagBotRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    diagBotRightEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (leftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    leftEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (rightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    rightEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (topEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + 1}'][data-col='${cellCol}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    topEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (botEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - 1}'][data-col='${cellCol}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    botEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
    } else if (cellPiece === "king") {
        const movePattern = [[1, -1], [1, 0], [1, 1], [0, -1], [0, 1], [-1, -1], [-1, 0], [-1, 1]];

        movePattern.forEach(move => {
            const possibleCell = document.querySelector(`[data-row='${cellRow + move[0]}'][data-col='${cellCol + move[1]}']`);
            if (possibleCell) coveredCells.push(possibleCell);
        });
    }

    return coveredCells;
}

function getValidDestinations(cell) {
    const cellRow = parseInt(cell.dataset.row);
    const cellCol = parseInt(cell.dataset.col);
    const cellPiece = cell.dataset.piece;
    const cellColor = cell.dataset.color;

    const validDestinations = [];

    if (cellPiece === "pawn" && cellColor === "light") {
        // One forward from initial board position
        const cellTop = document.querySelector(`[data-row='${cellRow + 1}'][data-col='${cellCol}']`);
        if (cellTop && !cellTop.dataset.piece) {
            validDestinations.push(cellTop);
        }
        // Two forward from initial board position
        const cellTopTop = document.querySelector(`[data-row='${cellRow + 2}'][data-col='${cellCol}']`);
        if (cellRow === 2 && !cellTop.dataset.piece && !cellTopTop.dataset.piece) {
            validDestinations.push(cellTopTop);
        }
        // Take piece diagonally left
        const cellDiagLeft = document.querySelector(`[data-row='${cellRow + 1}'][data-col='${cellCol - 1}']`);
        if (cellDiagLeft && cellDiagLeft.dataset.piece && cellDiagLeft.dataset.color === "dark") {
            validDestinations.push(cellDiagLeft);
        }
        // Take piece diagonally right
        const cellDiagRight = document.querySelector(`[data-row='${cellRow + 1}'][data-col='${cellCol + 1}']`);
        if (cellDiagRight && cellDiagRight.dataset.piece && cellDiagRight.dataset.color === "dark") {
            validDestinations.push(cellDiagRight);
        }
        // En Passant diagonally left
        if (players.dark.enPassant === cellCol - 1  && cellRow === 5) {
            validDestinations.push(cellDiagLeft);
        }
        // En Passant diagonally right
        if (players.dark.enPassant === cellCol + 1  && cellRow === 5) {
            validDestinations.push(cellDiagRight);
        }
    } else if (cellPiece === "pawn" && cellColor === "dark") {
        // One forward from initial board position
        const cellBot = document.querySelector(`[data-row='${cellRow - 1}'][data-col='${cellCol}']`);
        if (cellBot && !cellBot.dataset.piece) {
            validDestinations.push(cellBot);
        }
        // Two forward from initial board position
        const cellBotBot = document.querySelector(`[data-row='${cellRow - 2}'][data-col='${cellCol}']`);
        if (cellRow === 7 && !cellBot.dataset.piece && !cellBotBot.dataset.piece) {
            validDestinations.push(cellBotBot);
        }
        // Take piece diagonally left
        const cellDiagLeft = document.querySelector(`[data-row='${cellRow - 1}'][data-col='${cellCol - 1}']`);
        if (cellDiagLeft && cellDiagLeft.dataset.piece && cellDiagLeft.dataset.color === "light") {
            validDestinations.push(cellDiagLeft);
        }
        // Take piece diagonally right
        const cellDiagRight = document.querySelector(`[data-row='${cellRow - 1}'][data-col='${cellCol + 1}']`);
        if (cellDiagRight && cellDiagRight.dataset.piece && cellDiagRight.dataset.color === "light") {
            validDestinations.push(cellDiagRight);
        }
        // En Passant diagonally left
        if (players.dark.enPassant === cellCol - 1  && cellRow === 6) {
            validDestinations.push(cellDiagLeft);
        }
        // En Passant diagonally right
        if (players.dark.enPassant === cellCol + 1  && cellRow === 6) {
            validDestinations.push(cellDiagRight);
        }
    } else if (cellPiece === "knight") {
        const movePattern = [[2, -1], [2, 1], [1, -2], [1, 2], [-1, -2], [-1, 2], [-2, -1],  [-2, 1]];
        movePattern.forEach(move => {
            const possibleCell = document.querySelector(`[data-row='${cellRow + move[0]}'][data-col='${cellCol + move[1]}']`);
            
            if (possibleCell && (!possibleCell.dataset.piece || possibleCell.dataset.color !== cellColor)) {
                validDestinations.push(possibleCell);
            }
        });
    } else if (cellPiece === "bishop") {
        let diagTopLeftEnd = false;
        let diagTopRightEnd = false;
        let diagBotLeftEnd = false;
        let diagBotRightEnd = false;

        for (let i = 1; i < 8; i++) {
            if (diagTopLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    diagTopLeftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    diagTopLeftEnd = true;
                }
            }
        }

        for (let i = 1; i < 8; i++) {
            if (diagTopRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    diagTopRightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    diagTopRightEnd = true;
                }
            }
        }

        for (let i = 1; i < 8; i++) {
            if (diagBotLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    diagBotLeftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    diagBotLeftEnd = true;
                }
            }
        }

        for (let i = 1; i < 8; i++) {
            if (diagBotRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    diagBotRightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    diagBotRightEnd = true;
                }
            }
        }
    } else if (cellPiece === "rook") {
        let leftEnd = false;
        let rightEnd = false;
        let topEnd = false;
        let botEnd = false;
        
        for (let i = 1; i < 8; i++) {
            if (leftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    leftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    leftEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (rightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    rightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    rightEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (topEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    topEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    topEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (botEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    botEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    botEnd = true;
                }
            }
        }
    } else if (cellPiece === "queen") {
        let diagTopLeftEnd = false;
        let diagTopRightEnd = false;
        let diagBotLeftEnd = false;
        let diagBotRightEnd = false;
        let leftEnd = false;
        let rightEnd = false;
        let topEnd = false;
        let botEnd = false;

        for (let i = 1; i < 8; i++) {
            if (diagTopLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    diagTopLeftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    diagTopLeftEnd = true;
                }
            }
        }

        for (let i = 1; i < 8; i++) {
            if (diagTopRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    diagTopRightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    diagTopRightEnd = true;
                }
            }
        }

        for (let i = 1; i < 8; i++) {
            if (diagBotLeftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    diagBotLeftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    diagBotLeftEnd = true;
                }
            }
        }

        for (let i = 1; i < 8; i++) {
            if (diagBotRightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    diagBotRightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    diagBotRightEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (leftEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    leftEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    leftEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (rightEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol + i}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    rightEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    rightEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (topEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    topEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    topEnd = true;
                }
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (botEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol}']`);

            if (possibleCell) {
                if (!possibleCell.dataset.piece) {
                    validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    validDestinations.push(possibleCell);
                    botEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    botEnd = true;
                }
            }
        }
    } else if (cellPiece === "king") {
        const enemyColor = (cellColor === "light") ? "dark" : "light";
        const enemyPieces = document.querySelectorAll(`[data-color='${enemyColor}']`);

        let coveredCells = [];

        enemyPieces.forEach(piece => {
            coveredCells = coveredCells.concat(getCoveredCells(piece));
        });

        const movePattern = [[1, -1], [1, 0], [1, 1], [0, -1], [0, 1], [-1, -1], [-1, 0], [-1, 1]];

        movePattern.forEach(move => {
            const possibleCell = document.querySelector(`[data-row='${cellRow + move[0]}'][data-col='${cellCol + move[1]}']`);
            
            if (possibleCell && !coveredCells.includes(possibleCell) && (!possibleCell.dataset.piece || possibleCell.dataset.color !== cellColor)) {
                validDestinations.push(possibleCell);
            }
        });

        // Castle Short
        const cellRight = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol + 1}']`);
        const cellRightRight = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol + 2}']`);
        const cellRightRightRight = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol + 3}']`);
        if (players[CURRENT_PLAYER].canCastleShort &&
            !cellRight.dataset.piece &&
            !cellRightRight.dataset.piece &&
            !coveredCells.includes(cellRight) &&
            !coveredCells.includes(cellRightRight))
        {
            validDestinations.push(cellRightRight);
            validDestinations.push(cellRightRightRight);
        }

        // Castle Long
        const cellLeft = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - 1}']`);
        const cellLeftLeft = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - 2}']`);
        const cellLeftLeftLeft = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - 3}']`);
        const cellLeftLeftLeftLeft = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - 4}']`);
        if (players[CURRENT_PLAYER].canCastleLong &&
            !cellLeft.dataset.piece &&
            !cellLeftLeft.dataset.piece &&
            !cellLeftLeftLeft.dataset.piece &&
            !coveredCells.includes(cellLeft) &&
            !coveredCells.includes(cellLeftLeft) &&
            !coveredCells.includes(cellLeftLeftLeft))
        {
            validDestinations.push(cellLeftLeft);
            validDestinations.push(cellLeftLeftLeftLeft);
        }
    }

    return validDestinations;
}

function movePieceToNewDestination(cell) {
    const activePiece = ACTIVE_CELL.dataset.piece;
    const activeColor = ACTIVE_CELL.dataset.color;
    const activeRow = parseInt(ACTIVE_CELL.dataset.row);
    const activeCol = parseInt(ACTIVE_CELL.dataset.col);
    const destinationRow = parseInt(cell.dataset.row);
    const destinationCol = parseInt(cell.dataset.col);

    // Promote
    if (activePiece === "pawn" && activeColor === "light" && destinationRow === 8) {
        cell.setAttribute("data-piece", "queen");
        cell.setAttribute("data-color", "light");
    } else if (activePiece === "pawn" && activeColor === "dark" && destinationRow === 1) {
        cell.setAttribute("data-piece", "queen");
        cell.setAttribute("data-color", "dark");
    // Enable En Passant if pawn moves 2 cells forward
    } else if (activePiece === "pawn" && activeColor === "light" && activeRow === 2 && destinationRow === 4) {
        players.light.enPassant = activeCol;
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
    } else if (activePiece === "pawn" && activeColor === "dark" && activeRow === 7 && destinationRow === 5) {
        players.dark.enPassant = activeCol;
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
    // Light moved En Passant
    } else if (activePiece === "pawn" && activeColor === "light" && activeRow === 5 && destinationCol === players.dark.enPassant) {
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);

        const enPassantCell = document.querySelector(`[data-row='${activeRow}'][data-col='${destinationCol}']`);
        enPassantCell.removeAttribute("data-piece");
        enPassantCell.removeAttribute("data-color");
    // Dark moved En Passant
    } else if (activePiece === "pawn" && activeColor === "dark" && activeRow === 4 && destinationCol === players.light.enPassant) {
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);

        const enPassantCell = document.querySelector(`[data-row='${activeRow}'][data-col='${destinationCol}']`);
        enPassantCell.removeAttribute("data-piece");
        enPassantCell.removeAttribute("data-color");
    // Castle short
    } else if (activePiece === "king" && (destinationCol === activeCol + 2 || destinationCol === activeCol + 3)) {
        const newKingCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol + 2}']`);
        newKingCell.setAttribute("data-piece", activePiece);
        newKingCell.setAttribute("data-color", activeColor);

        const newRookCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol + 1}']`);
        newRookCell.setAttribute("data-piece", "rook");
        newRookCell.setAttribute("data-color", activeColor);

        const oldRookCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol + 3}']`);
        oldRookCell.removeAttribute("data-piece");
        oldRookCell.removeAttribute("data-color");

        players[activeColor].canCastleLong = false;
        players[activeColor].canCastleShort = false;
    // Castle long
    } else if (activePiece === "king" && (destinationCol === activeCol - 2 || destinationCol === activeCol - 4)) {
        const newKingCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol - 2}']`);
        newKingCell.setAttribute("data-piece", activePiece);
        newKingCell.setAttribute("data-color", activeColor);

        const newRookCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol - 1}']`);
        newRookCell.setAttribute("data-piece", "rook");
        newRookCell.setAttribute("data-color", activeColor);

        const oldRookCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol - 4}']`);
        oldRookCell.removeAttribute("data-piece");
        oldRookCell.removeAttribute("data-color");

        players[activeColor].canCastleLong = false;
        players[activeColor].canCastleShort = false;
    // Rook moved, disable this side's castle
    } else if (activePiece === "rook") {
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
        if (activeCol === 1) {
            players[activeColor].canCastleLong = false;
        } else if (activeCol === 8) {
            players[activeColor].canCastleShort = false;
        }
    // King moved, disable castle
    }  else if (activePiece === "king") {
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
        players[activeColor].canCastleLong = false;
        players[activeColor].canCastleShort = false;
    } else {
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
    }

    ACTIVE_CELL.classList.remove("active", "highlight");
    ACTIVE_CELL.removeAttribute("data-piece");
    ACTIVE_CELL.removeAttribute("data-color");
    ACTIVE_CELL = null;
    clearHighlightedCells();
    setActiveCell(null);
}

function executeMove(destinationCell) {
    movePieceToNewDestination(destinationCell);
    players[CURRENT_PLAYER].moves++;
    CURRENT_PLAYER = (CURRENT_PLAYER === "light") ? "dark" : "light";
    players[CURRENT_PLAYER].enPassant = null;
    soundMove.play();
}

function isCheck(color) {
    const kingCell = document.querySelector(`[data-piece='king'][data-color='${color}']`);

    const enemyColor = (color === "light") ? "dark" : "light";
    const enemyPieces = document.querySelectorAll(`[data-color='${enemyColor}']`);

    let coveredCells = [];
    
    enemyPieces.forEach(piece => {
        coveredCells = coveredCells.concat(getCoveredCells(piece));
    });
    
    return coveredCells.includes(kingCell);
}

function selfCheckAfterMove(activeCell, destinationCell) {
    const activePiece = activeCell.dataset.piece;
    const activeColor = activeCell.dataset.color;
    const destinationPiece = destinationCell.dataset.piece;
    const destinationColor = destinationCell.dataset.color;

    // Make the move
    destinationCell.setAttribute("data-piece", activePiece);
    destinationCell.setAttribute("data-color", activeColor);
    activeCell.removeAttribute("data-piece");
    activeCell.removeAttribute("data-color");

    // See if it results in self check
    const result = isCheck(CURRENT_PLAYER);

    // Reset pieces
    activeCell.setAttribute("data-piece", activePiece);
    activeCell.setAttribute("data-color", activeColor);
    if (destinationPiece) {
        destinationCell.setAttribute("data-piece", destinationPiece);
        destinationCell.setAttribute("data-color", destinationColor);
    } else {
        destinationCell.removeAttribute("data-piece");
        destinationCell.removeAttribute("data-color");
    }

    return result;
}

function isCheckmate(color) {
    const playersPieces = document.querySelectorAll(`[data-color='${color}']`);

    let checkmate = true;

    playersPieces.forEach(piece => {
        const validDestinations = getValidDestinations(piece);
        validDestinations.forEach(destination => {
            if (!selfCheckAfterMove(piece, destination)) {
                checkmate = false;
            }
        });
    });

    return checkmate;
}

function selectPiece(cell) {
    clearHighlightedCells();
    setActiveCell(cell);
    VALID_DESTINATIONS = getValidDestinations(cell);
    VALID_DESTINATIONS.forEach(cell => highlightCell(cell));
}

function unselectPiece() {
    clearHighlightedCells();
    setActiveCell(null);
}

function initBoard() {
    let boardColor = "dark";

    for (let i = 8; i > 0; i--) {
        boardColor = (boardColor === "light") ? "dark" : "light";
        for (let j = 1; j < 9; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell", boardColor);
            cell.setAttribute("data-col", j);
            cell.setAttribute("data-row", i);
            
            const moveOverlay = document.createElement("div");
            moveOverlay.classList.add("move-overlay");

            cell.appendChild(moveOverlay);
            
            const takeOverlay = document.createElement("div");
            takeOverlay.classList.add("take-overlay");

            cell.appendChild(takeOverlay);

            let piece;
            let color;

            if (i <= 2 || i >= 7) {
                if (i <= 2) {
                    color = "light";
                } else if (i >= 7) {
                    color = "dark";
                }

                if (i === 2 || i === 7) {
                    piece = "pawn";
                } else if (j === 1 || j === 8 ) {
                    piece = "rook";
                } else if (j === 2 || j === 7) {
                    piece = "knight";  
                } else if (j === 3 || j === 6) {
                    piece = "bishop";
                } else if (j === 4) {
                    piece = "queen";
                } else {
                    piece = "king";
                }

                cell.setAttribute("data-piece", piece);
                cell.setAttribute("data-color", color);
            }

            cell.addEventListener("click", (e) => {
                const clickedCell = e.target;

                if (ACTIVE_CELL === clickedCell) {
                    unselectPiece();
                } else if (ACTIVE_CELL && VALID_DESTINATIONS.includes(clickedCell)) {
                    if (!selfCheckAfterMove(ACTIVE_CELL, clickedCell)) {
                        executeMove(clickedCell);
                    }
                    if (isCheckmate(CURRENT_PLAYER)) {
                        soundCheckmate.play();
                    }
                } else if (clickedCell.dataset.color === CURRENT_PLAYER) {
                    selectPiece(clickedCell);
                }
            });

            gridContainer.appendChild(cell);
            
            boardColor = (boardColor === "light") ? "dark" : "light";
        }
    }
}

initBoard();