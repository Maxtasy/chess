const nameInputForm = document.querySelector(".name-input-form");
const gameContainer = document.querySelector(".game-container");
const chessGridContainer = document.querySelector(".grid-container");
const playernameContainer = document.querySelector(".playername-container");
const infoText = document.querySelector(".info-text");
const readyButton = document.querySelector(".ready-button");
const readyButtonText = document.querySelector("#ready-button-text");
const readyButtonAnimation = document.querySelector(".ready-button .fa-spinner");
const playerNames = {};
playerNames["light"] = document.querySelector(".status-container .light .player-name");
playerNames["dark"] = document.querySelector(".status-container .dark .player-name");
const connectedIcons = {};
connectedIcons["light"] = document.querySelector(".status-container .light .connected");
connectedIcons["dark"] = document.querySelector(".status-container .dark .connected");
const readyIcons = {};
readyIcons["light"] = document.querySelector(".status-container .light .ready");
readyIcons["dark"] = document.querySelector(".status-container .dark .ready");
const chatInput = document.querySelector("#chat-input");
const chatOutput = document.querySelector("#chat-output");
const emoticonsButton = document.querySelector(".emoticons-button");
const emoticonsDisplayContainer = document.querySelector(".emoticons-display-container");
const emoticons = document.querySelectorAll(".emoticon");

const soundMove = new Audio();
soundMove.src = "../audio/Move.mp3";

const soundCheckmate = new Audio();
soundCheckmate.src = "../audio/Checkmate.mp3";

const soundPlayerJoined = new Audio();
soundPlayerJoined.src = "../audio/PlayerJoined.ogg";
soundPlayerJoined.volume = .5;

const soundMessageReceived = new Audio();
soundMessageReceived.src = "../audio/MessageReceived.ogg";
soundMessageReceived.volume = .5;

let ACTIVE_CELL = null;
let VALID_DESTINATIONS = null;
let CLIENT_COLOR = null;
let OPPONENT_COLOR = null;
let CLIENT_ID = null;
let CLIENT_NAME = null;

let GAME_INFO = {};

const socket = io();

socket.on("redirect-to-home", () => {
    window.location.href = `../`;
});

socket.on("identify-client", () => {
    CLIENT_ID = localStorage.getItem("clientId");
    CLIENT_NAME = localStorage.getItem("clientName");
    socket.emit("identify-client", {clientId: CLIENT_ID, clientName: CLIENT_NAME});
});

socket.on("client-id", clientId => {
    CLIENT_ID = clientId;
    localStorage.setItem("clientId", CLIENT_ID);
});

socket.on("update-client-game", gameInfo => {
    GAME_INFO = gameInfo;
    placePieces(GAME_INFO.boardState);
    playernameContainer.classList.remove("show");
    gameContainer.classList.add("show");
    if (GAME_INFO.players.light.id === CLIENT_ID) {
        CLIENT_COLOR = "light";
        OPPONENT_COLOR = "dark";
    } else if (GAME_INFO.players.dark.id === CLIENT_ID) {
        CLIENT_COLOR = "dark";
        OPPONENT_COLOR = "light";
    } else if (!GAME_INFO.players.light.id) {
        GAME_INFO.players.light.id = CLIENT_ID;
        GAME_INFO.players.light.name = CLIENT_NAME;
        CLIENT_COLOR = "light";
        OPPONENT_COLOR = "dark";
    } else if (!GAME_INFO.players.dark.id) {
        GAME_INFO.players.dark.id = CLIENT_ID;
        GAME_INFO.players.dark.name = CLIENT_NAME;
        CLIENT_COLOR = "dark";
        OPPONENT_COLOR = "light";
    } else {
        console.log("You joined spectators");
        return;
    }

    if (GAME_INFO.players[OPPONENT_COLOR].id) {
        playerNames[OPPONENT_COLOR].textContent = GAME_INFO.players[OPPONENT_COLOR].name;
        if (GAME_INFO.players[OPPONENT_COLOR].connected) {
            connectedIcons[OPPONENT_COLOR].classList.remove("fa-times");
            connectedIcons[OPPONENT_COLOR].classList.add("fa-check");
        }
        if (GAME_INFO.players[OPPONENT_COLOR].ready) {
            readyIcons[OPPONENT_COLOR].classList.remove("fa-times");
            readyIcons[OPPONENT_COLOR].classList.add("fa-check");
        }
        if (!GAME_INFO.started) {
            readyButtonText.textContent = "Ready";
            readyButtonAnimation.classList.remove("show");
            readyButton.classList.add("show");
        }
    } else {
        readyButton.classList.add("show");
    }

    connectedIcons[CLIENT_COLOR].classList.remove("fa-times");
    connectedIcons[CLIENT_COLOR].classList.add("fa-check");
    playerNames[CLIENT_COLOR].textContent = CLIENT_NAME;
    
    if (GAME_INFO.players[CLIENT_COLOR].ready) {
        readyIcons[CLIENT_COLOR].classList.remove("fa-times");
        readyIcons[CLIENT_COLOR].classList.add("fa-check");
    }

    if (GAME_INFO.players[OPPONENT_COLOR].ready) {
        readyIcons[OPPONENT_COLOR].classList.remove("fa-times");
        readyIcons[OPPONENT_COLOR].classList.add("fa-check");
    }

    if (GAME_INFO.players[OPPONENT_COLOR].connected) {
        connectedIcons[OPPONENT_COLOR].classList.remove("fa-times");
        connectedIcons[OPPONENT_COLOR].classList.add("fa-check");
    }

    if (GAME_INFO.started) {
        infoText.textContent = `Current turn: ${GAME_INFO.players[GAME_INFO.currentPlayer].name} (${GAME_INFO.currentPlayer})`;
    }

    socket.emit("player-connected", CLIENT_COLOR);
});

