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
    const UrlParams = socket.handshake.headers.referer.split("?")[1];
    console.log(UrlParams)
    if (!UrlParams || !UrlParams.includes("gameId")) {
        socket.emit("invalid-gameId");
        return;
    }

    const gameId = UrlParams.replace("gameId=" , "");
    const clientId = guid();
    console.log(`Client (${clientId}) connected to server.`);

    if (!games[gameId]) {
        console.log(`New game (${gameId}) has been created.`)
        const players = {
            light: {
                id: null,
                connected: false,
                ready: false
            },
            dark: {
                id: null,
                connected: false,
                ready: false
            }
        };
        
        games[gameId] = {
            started: false,
            players: players
        };
    }

    let role;

    if (!games[gameId].players.light.id) {
        games[gameId].players.light.id = clientId;
        role = "light";
        console.log(`Client (${clientId}) is set to player light.`);
    }
    else if (!games[gameId].players.dark.id) {
        games[gameId].players.dark.id = clientId;
        role = "dark";
        console.log(`Client (${clientId}) is set to player dark.`);
    }
    else {
        role = "spectator";
        console.log(`Client (${clientId}) joined spectators.`);
    }

    const gameInfo = {
        role: role,
        game: games[gameId]
    };

    socket.emit("game-info", gameInfo);

    socket.on("player-connected", color => {
        games[gameId].players[color].connected = true;
        socket.broadcast.emit("player-connected", color);
    });

    socket.on("client-ready", color => {
        games[gameId].players[color].ready = true;
        socket.broadcast.emit("player-ready", color);
    });

    socket.on("executed-move", moveInfo => {
        socket.broadcast.emit("executed-move", moveInfo);
    });

    socket.on("disconnect", () => {
        if (!games[gameId]) return;
        console.log(`Client (${clientId}) left the server.`);
        if (games[gameId].players.light.id === clientId) {
            games[gameId].players.light.id = null;
            games[gameId].players.light.connected = false;
            games[gameId].players.light.ready = false;
            console.log(`Light player left the server.`);
            socket.broadcast.emit("player-disconnected", "light");
        } else if (games[gameId].players.dark.id === clientId) {
            games[gameId].players.dark.id = null;
            games[gameId].players.dark.connected = false;
            games[gameId].players.dark.ready = false;
            console.log(`Dark player left the server.`);
            socket.broadcast.emit("player-disconnected", "dark");
        }

        if (!games[gameId].players.light.id && !games[gameId].players.dark.id) {
            delete games[gameId];
        }
    });

    socket.on("text-chat", textChatInfo => {
        socket.broadcast.emit("text-chat", textChatInfo);
    });
});

// Code to gerenate GUIDs
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
} 

function guid() {    
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}