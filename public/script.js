const multiplayerButton = document.querySelector("#multiplayer-button");
const gameSetupContainer = document.querySelector(".game-setup");
const createGameButton = document.querySelector("#create-game");
const joinGameButton = document.querySelector("#join-game");
const joinCodeInput = document.querySelector("#join-code");
const joinCodeOutput = document.querySelector("#join-code-output");

let gameId = null;

multiplayerButton.addEventListener("click", () => {
    gameSetupContainer.classList.toggle("show");
});

createGameButton.addEventListener("click", () => {
    gameId = guid();
    joinCodeOutput.textContent = gameId;
});

joinGameButton.addEventListener("click", () => {
    const id = joinCodeInput.value || gameId;
    window.location.href = "multiplayer.html";
});

// Code to gerenate GUIDs
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
} 

function guid() {    
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}