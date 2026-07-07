import { supabaseClient} from "./supabaseClient.js";
import { setupAuthUI } from "./authUI.js";
import { 
    createCrosswordRoom,
    getCrosswordRoomSummaries,
    getCrosswordRoomDetails,
    joinRoom,
    startCrosswordRoom
} from "./roomService.js";
import { startRoomGame } from "./script.js";

// DOM References
const roomNameInput = document.getElementById("room-name-input");
const roomVisibilitySelect = document.getElementById("room-visibility-select");
const createRoomButton = document.getElementById("create-room-btn");
const createRoomStatus = document.getElementById("create-room-status");
const puzzleSelect = document.getElementById("puzzle-select");
const refreshRoomsButton = document.getElementById("refresh-rooms-btn");
const roomList = document.getElementById("room-list");
const authScreen = document.getElementById("auth-screen");
const gameSelectScreen = document.getElementById("game-select-screen");
const welcomeScreen = document.getElementById("welcome-screen");
const selectCrosswordButton = document.getElementById("select-crossword-btn");
const gameSelectAccountButton = document.getElementById("game-select-account-btn");
const crosswordLobbyAccountButton = document.getElementById("crossword-lobby-account-btn");
const backToGamesButton = document.getElementById("back-to-games-btn");
const roomLobbyScreen = document.getElementById("room-lobby-screen");
const roomLobbyTitle = document.getElementById("room-lobby-title");
const roomLobbyBackButton = document.getElementById("room-lobby-back-btn");
const roomLobbyDetails = document.getElementById("room-lobby-details");
const roomLobbyPlayers = document.getElementById("room-lobby-players");
const roomLobbyStartButton = document.getElementById("room-lobby-start-btn");
const roomLobbyStatus = document.getElementById("room-lobby-status");


// State
let currentRoomId = null;
let roomRealtimeChannel = null;
let roomLobbyRefreshInterval = null;
let currentRoom = null;
let roomGameStarted = false;


// Show Platform Screen
function showPlatformScreen(screenName) {
    authScreen.classList.add("hidden");
    gameSelectScreen.classList.add("hidden");
    welcomeScreen.classList.add("hidden");
    roomLobbyScreen.classList.add("hidden");

    if (screenName === "auth") {
        authScreen.classList.remove("hidden");
    }

    if (screenName === "game-select") {
        gameSelectScreen.classList.remove("hidden");
    }

    if (screenName === "room-lobby") {
        roomLobbyScreen.classList.remove("hidden");
    }

    if (screenName === "crossword-lobby") {
        welcomeScreen.classList.remove("hidden");
    }
}

// Update Start Game Auth Gate
function updateStartGameAuthGate({ user, profile }) {
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
        showPlatformScreen("game-select");

        return;
    }

    startGameButton.textContent = "Sign in to Start Game";

    if (roomList) {
        roomList.textContent = "Sign in to see available rooms."
    }

    showPlatformScreen("auth");
}

// Render Room List
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
            joinButton.textContent = "Enter Room";
            joinButton.disabled = false;

            joinButton.addEventListener("click", async () => {
                await openRoomLobby(room.id);
            });
        } else if (room.playerCount >= room.maxPlayers) {
            joinButton.textContent = "Room Full";
            joinButton.disabled = true;
        } else {
            joinButton.textContent =
                room.status === "active" ? "Join Active Game" : "Join Room";

            joinButton.disabled = false;

            joinButton.addEventListener("click", async () => {
                createRoomStatus.textContent = `Joining room: ${room.roomName}...`;

                const joinedRoom = await joinRoom(room.id);

                if (!joinedRoom) {
                    createRoomStatus.textContent = "Could not join room. Check the console.";
                    return;
                }

                createRoomStatus.textContent = `Joined room: ${room.roomName}`;

                await openRoomLobby(room.id);
            });
}

        row.appendChild(title);
        row.appendChild(details);
        row.appendChild(players);
        row.appendChild(joinButton);

        roomList.appendChild(row);
    });
}

// Render Room Lobby
function renderRoomLobby(room) {
    roomLobbyTitle.textContent = room.roomName;

    roomLobbyDetails.textContent =
        `${room.visibility} • ${room.status} • ${room.puzzleId} • ${room.mode}`;

    roomLobbyPlayers.innerHTML = "";

    room.players.forEach(player => {
        const playerRow = document.createElement("div");
        playerRow.classList.add("room-lobby-player");

        playerRow.textContent =
            `P${player.playerOrder}: ${player.displayName}`;

        roomLobbyPlayers.appendChild(playerRow);
    });

    if (room.status === "active") {
        roomLobbyStartButton.textContent = "Game Started";
        roomLobbyStartButton.disabled = true;
        roomLobbyStatus.textContent = "Room is active. Loading crossword...";
    } else if (room.isCurrentUserCreator) {
        roomLobbyStartButton.textContent = "Start Game";
        roomLobbyStartButton.disabled = false;
        roomLobbyStatus.textContent = "You are the host. You can start this room.";
    } else {
        roomLobbyStartButton.textContent = "Waiting for host";
        roomLobbyStartButton.disabled = true;
        roomLobbyStatus.textContent = "Waiting for the host to start the room.";
    }
}