socket.on("player-connected", playerInfo => {
    connectedIcons[playerInfo.color].classList.remove("fa-times");
    connectedIcons[playerInfo.color].classList.add("fa-check");
    playerNames[playerInfo.color].textContent = playerInfo.name;

    GAME_INFO.players[playerInfo.color].connected = true;

    soundPlayerJoined.currentTime = 0;
    soundPlayerJoined.play();

    if (GAME_INFO.players[OPPONENT_COLOR].connected && !GAME_INFO.started) {
        readyButtonText.textContent = "Ready";
        readyButtonAnimation.classList.remove("show");
        infoText.textContent = `Ready up to start the game.`;
    }
});

socket.on("player-disconnected", color => {
    connectedIcons[color].classList.remove("fa-check");
    connectedIcons[color].classList.add("fa-times");

    if (GAME_INFO.over) {
        return;
    } else if (!GAME_INFO.started) {
        readyButton.classList.add("show");
        readyButtonAnimation.classList.add("show");
        playerNames[color].textContent = color;
        readyButtonText.textContent = "Waiting for Opponent ";
        infoText.textContent = `Invite a player by sending them the URL.`;
    }
});

socket.on("player-ready", color => {
    readyIcons[color].classList.remove("fa-times");
    readyIcons[color].classList.add("fa-check");
    GAME_INFO.players[color].ready = true;

    if (GAME_INFO.players.light.ready && GAME_INFO.players.dark.ready) {
        GAME_INFO.started = true;
        infoText.textContent = `Current turn: ${GAME_INFO.players[GAME_INFO.currentPlayer].name} (${GAME_INFO.currentPlayer})`;
    }
});

socket.on("executed-move", move => {
    const activeCell = document.querySelector(`[data-row='${move.active.row}'][data-col='${move.active.col}']`);
    const destinationCell = document.querySelector(`[data-row='${move.destination.row}'][data-col='${move.destination.col}']`);
    setActiveCell(activeCell);
    executeMove(destinationCell, true);
});

