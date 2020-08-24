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

// sockets stays open, we can just add variables in here
io.on("connect", socket => {
    const clientId = guid();
    console.log(`Client (${clientId}) connected to server.`);

    let role;

    if (!players.light.id) {
        players.light.id = clientId;
        role = "light";
        console.log(`Client (${clientId}) is set to player light.`);
    }
    else if (!players.dark.id) {
        players.dark.id = clientId;
        role = "dark";
        console.log(`Client (${clientId}) is set to player dark.`);
    }
    else {
        role = "spectator";
        console.log(`Client (${clientId}) joined spectators.`);
    }

    const gameInfo = {
        role: role,
        players: players
    };

    socket.emit("game-info", gameInfo);

    socket.on("player-connected", color => {
        players[color].connected = true;
        socket.broadcast.emit("player-connected", color);
    });

    socket.on("client-ready", color => {
        players[color].ready = true;
        socket.broadcast.emit("player-ready", color);
    });

    socket.on("executed-move", moveInfo => {
        socket.broadcast.emit("executed-move", moveInfo);
    });

    socket.on("disconnect", () => {
        console.log(`Client (${clientId}) left the server.`);
        if (players.light.id === clientId) {
            players.light.id = null;
            console.log(`Light player left the server.`);
        } else if (players.dark.id === clientId) {
            players.dark.id = null;
            console.log(`Dark player left the server.`);
        }
    });
});

// Code to gerenate GUIDs
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
} 

function guid() {    
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}