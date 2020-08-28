const multiplayerButton = document.querySelector("#multiplayer-button");

multiplayerButton.addEventListener("click", () => {
    const gameId = guid();
    window.location.href = `/web/index.html?id=${gameId}`;
});

// Code to gerenate GUIDs
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
} 

function guid() {    
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}