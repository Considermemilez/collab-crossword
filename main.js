import "./supabaseClient.js";
import { setupAuthUI } from "./authUI.js";
import "./script.js";

function updateStartGameAuthgate({ user, profile }) {
    const startGameButton = document.getElementById("start-game-btn");
    const playerOneInput = document.getElementById("player-one-name");

    const hasDisplayName = 
        profile?.display_name &&
        profile.display_name.trim().length > 0;

    const canStartgame = Boolean(user && hasDisplayName);

    startGameButton.disabled = !canStartgame;

    if (canStartgame) {
        startGameButton.textContent = "Start Game";

        if (playerOneInput) {
            playerOneInput.value = profile.display_name;
        }

        return;
    }

    startGameButton.textContent = "Sign in to Start Game";
}

setupAuthUI({
    authStatus: document.getElementById("auth-status"),
    authEmailInput: document.getElementById("auth-email"),
    authPasswordInput: document.getElementById("auth-password"),
    signUpButton: document.getElementById("auth-sign-up-btn"),
    signInButton: document.getElementById("auth-sign-in-btn"),
    signOutButton: document.getElementById("auth-sign-out-btn"),
    profilePanel: document.getElementById("profile-panel"),
    profileDisplayNameInput: document.getElementById("profile-display-name"),
    profileSaveButton: document.getElementById("profile-save-btn"),
    onDisplayNameAvailable: (displayName) => {
        const playerOneInput = document.getElementById("player-one-name");

        if (playerOneInput) {
            playerOneInput.value = displayName;
        }
    },
    onAuthStateChange: updateStartGameAuthgate
});

