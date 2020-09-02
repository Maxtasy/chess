const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Start server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

const games = {}

// sockets stays open, we can just add variables in here
io.on("connect", socket => {
    console.log(`Unknown client has connected.`)
    let CLIENT_ID = null;
    let CLIENT_NAME = null;
    let CLIENT_COLOR = null;

    // Check if client entered a valid URL
    const UrlParams = socket.handshake.headers.referer.split("?")[1];

    if (!UrlParams || !UrlParams.includes("id")) {
        console.log(`Client enteres invalid game id and has been redirected.`)
        socket.emit("redirect-to-home");
        return;
    } else {
        socket.emit("identify-client");
    }
    
    // Set game ID
    const gameId = UrlParams.replace("id=" , "");

    // Create game if necessary
    if (!games[gameId]) {
        createNewGame(gameId);
    }

    socket.on("identify-client", clientInfo => {
        CLIENT_ID = clientInfo.clientId;
        CLIENT_NAME = clientInfo.clientName;

        if (CLIENT_ID && CLIENT_NAME) {
            socket.emit("update-client-game", games[gameId]);
        } else {
            CLIENT_ID = guid();
            socket.emit("client-id", CLIENT_ID);
        }
    });

    socket.on("player-connected", color => {
        CLIENT_COLOR = color;
        games[gameId].players[color].id = CLIENT_ID;
        games[gameId].players[color].name = CLIENT_NAME;
        games[gameId].players[color].connected = true;
        socket.broadcast.emit("player-connected", {color: color, name: CLIENT_NAME});
    });

    socket.on("client-ready", color => {
        games[gameId].players[color].ready = true;
        socket.broadcast.emit("player-ready", color);
    });

    socket.on("executed-move", moveInfo => {
        socket.broadcast.emit("executed-move", moveInfo);
    });

    socket.on("store-gamestate", gameInfo => {
        games[gameId] = gameInfo;
    });

    socket.on("disconnect", () => {
        if (!games[gameId]) return;
        console.log(`Client (${CLIENT_ID}) left the server.`);

        if (!games[gameId].started) {
            if (games[gameId].players.light.id === CLIENT_ID) {
                games[gameId].players.light.id = null;
                games[gameId].players.light.name = null;
                games[gameId].players.light.connected = false;
                games[gameId].players.light.ready = false;
                console.log(`Light player left the server.`);
            } else if (games[gameId].players.dark.id === CLIENT_ID) {
                games[gameId].players.dark.id = null;
                games[gameId].players.dark.name = null;
                games[gameId].players.dark.connected = false;
                games[gameId].players.dark.ready = false;
                console.log(`Dark player left the server.`);
            }
        }

        socket.broadcast.emit("player-disconnected", CLIENT_COLOR);

        if (!games[gameId].players.light.id && !games[gameId].players.dark.id) {
            delete games[gameId];
        }
    });

    socket.on("text-chat", textChatInfo => {
        socket.broadcast.emit("text-chat", textChatInfo);
    });
});

function createNewGame(gameId) {
    const boardState = {};

    for (let i = 1; i <= 8; i++) {
        boardState[i] = {};
        for (let j = 1; j <= 8; j++) {
            boardState[i][j] = {};

            let color = null;
            let piece = null;

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
            }
            boardState[i][j].color = color;
            boardState[i][j].piece = piece;
        }
    }

    games[gameId] = {
        started: false,
        over: false,
        currentPlayer: "light",
        moveCount: 0,
        boardState: boardState,
        players: {
            light: {
                id: null,
                name: null,
                connected: false,
                ready: false,
                timeBank: 900,
                disconnectTimer: 90,
                enPassant: null,
                canCastleLong: true,
                canCastleShort: true
            },
            dark: {
                id: null,
                name: null,
                connected: false,
                ready: false,
                timeBank: 900,
                disconnectTimer: 90,
                enPassant: null,
                canCastleLong: true,
                canCastleShort: true
            }
        }
    };

    console.log(`New game (${gameId}) has been created.`)
}

// Code to gerenate GUIDs
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
} 

function guid() {    
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}