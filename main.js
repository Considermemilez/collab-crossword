import "./supabaseClient.js";
import { setupAuthUI } from "./authUI.js";
import { 
    createCrosswordRoom,
    getCrosswordRoomSummaries,
    joinRoom
} from "./roomService.js";
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

        refreshRoomList();

        return;
    }

    startGameButton.textContent = "Sign in to Start Game";

    if (roomList) {
        roomList.textContent = "Sign in to see available rooms."
    }
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

const roomNameInput = document.getElementById("room-name-input");
const roomVisibilitySelect = document.getElementById("room-visibility-select");
const createRoomButton = document.getElementById("create-room-btn");
const createRoomStatus = document.getElementById("create-room-status");
const puzzleSelect = document.getElementById("puzzle-select");
const refreshRoomsButton = document.getElementById("refresh-rooms-btn");
const roomList = document.getElementById("room-list");

createRoomButton.addEventListener("click", async () => {
    createRoomStatus.textContent = "Creating room...";

    const room = await createCrosswordRoom({
        roomName: roomNameInput.value,
        visibility: roomVisibilitySelect.value,
        puzzleId: puzzleSelect.value,
        mode: "pair"
    });

    if (!room) {
        createRoomStatus.textContent = "Could not create room. Check the console.";
        return;
    }

    createRoomStatus.textContent = `Created room: ${room.room_name}`;
    roomNameInput.value = "";

    await refreshRoomList();
});

function renderRoomList(rooms) {
    roomList.innerHTML = "";

    if (rooms.length === 0) {
        roomList.textContent = "No open rooms.";
        return;
    }

    rooms.forEach(room => {
        const row = document.createElement("div");
        row.classList.add("room-row");

        const title = document.createElement("strong");
        title.textContent = room.roomName;

        const details = document.createElement("div");
        details.classList.add("room-details");
        details.textContent =
            `${room.visibility} • ${room.playerCount}/${room.maxPlayers} players • ${room.puzzleId} • ${room.mode}`;

        const players = document.createElement("div");
        players.classList.add("room-players");

        if (room.players.length === 0) {
            players.textContent = "Players: none";
        } else {
            const playerNames = room.players
                .map(player => `P${player.playerOrder}: ${player.displayName}`)
                .join(" • ");

            players.textContent = `Players: ${playerNames}`;
        }

        const joinButton = document.createElement("button");
        joinButton.classList.add("join-room-btn");

        if (room.isCurrentUserInRoom) {
            joinButton.textContent = "Joined";
            joinButton.disabled = true;
        } else if (room.playerCount >= room.maxPlayers) {
            joinButton.textContent = "Room Full";
            joinButton.disabled = true;
        } else {
            joinButton.textContent = "Join Room";
            joinButton.disabled = false;
        }

        joinButton.addEventListener("click", async () => {
            createRoomStatus.textContent = `Joining room: ${room.roomName}...`;

            const joinedPlayer = await joinRoom(room.id);

            if (!joinedPlayer) {
                createRoomStatus.textContent = "Could not join room. Check the console.";
                return;
            }

            createRoomStatus.textContent = `Joined room: ${room.roomName}`;

            await refreshRoomList();
        });

        row.appendChild(title);
        row.appendChild(details);
        row.appendChild(players);
        row.appendChild(joinButton);

        roomList.appendChild(row);
    });
}

async function refreshRoomList() {
    roomList.textContent = "Loading rooms...";

    const rooms = await getCrosswordRoomSummaries();

    renderRoomList(rooms);
}

refreshRoomsButton.addEventListener("click", refreshRoomList);

refreshRoomList();