socket.on("text-chat", textChatInfo => {
    chatOutput.value += `${textChatInfo.name}: ${textChatInfo.text}\n`;
    chatOutput.scrollTop = chatOutput.scrollHeight;
    soundMessageReceived.currentTime = 0;
    soundMessageReceived.play();
});

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

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    topEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (botEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol}']`);

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

            const possibleCell = document.querySelector(`[data-row='${cellRow + i}'][data-col='${cellCol}']`);

            if (possibleCell) {
                if (possibleCell.dataset.piece) {
                    topEnd = true;
                }
                coveredCells.push(possibleCell);
            }
        }
        
        for (let i = 1; i < 8; i++) {
            if (botEnd) break;

            const possibleCell = document.querySelector(`[data-row='${cellRow - i}'][data-col='${cellCol}']`);

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
        if (cellTop && !cellTop.dataset.piece && !selfCheckAfterMove(cell, cellTop)) {
            validDestinations.push(cellTop);
        }
        // Two forward from initial board position
        const cellTopTop = document.querySelector(`[data-row='${cellRow + 2}'][data-col='${cellCol}']`);
        if (cellRow === 2 && !cellTop.dataset.piece && !cellTopTop.dataset.piece && !selfCheckAfterMove(cell, cellTopTop)) {
            validDestinations.push(cellTopTop);
        }
        // Take piece diagonally left
        const cellDiagLeft = document.querySelector(`[data-row='${cellRow + 1}'][data-col='${cellCol - 1}']`);
        if (cellDiagLeft && cellDiagLeft.dataset.piece && cellDiagLeft.dataset.color === "dark" && !selfCheckAfterMove(cell, cellDiagLeft)) {
            validDestinations.push(cellDiagLeft);
        }
        // Take piece diagonally right
        const cellDiagRight = document.querySelector(`[data-row='${cellRow + 1}'][data-col='${cellCol + 1}']`);
        if (cellDiagRight && cellDiagRight.dataset.piece && cellDiagRight.dataset.color === "dark" && !selfCheckAfterMove(cell, cellDiagRight)) {
            validDestinations.push(cellDiagRight);
        }
        // En Passant diagonally left
        if (GAME_INFO.players.dark.enPassant === cellCol - 1  && cellRow === 5 && !selfCheckAfterMove(cell, cellDiagLeft)) {
            validDestinations.push(cellDiagLeft);
        }
        // En Passant diagonally right
        if (GAME_INFO.players.dark.enPassant === cellCol + 1  && cellRow === 5 && !selfCheckAfterMove(cell, cellDiagRight)) {
            validDestinations.push(cellDiagRight);
        }
    } else if (cellPiece === "pawn" && cellColor === "dark") {
        // One forward from initial board position
        const cellBot = document.querySelector(`[data-row='${cellRow - 1}'][data-col='${cellCol}']`);
        if (cellBot && !cellBot.dataset.piece && !selfCheckAfterMove(cell, cellBot)) {
            validDestinations.push(cellBot);
        }
        // Two forward from initial board position
        const cellBotBot = document.querySelector(`[data-row='${cellRow - 2}'][data-col='${cellCol}']`);
        if (cellRow === 7 && !cellBot.dataset.piece && !cellBotBot.dataset.piece && !selfCheckAfterMove(cell, cellBotBot)) {
            validDestinations.push(cellBotBot);
        }
        // Take piece diagonally left
        const cellDiagLeft = document.querySelector(`[data-row='${cellRow - 1}'][data-col='${cellCol - 1}']`);
        if (cellDiagLeft && cellDiagLeft.dataset.piece && cellDiagLeft.dataset.color === "light" && !selfCheckAfterMove(cell, cellDiagLeft)) {
            validDestinations.push(cellDiagLeft);
        }
        // Take piece diagonally right
        const cellDiagRight = document.querySelector(`[data-row='${cellRow - 1}'][data-col='${cellCol + 1}']`);
        if (cellDiagRight && cellDiagRight.dataset.piece && cellDiagRight.dataset.color === "light" && !selfCheckAfterMove(cell, cellDiagRight)) {
            validDestinations.push(cellDiagRight);
        }
        // En Passant diagonally left
        if (GAME_INFO.players.light.enPassant === cellCol - 1  && cellRow === 4 && !selfCheckAfterMove(cell, cellDiagLeft)) {
            validDestinations.push(cellDiagLeft);
        }
        // En Passant diagonally right
        if (GAME_INFO.players.light.enPassant === cellCol + 1  && cellRow === 4 && !selfCheckAfterMove(cell, cellDiagRight)) {
            validDestinations.push(cellDiagRight);
        }
    } else if (cellPiece === "knight") {
        const movePattern = [[2, -1], [2, 1], [1, -2], [1, 2], [-1, -2], [-1, 2], [-2, -1],  [-2, 1]];
        movePattern.forEach(move => {
            const possibleCell = document.querySelector(`[data-row='${cellRow + move[0]}'][data-col='${cellCol + move[1]}']`);
            
            if (possibleCell && (!possibleCell.dataset.piece || possibleCell.dataset.color !== cellColor) && !selfCheckAfterMove(cell, possibleCell)) {
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
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
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color !== cellColor) {
                    if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
                    botEnd = true;
                } else if (possibleCell.dataset.piece && possibleCell.dataset.color === cellColor) {
                    botEnd = true;
                }
            }
        }
    } else if (cellPiece === "king") {
        const movePattern = [[1, -1], [1, 0], [1, 1], [0, -1], [0, 1], [-1, -1], [-1, 0], [-1, 1]];

        movePattern.forEach(move => {
            const possibleCell = document.querySelector(`[data-row='${cellRow + move[0]}'][data-col='${cellCol + move[1]}']`);
            
            if (possibleCell && (!possibleCell.dataset.piece || possibleCell.dataset.color !== cellColor)) {
                if (!selfCheckAfterMove(cell, possibleCell)) validDestinations.push(possibleCell);
            }
        });

        if (!isCheck(GAME_INFO.currentPlayer)) {
            // Castle Short
    
            const cellRight = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol + 1}']`);
            const cellRightRight = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol + 2}']`);
            const cellRightRightRight = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol + 3}']`);
            if (GAME_INFO.players[GAME_INFO.currentPlayer].canCastleShort &&
                !cellRight.dataset.piece &&
                !cellRightRight.dataset.piece &&
                !selfCheckAfterMove(cell, cellRight) &&
                !selfCheckAfterMove(cell, cellRightRight))
            {
                validDestinations.push(cellRightRight);
                validDestinations.push(cellRightRightRight);
            }
    
            // Castle Long
            const cellLeft = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - 1}']`);
            const cellLeftLeft = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - 2}']`);
            const cellLeftLeftLeft = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - 3}']`);
            const cellLeftLeftLeftLeft = document.querySelector(`[data-row='${cellRow}'][data-col='${cellCol - 4}']`);
            if (GAME_INFO.players[GAME_INFO.currentPlayer].canCastleLong &&
                !cellLeft.dataset.piece &&
                !cellLeftLeft.dataset.piece &&
                !cellLeftLeftLeft.dataset.piece &&
                !selfCheckAfterMove(cell, cellLeft) &&
                !selfCheckAfterMove(cell, cellLeftLeft))
            {
                validDestinations.push(cellLeftLeft);
                validDestinations.push(cellLeftLeftLeftLeft);
            }
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
        cell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[destinationRow][destinationCol].piece = "queen";
        GAME_INFO.boardState[destinationRow][destinationCol].color = activeColor;
    } else if (activePiece === "pawn" && activeColor === "dark" && destinationRow === 1) {
        cell.setAttribute("data-piece", "queen");
        cell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[destinationRow][destinationCol].piece = "queen";
        GAME_INFO.boardState[destinationRow][destinationCol].color = activeColor;
    // Enable En Passant if pawn moves 2 cells forward
    } else if (activePiece === "pawn" && activeColor === "light" && activeRow === 2 && destinationRow === 4) {
        GAME_INFO.players.light.enPassant = activeCol;
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[destinationRow][destinationCol].piece = activePiece;
        GAME_INFO.boardState[destinationRow][destinationCol].color = activeColor;
    } else if (activePiece === "pawn" && activeColor === "dark" && activeRow === 7 && destinationRow === 5) {
        GAME_INFO.players.dark.enPassant = activeCol;
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[destinationRow][destinationCol].piece = activePiece;
        GAME_INFO.boardState[destinationRow][destinationCol].color = activeColor;
    // Light moved En Passant
    } else if (activePiece === "pawn" && activeColor === "light" && activeRow === 5 && destinationCol === GAME_INFO.players.dark.enPassant) {
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[destinationRow][destinationCol].piece = activePiece;
        GAME_INFO.boardState[destinationRow][destinationCol].color = activeColor;

        const enPassantCell = document.querySelector(`[data-row='${activeRow}'][data-col='${destinationCol}']`);
        enPassantCell.removeAttribute("data-piece");
        enPassantCell.removeAttribute("data-color");
        GAME_INFO.boardState[activeRow][destinationCol].piece = null;
        GAME_INFO.boardState[activeRow][destinationCol].color = null;
    // Dark moved En Passant
    } else if (activePiece === "pawn" && activeColor === "dark" && activeRow === 4 && destinationCol === GAME_INFO.players.light.enPassant) {
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[destinationRow][destinationCol].piece = activePiece;
        GAME_INFO.boardState[destinationRow][destinationCol].color = activeColor;

        const enPassantCell = document.querySelector(`[data-row='${activeRow}'][data-col='${destinationCol}']`);
        enPassantCell.removeAttribute("data-piece");
        enPassantCell.removeAttribute("data-color");
        GAME_INFO.boardState[activeRow][destinationCol].piece = null;
        GAME_INFO.boardState[activeRow][destinationCol].color = null;
    // Castle short
    } else if (activePiece === "king" && (destinationCol === activeCol + 2 || destinationCol === activeCol + 3)) {
        const newKingCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol + 2}']`);
        newKingCell.setAttribute("data-piece", activePiece);
        newKingCell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[activeRow][activeCol + 2].piece = activePiece;
        GAME_INFO.boardState[activeRow][activeCol + 2].color = activeColor;

        const newRookCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol + 1}']`);
        newRookCell.setAttribute("data-piece", "rook");
        newRookCell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[activeRow][activeCol + 1].piece = "rook";
        GAME_INFO.boardState[activeRow][activeCol + 1].color = activeColor;

        const oldRookCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol + 3}']`);
        oldRookCell.removeAttribute("data-piece");
        oldRookCell.removeAttribute("data-color");
        GAME_INFO.boardState[activeRow][activeCol + 3].piece = null;
        GAME_INFO.boardState[activeRow][activeCol + 3].color = null;

        GAME_INFO.players[activeColor].canCastleLong = false;
        GAME_INFO.players[activeColor].canCastleShort = false;
    // Castle long
    } else if (activePiece === "king" && (destinationCol === activeCol - 2 || destinationCol === activeCol - 4)) {
        const newKingCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol - 2}']`);
        newKingCell.setAttribute("data-piece", activePiece);
        newKingCell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[activeRow][activeCol - 2].piece = activePiece;
        GAME_INFO.boardState[activeRow][activeCol - 2].color = activeColor;

        const newRookCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol - 1}']`);
        newRookCell.setAttribute("data-piece", "rook");
        newRookCell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[activeRow][activeCol - 1].piece = "rook";
        GAME_INFO.boardState[activeRow][activeCol - 1].color = activeColor;

        const oldRookCell = document.querySelector(`[data-row='${activeRow}'][data-col='${activeCol - 4}']`);
        oldRookCell.removeAttribute("data-piece");
        oldRookCell.removeAttribute("data-color");
        GAME_INFO.boardState[activeRow][activeCol - 4].piece = null;
        GAME_INFO.boardState[activeRow][activeCol - 4].color = null;

        GAME_INFO.players[activeColor].canCastleLong = false;
        GAME_INFO.players[activeColor].canCastleShort = false;
    // Rook moved, disable this side's castle
    } else if (activePiece === "rook") {
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[destinationRow][destinationCol].piece = activePiece;
        GAME_INFO.boardState[destinationRow][destinationCol].color = activeColor;
        if (activeCol === 1) {
            GAME_INFO.players[activeColor].canCastleLong = false;
        } else if (activeCol === 8) {
            GAME_INFO.players[activeColor].canCastleShort = false;
        }
    // King moved, disable castle
    }  else if (activePiece === "king") {
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[destinationRow][destinationCol].piece = activePiece;
        GAME_INFO.boardState[destinationRow][destinationCol].color = activeColor;

        GAME_INFO.players[activeColor].canCastleLong = false;
        GAME_INFO.players[activeColor].canCastleShort = false;
    } else {
        cell.setAttribute("data-piece", activePiece);
        cell.setAttribute("data-color", activeColor);
        GAME_INFO.boardState[destinationRow][destinationCol].piece = activePiece;
        GAME_INFO.boardState[destinationRow][destinationCol].color = activeColor;
    }

    ACTIVE_CELL.classList.remove("active", "highlight");

    // Set highlights for last move
    clearLastMoveHighlights();
    ACTIVE_CELL.classList.add("last-move-highlight");
    cell.classList.add("last-move-highlight");

    ACTIVE_CELL.removeAttribute("data-piece");
    ACTIVE_CELL.removeAttribute("data-color");
    GAME_INFO.boardState[activeRow][activeCol].piece = null;
    GAME_INFO.boardState[activeRow][activeCol].color = null;
    ACTIVE_CELL = null;
    clearHighlightedCells();
    setActiveCell(null);
}

