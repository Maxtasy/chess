const multiplayerButton = document.querySelector("#multiplayer-button");
const createGameButton = document.querySelector("#create-game");

multiplayerButton.addEventListener("click", () => {
    const gameId = guid();
    window.location.href = `/multiplayer/index.html?gameId=${gameId}`;
});

// Code to gerenate GUIDs
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
} 

function guid() {    
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}