// Open Room lobby
async function openRoomLobby(roomId) {
    currentRoomId = roomId;
    roomGameStarted = false;

    const refreshed = await refreshRoomLobbyView();

    if (!refreshed) {
        return;
    }

    if (roomGameStarted) {
        return;
    }

    showPlatformScreen("room-lobby");
    subscribeToRoomUpdates(roomId);
    startRoomLobbyPolling();
}

// Refresh Room Lobby View
async function refreshRoomLobbyView() {
    if (!currentRoomId) {
        return false;
    }

    const room = await getCrosswordRoomDetails(currentRoomId);

    if (!room) {
        roomLobbyStatus.textContent = "Could not load room.";
        return false;
    }

    if (!room.isCurrentUserInRoom) {
        roomLobbyStatus.textContent = "Join this room before entering.";
        return false;
    }

    currentRoom = room;

    renderRoomLobby(room);

    if (room.status === "active") {
        await startActiveRoomGame(room);
    }

    return true;
}

// Start Active Room Game
async function startActiveRoomGame(room) {
    if (roomGameStarted) {
        return;
    }

    roomGameStarted = true;

    unsubscribeFromRoomUpdates();
    stopRoomLobbyPolling();

    await startRoomGame(room);
}

// Stop Room Lobby Polling
function stopRoomLobbyPolling() {
    if (!roomLobbyRefreshInterval) {
        return;
    }

    clearInterval(roomLobbyRefreshInterval);
    roomLobbyRefreshInterval = null;
}

// Start Room lobby Polling
function startRoomLobbyPolling() {
    stopRoomLobbyPolling();

    roomLobbyRefreshInterval = setInterval(async () => {
        await refreshRoomLobbyView();
    }, 2000);
}

// Unsubscribe from Room Updates
function unsubscribeFromRoomUpdates() {
    if (!roomRealtimeChannel) {
        return;
    }

    supabaseClient.removeChannel(roomRealtimeChannel);
    roomRealtimeChannel = null;
}

// Subscribe to Room Updates
function subscribeToRoomUpdates(roomId) {
    unsubscribeFromRoomUpdates();

    roomRealtimeChannel = supabaseClient
        .channel(`room-${roomId}`)
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "game_rooms",
                filter: `id=eq.${roomId}`
            },
            async (payload) => {
                console.log("Realtime game_rooms update:", payload);
                await refreshRoomLobbyView();
            }
        )
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "game_players",
                filter: `room_id=eq.${roomId}`
            },
            async (payload) => {
                console.log("Realtime game_players insert:", payload);
                await refreshRoomLobbyView();
            }
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "game_players",
                filter: `room_id=eq.${roomId}`
            },
            async (payload) => {
                console.log("Realtime game_players update:", payload);
                await refreshRoomLobbyView();
            }
        )
        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "game_players",
                filter: `room_id=eq.${roomId}`
            },
            async (payload) => {
                console.log("Realtime game_players delete:", payload);
                await refreshRoomLobbyView();
            }
        )
        .subscribe((status, error) => {
            console.log("Room realtime subscription status:", status, error);
        });
}

// Refresh Room List
async function refreshRoomList() {
    roomList.textContent = "Loading rooms...";

    const rooms = await getCrosswordRoomSummaries();

    renderRoomList(rooms);
}

document.addEventListener("crossword:lobby-returned", async () => {
    await refreshRoomList();
});


// Setup Auth UI
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
    onAuthStateChange: updateStartGameAuthGate
});

// Select Crossword button Listener
selectCrosswordButton.addEventListener("click", async () => {
    showPlatformScreen("crossword-lobby");
    await refreshRoomList();
});

// Back To Games Button
backToGamesButton.addEventListener("click", async () => {
    showPlatformScreen("game-select");
    await refreshRoomList();
});


// Create Room Button Listener
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

    await openRoomLobby(room.id);
});

// Game Screen Account Button listener 
gameSelectAccountButton.addEventListener("click", () => {
    showPlatformScreen("auth");
});

// Crossword Lobby Account Button Listener
crosswordLobbyAccountButton.addEventListener("click", () => {
    showPlatformScreen("auth");
});

// Lobby Back Button Listener
roomLobbyBackButton.addEventListener("click", async () => {
    unsubscribeFromRoomUpdates();
    stopRoomLobbyPolling();
    currentRoomId = null;

    showPlatformScreen("crossword-lobby");
    await refreshRoomList();
});

// Room Lobby Start Button Listener
roomLobbyStartButton.addEventListener("click", async () => {
    if (!currentRoomId) {
        roomLobbyStatus.textContent = "No room selected.";
        return;
    }

    if (currentRoom?.status === "active") {
        await startActiveRoomGame(currentRoom);
        return;
    }

    roomLobbyStatus.textContent = "Starting room...";

    const startedRoom = await startCrosswordRoom(currentRoomId);

    if (!startedRoom) {
        roomLobbyStatus.textContent = "Could not start room. Only the host can start.";
        return;
    }

    await refreshRoomLobbyView();
});


// Refresh Rooms Button listener
refreshRoomsButton.addEventListener("click", refreshRoomList);

refreshRoomList();