function clearLastMoveHighlights() {
    document.querySelectorAll(".last-move-highlight").forEach(cell => {
        cell.classList.remove("last-move-highlight");
    });
}

function executeMove(destinationCell, wasOpponentMove) {
    clearCheckedKingHighlight(GAME_INFO.currentPlayer);

    if (!wasOpponentMove) {
        const active = {
            row: parseInt(ACTIVE_CELL.dataset.row),
            col: parseInt(ACTIVE_CELL.dataset.col),
        };
        const destination = {
            row: parseInt(destinationCell.dataset.row),
            col: parseInt(destinationCell.dataset.col)
        };
        const move = {
            active: active,
            destination: destination
        }
        socket.emit("executed-move", move);
    }

    movePieceToNewDestination(destinationCell);

    GAME_INFO.currentPlayer = (GAME_INFO.currentPlayer === "light") ? "dark" : "light";
    GAME_INFO.players[GAME_INFO.currentPlayer].enPassant = null;
    soundMove.play();
    
    if (isCheck(GAME_INFO.currentPlayer)) {
        highlightCheckedKing(GAME_INFO.currentPlayer);
    }

    if (isCheckmate(GAME_INFO.currentPlayer)) {
        soundCheckmate.play();
        infoText.textContent = `${GAME_INFO.currentPlayer} is checkmate`;
        GAME_INFO.over = true;
    } else if (!isCheck(GAME_INFO.currentPlayer) && !hasValidMoves(GAME_INFO.currentPlayer)) {
        soundCheckmate.play();
        infoText.textContent = `Stalemate`;
        GAME_INFO.over = true;
    } else {
        infoText.textContent = `Current turn: ${GAME_INFO.players[GAME_INFO.currentPlayer].name} (${GAME_INFO.currentPlayer})`;
    }
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
    const result = isCheck(GAME_INFO.currentPlayer);

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
    if (!isCheck(color)) return;
    const playersPieces = document.querySelectorAll(`[data-color='${color}']`);

    let checkmate = true;

    playersPieces.forEach(piece => {
        const validDestinations = getValidDestinations(piece);
        if (!validDestinations) return;
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

function hasValidMoves(color) {
    const playersPieces = document.querySelectorAll(`[data-color='${color}']`);

    let availableMoves = [];
    playersPieces.forEach(piece => {
        availableMoves = availableMoves.concat(getValidDestinations(piece));
    });

    if (availableMoves.length === 0) {
        return false;
    } else {
        return true;
    }
}

function clearCheckedKingHighlight(color) {
    const kingCell = document.querySelector(`[data-piece='king'][data-color='${color}']`);
    kingCell.classList.remove("checked");
}

function highlightCheckedKing(color) {
    const kingCell = document.querySelector(`[data-piece='king'][data-color='${color}']`);
    kingCell.classList.add("checked");
}

function initBoard() {
    GAME_INFO["boardState"] = {};

    const fileLetters = {
        1: "a",
        2: "b",
        3: "c",
        4: "d",
        5: "e",
        6: "f",
        7: "g",
        8: "h"
    }

    let boardColor = "dark";

    for (let i = 8; i >= 1; i--) {
        boardColor = (boardColor === "light") ? "dark" : "light";
        GAME_INFO.boardState[i] = {};

        for (let j = 1; j <= 8; j++) {
            GAME_INFO.boardState[i][j] = {};
            const cell = document.createElement("div");
            cell.setAttribute("data-row", i);
            cell.setAttribute("data-col", j);
            cell.classList.add("cell", boardColor);

            if (j === 8) {
                const label = document.createElement("span");
                label.style.position = "absolute";
                label.style.right = 0;
                label.style.top = 0;
                label.style.margin = ".25em .5em";
                label.style.fontSize = ".5rem";
                if (i % 2 === 0) {
                    label.style.color = "white";
                } else {
                    label.style.color = "black";
                }
                label.textContent = i;
                cell.appendChild(label);
            }

            if (i === 1) {
                const label = document.createElement("span");
                label.style.position = "absolute";
                label.style.left = 0;
                label.style.bottom = 0;
                label.style.margin = ".25em .5em";
                label.style.fontSize = ".5rem";
                if (j % 2 === 0) {
                    label.style.color = "black";
                } else {
                    label.style.color = "white";
                }
                label.textContent = fileLetters[j];
                cell.appendChild(label);
            }
            
            const moveOverlay = document.createElement("div");
            moveOverlay.classList.add("move-overlay");

            cell.appendChild(moveOverlay);
            
            const takeOverlay = document.createElement("div");
            takeOverlay.classList.add("take-overlay");

            cell.appendChild(takeOverlay);

            cell.addEventListener("click", (e) => {
                const cell = e.target;
                handleCellClick(cell);
            });

            chessGridContainer.appendChild(cell);
            
            boardColor = (boardColor === "light") ? "dark" : "light";
        }
    }
}

function placePieces(boardState) {
    Object.keys(boardState).forEach(row => {
        Object.keys(boardState[row]).forEach(col => {
            GAME_INFO.boardState[row][col].piece = boardState[row][col].piece;
            GAME_INFO.boardState[row][col].color = boardState[row][col].color;
            if (boardState[row][col].piece) {
                document.querySelector(`[data-row='${row}'][data-col='${col}']`).setAttribute("data-piece", boardState[row][col].piece);
                document.querySelector(`[data-row='${row}'][data-col='${col}']`).setAttribute("data-color", boardState[row][col].color);
            }
        });
    });
}

function handleCellClick(cell) {
    if (GAME_INFO.currentPlayer !== CLIENT_COLOR || !GAME_INFO.started || GAME_INFO.over) return;

    if (ACTIVE_CELL === cell) {
        unselectPiece();
    } else if (ACTIVE_CELL && VALID_DESTINATIONS.includes(cell)) {
        if (!selfCheckAfterMove(ACTIVE_CELL, cell)) {
            executeMove(cell);
            socket.emit("store-gamestate", GAME_INFO);
        }
    } else if (cell.dataset.color === GAME_INFO.currentPlayer) {
        selectPiece(cell);
    }
}

readyButton.addEventListener("click", () => {
    if (!GAME_INFO.players[OPPONENT_COLOR].connected) return;

    socket.emit("client-ready", CLIENT_COLOR);

    GAME_INFO.players[CLIENT_COLOR].ready = true;
    readyIcons[CLIENT_COLOR].classList.remove("fa-times");
    readyIcons[CLIENT_COLOR].classList.add("fa-check");

    if (GAME_INFO.players.light.ready && GAME_INFO.players.dark.ready) {
        GAME_INFO.started = true;
        infoText.textContent = `Current turn: ${GAME_INFO.players[GAME_INFO.currentPlayer].name} (${GAME_INFO.currentPlayer})`;
    } else {
        infoText.textContent = `Waiting for opponent to ready up.`;
    }

    readyButton.classList.remove("show");
});

chatInput.addEventListener("keyup", e => {
    if (!CLIENT_COLOR) return;
    if (e.keyCode === 13) {
        const text = chatInput.value;
        if (!text) return;
        chatOutput.value += `${CLIENT_NAME}: ${text}\n`;
        chatInput.value = "";
        chatOutput.scrollTop = chatOutput.scrollHeight;
        
        const textChatInfo = {
            name: CLIENT_NAME,
            text: text
        }
        socket.emit("text-chat", textChatInfo);
    }
});

emoticonsButton.addEventListener("click", () => {
    emoticonsDisplayContainer.classList.toggle("show");
});

emoticons.forEach(emoticon => {
    emoticon.addEventListener("click", (e) => {
        chatInput.value += e.target.innerText;
        chatInput.focus();
        emoticonsDisplayContainer.classList.remove("show");
    });
});

nameInputForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = e.target.elements["name-input"].value;
    if (name && name.length < 20) {
        CLIENT_NAME = name;
        localStorage.setItem("clientName", name);
        socket.emit("identify-client", {clientId: CLIENT_ID, clientName: CLIENT_NAME});
    }
});

initBoard();

chatOutput.value = "";
chatInput.value = "";