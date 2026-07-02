import {currentSession, setGameActive } from "./state.js"

export function setupWelcomeScreen({
    welcomeScreen,
    gameScreen,
    startGameButton,
    playerOneInput,
    playerTwoInput,
    playerTwoSection,
    modeInputs,
    startGame
}) {

    // Show/hide second player
    modeInputs.forEach(input => {
        input.addEventListener("change", () => {
            const selectedMode = document.querySelector("input[name='play-mode']:checked").value;

            if (selectedMode === "pair") {
                playerTwoSection.classList.remove("hidden");
            } else {
                playerTwoSection.classList.add("hidden")
            }

        });
    });

    // Start Button
    startGameButton.addEventListener("click", () => {
        const playerOneName = playerOneInput.value.trim();
        const selectedMode = document.querySelector("input[name='play-mode']:checked").value;

        if (!playerOneName) {
            alert("Please enter your first name.");
            return;
        }

        currentSession.players = [playerOneName];
        currentSession.mode = selectedMode;
        currentSession.startTime = Date.now();
        currentSession.endTime = null;
        currentSession.completed = false;

        if (selectedMode === 'pair') {
            const playerTwoName = playerTwoInput.value.trim();

            if (!playerTwoName) {
                alert("Please enter your partners first name.");
                return;
            }

            currentSession.players.push(playerTwoName);
        }

        setGameActive(true);

        welcomeScreen.classList.add("hidden");
        gameScreen.classList.remove("hidden");

        startGame();

        console.log("Session started.", currentSession);

    });
}