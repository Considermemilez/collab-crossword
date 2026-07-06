import { 
    SIZE, 
    currentPuzzle,
    currentSession,
    gameActive,
    setGameActive 
} from "./state.js";

import {
    isWordStart,
    buildAcrossWords,
    buildDownWords
} from "./puzzleModel.js"

import { loadPuzzle } from "./puzzleLoader.js";
import {
    renderClues,
    createCellElement,
    renderCellNumber,
    renderCellLetter, 
    applyCellClasses
 } from "./render.js";

import { handleDevShortcut } from "./devtools.js";
import { setupWelcomeScreen } from "./session.js"; 
import { setupKeyboardInput } from "./input.js";
import { puzzleCatalog } from "./puzzleCatalog.js";
import { 
    getLeaderboard,
    saveLeaderboardEntry
 } from "./leaderboardService.js";

import { 
    validateWord, 
    isPuzzleComplete,
    getCorrectLetterForCell, 
    revealCell,
    revealWord,
    revealPuzzle, 
    findWordAtCell 
} from "./gameplay.js";


console.log("script loaded")

// STATE
const grid = Array(SIZE).fill().map(() =>
    Array(SIZE).fill().map(() => ({
        isBlack: false,
        letter: "",
        number: null,
        isCorrect: false,
        isWrong: false,
        isLocked: false
    }))
);

// Getter/setters
function getSelectedCell() {
    return selectedCell;
}

function setSelectedCell(cell) {
    selectedCell = cell;
}

function getDirection() {
    return direction;
}

function setDirection(newDirection) {
    direction = newDirection;
}

function getAcrossWords() {
    return acrossWords;
}

function getDownWords() {
    return downWords;
}

// Words
let acrossWords = [];
let downWords = [];

// UI STATE
let selectedCell = { row: 0, col: 0 };
let direction = "across";
let activeWord = null;
let timerInterval = null;
let autosaveInterval = null;
let selectedPuzzleId = "";

// DOM Container
const gridContainer = document.getElementById("grid");
const checkButton = document.getElementById("check-btn");
const revealButton = document.getElementById("reveal-btn");
const revealMenu = document.getElementById("reveal-menu");
const revealLetterButton = document.getElementById("reveal-letter-btn");
const revealWordButton = document.getElementById("reveal-word-btn");
const revealPuzzleButton = document.getElementById("reveal-puzzle-btn");

const welcomeScreen = document.getElementById("welcome-screen");
const gameScreen = document.getElementById("game-screen");
const roomLobbyScreen = document.getElementById("room-lobby-screen");
const startGameButton = document.getElementById("start-game-btn");
const playerOneInput = document.getElementById("player-one-name");
const playerTwoInput = document.getElementById("player-two-name");
const playerTwoSection = document.getElementById("player-two-section");
const modeInputs = document.querySelectorAll("input[name='play-mode']");
const puzzleSelect = document.getElementById("puzzle-select");
const resumeGamePanel = document.getElementById("resume-game-panel");
const resumeGameButton = document.getElementById("resume-game-btn");
const discardSavedGameButton = document.getElementById("discard-saved-game-btn");

const completionModal = document.getElementById("completion-modal");
const completionTime = document.getElementById("completion-time");
const completionEligibility = document.getElementById("completion-eligibility");
const completionCloseButton = document.getElementById("completion-close-btn");
const completionLeaderboard = document.getElementById("completion-leaderboard");
const completionNewGameButton = document.getElementById("completion-new-game-btn");


// Move selection
function moveSelection(row, col) {
    selectedCell = { row, col };
    renderGrid();
}

// Get Next Cell
function getNextCell(row, col) {
    if (direction === "across") {
        let newCol = col + 1;

        while (newCol < SIZE && grid[row][newCol].isBlack) {
            newCol++;
        }

        if (newCol < SIZE) {
            return { row, col: newCol };
        }
    }
     if (direction === "down") {
        let newRow = row + 1;

        while (newRow < SIZE && grid[newRow][col].isBlack) {
            newRow++;
        }

        if (newRow < SIZE) {
            return { row: newRow, col};
        }
     }

    return null;
}

// Get Previous Cell
function getPreviousCell(row, col) {
    if (direction === "across") {
        let newCol = col - 1;

        while (newCol >= 0 && grid[row][newCol].isBlack) {
            newCol--;
        }

        if (newCol >= 0 ) {
            return { row, col: newCol };
        }
    }

    if (direction === "down") {
        let newRow = row - 1;

        while (newRow >= 0 && grid[newRow][col].isBlack) {
            newRow--;
        }

        if (newRow >= 0 ) {
            return { row: newRow, col };
        }
    }

    return null;
}


// click behavior
function attachCellClickHandler(cellElement, row, col) {
    cellElement.addEventListener("click", () => {
        if (grid[row][col].isBlack) return; 

        const isSameCell = 
            selectedCell.row === row &&
            selectedCell.col === col;

        // determine which word cell belongs to
        const acrossMatch = findWordAtCell(row, col, acrossWords);
        const downMatch = findWordAtCell(row, col, downWords);


        if (isSameCell) {
            if (direction === "across" && downMatch) {
                direction = "down";
            } else if (direction === "down" && acrossMatch) {
                direction = "across";
            } 
        }

        selectedCell = { row, col };

        // decide direction priority
        let targetWord = null;

        // prefer current direction IF available
        if (direction === "across" && acrossMatch) {
            targetWord = acrossMatch;
        } else if (direction === "down" && downMatch) {
            targetWord = downMatch;
        } 

        // fallback logic
        if (!targetWord) {
            targetWord = acrossMatch || downMatch;
        }

        if (targetWord) {
            setActiveWord(targetWord, false);
        } else {
            renderGrid();
        }
    });
}

// Render Cells 
function renderCell(
    row, 
    col, 
    cellData,
    selectedCell,
    isActive
) {
    const cell = createCellElement();

    applyCellClasses(
        cell,
        cellData,
        row,
        col,
        selectedCell,
        isActive
    );

    renderCellNumber(cell, cellData);

    renderCellLetter(cell, cellData);

    attachCellClickHandler(cell, row, col);

    return cell;
}

// Render Grid Function
function renderGrid() {
    gridContainer.innerHTML = "";

    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {

            const cellData = grid[row][col];
            const cell = renderCell(
                row, 
                col, 
                cellData,
                selectedCell,
                isInActiveWord(row, col)
            );

            gridContainer.appendChild(cell);
            }
    }
}

// Start Game
async function startGame() {
    selectedPuzzleId = puzzleSelect.value;

    await loadSelectedPuzzle();

    startTimer();
    startAutosave();
}

// Export Start Game
export async function startRoomGame(room) {
    selectedPuzzleId = room.puzzleId;

    currentSession.players = room.players.map(player => player.displayName);
    currentSession.mode = room.mode;
    currentSession.startTime = Date.now();
    currentSession.endTime = null;
    currentSession.completed = false;
    currentSession.usedReveal = false;

    setGameActive(true);

    await loadSelectedPuzzle();

    startTimer();
    startAutosave();

    welcomeScreen.classList.add("hidden");

    if (roomLobbyScreen) {
        roomLobbyScreen.classList.add("hidden");
    }

    gameScreen.classList.remove("hidden");

    console.log("Room game started.", currentSession);
}

// Update Game Timer
function updateTimer() {
    const timerElement = document.getElementById("timer");

    const endTime = currentSession.endTime || Date.now();

    const elapsedSeconds = Math.floor(
        (endTime - currentSession.startTime) / 1000
    );

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    timerElement.textContent = 
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Start Timer
function startTimer() {
    updateTimer();

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(updateTimer, 1000);
}

// Stop Timer 
function stopTimer () {
    if (!currentSession.endTime) {
        currentSession.endTime = Date.now();
    }
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    updateTimer();
}

// Start Autosave
function startAutosave() {
    if (autosaveInterval) {
        clearInterval(autosaveInterval);
    }

    autosaveInterval = setInterval(() => {
        if (!gameActive) return;
        if (currentSession.completed) return;

        saveGameState();
    }, 5000);
}

// Get Completion results
function getCompletionResult() {
    const solveTimeMs = 
        currentSession.endTime - currentSession.startTime;

    const elapsedSeconds = Math.floor(solveTimeMs / 1000);

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    return {
        solveTime:
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,

        solveTimeMs,

        leaderboardEligible: !currentSession.usedReveal,

        usedReveal: currentSession.usedReveal,

        playerName: currentSession.players.join(" and "),

        puzzleId: currentSession.puzzleId,

        mode: currentSession.mode
    };
}

// Render Leaderboard
function renderLeaderboard(leaderboard = [], highlightedEntryId = null) {
    completionLeaderboard.innerHTML = "";

    if (leaderboard.length === 0) {
        completionLeaderboard.textContent = "No leaderboard times yet."
        return;
    }

    leaderboard.forEach((entry, index) => {
        const row = document.createElement("div");
        row.classList.add("leaderboard-row");

        if (entry.id === highlightedEntryId) {
            row.classList.add("leaderboard-row-current");
        }

        const rank = document.createElement("span");
        rank.classList.add("leaderboard-rank");
        rank.textContent = `#${index + 1}`;

        const player = document.createElement("span");
        player.classList.add("leaderboard-player")
        player.textContent = entry.player;

        const time = document.createElement("span");
        time.classList.add("leaderboard-time");
        time.textContent = entry.time;

        row.appendChild(rank);
        row.appendChild(player);
        row.appendChild(time);
        

        completionLeaderboard.appendChild(row);
    });
}

// Show Completion Modal
function showCompletionModal(completionResult) {
    completionTime.textContent = completionResult.solveTime;

    if (completionResult.leaderboardEligible) {
        completionEligibility.textContent = 
            "Leaderboard eligible: Yes";
    } else {
        completionEligibility.textContent = 
            "Leaderboard eligible: No - Reveal was used :(";
    }

    renderLeaderboard(
        completionResult.leaderboard,
        completionResult.savedLeaderboardEntryId
    );

    completionModal.classList.remove("hidden");
}

// Finish Puzzle
async function finishPuzzle() {
    currentSession.completed = true;

    stopTimer();

    setGameActive(false);

    const completionResult = getCompletionResult();

    let savedLeaderboardEntry = null;

    if (completionResult.leaderboardEligible) {
        savedLeaderboardEntry = await saveLeaderboardEntry({
            puzzleId: completionResult.puzzleId,
            mode: completionResult.mode,
            playerName: completionResult.playerName,
            solveTimeMs: completionResult.solveTimeMs,
            usedReveal: completionResult.usedReveal
        });
    }

    completionResult.savedLeaderboardEntryId = 
        savedLeaderboardEntry?.id || null;

    completionResult.leaderboard = await getLeaderboard(
        completionResult.puzzleId,
        completionResult.mode
    );

    showCompletionModal(completionResult);
}

// Force eligible Completion for Dev
async function forceEligibleCompletionForDev () {
    currentSession.usedReveal = false;

    const allWords = [
        ...acrossWords,
        ...downWords
    ];

    allWords.forEach(word => {
        word.cells.forEach((cell, index) => {
            const gridCell = grid[cell.row][cell.col];

            gridCell.letter = word.answer[index];
            gridCell.isCorrect = true;
            gridCell.isWrong = false;
            gridCell.isLocked = true;
        });
    });

    renderGrid();
    saveGameState();

    await finishPuzzle();
}

// Get Game State
function getGameState() {
    const endTime = currentSession.endTime || Date.now();

    const elapsedMs = endTime - currentSession.startTime;

    return {
        puzzleId: currentSession.puzzleId,
        players: currentSession.players,
        mode: currentSession.mode,
        startTime: currentSession.startTime,
        endTime: currentSession.endTime,
        completed: currentSession.completed,
        usedReveal: currentSession.usedReveal,
        selectedCell,
        direction,
        grid,
        elapsedMs
    };
}

// Restore Game State
function restoreGameState(savedGame) {

        
    currentSession.players = [...savedGame.players];
    currentSession.mode = savedGame.mode;
    currentSession.puzzleId = savedGame.puzzleId;
    currentSession.completed = savedGame.completed;
    currentSession.usedReveal = savedGame.usedReveal;
    currentSession.startTime = savedGame.startTime;
    currentSession.endTime = savedGame.endTime;

    if (savedGame.endTime) {
        currentSession.startTime = savedGame.startTime;
    } else {
        currentSession.startTime = Date.now() - savedGame.elapsedMs
    }

    selectedCell = savedGame.selectedCell;
    direction = savedGame.direction;
}

// Restore Grid
function restoreGrid(savedGrid) {
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            Object.assign(grid[row][col], savedGrid[row][col]);
        } 
    }
}

// Save Game State
function saveGameState() {
    const savedGame = getGameState();

    localStorage.setItem(
        "crosswordCurrentGame",
        JSON.stringify(savedGame)
    );
}

// Get Saved Game State
function getSavedGameState() {
    const savedGame = localStorage.getItem("crosswordCurrentGame");

    if (!savedGame) {
        return null;
    }

    return JSON.parse(savedGame);
}

// Show Resume Prompt
function showResumePromptIfSavedGameExists() {
    const savedGame = getSavedGameState();

    if (!savedGame) return;

    if (savedGame.completed) return;

    resumeGamePanel.classList.remove("hidden");
}

// Reset Game State
function resetGameState() {
    activeWord = null;

    selectedCell = { row: 0, col: 0};

    direction = "across";

    acrossWords = [];

    downWords = [];

    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            grid[row][col] = {
                isBlack: false,
                letter: "",
                number: null,
                isCorrect: false,
                isWrong: false,
                isLocked: false
            };
        }
    }
}

// Return to Welcome Screen
function returnToWelcomeScreen () {
    completionModal.classList.add("hidden")

    gameScreen.classList.add("hidden");
    welcomeScreen.classList.remove("hidden");

    playerOneInput.value = "";
    playerTwoInput.value = "";

    setGameActive(false);

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Build Puzzle
function initializePuzzle() {
    // Load Black Squares
    for (const [row, col] of currentPuzzle.blackSquares) {
        grid[row][col].isBlack = true;
    }  

    // Add Clue Numbers
    let clueNumber = 1;

    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            if (isWordStart(grid, row, col)) {
                grid[row][col].number = clueNumber;
                clueNumber++;
            }
        }   
    }

    // Build words
    acrossWords = buildAcrossWords(grid, SIZE);
    downWords = buildDownWords(grid, SIZE);

    
}

// Attach Puzzle Data
function attachPuzzleData() {

    // Attach Clues
    acrossWords = acrossWords.map(word => ({
        ...word,
        clue: currentPuzzle.across[word.number]?.clue || "[Missing Clue]",
        answer: currentPuzzle.across[word.number]?.answer || ""
    }));

    downWords = downWords.map(word => ({
        ...word,
        clue: currentPuzzle.down[word.number]?.clue || "[Missing Clue]",
        answer: currentPuzzle.down[word.number]?.answer || ""
    }));
}

// Load Puzzle function
async function loadSelectedPuzzle() {
    try {

        resetGameState();

        await loadPuzzle(selectedPuzzleId);

        // Build Puzzle
        initializePuzzle();
        attachPuzzleData();

        // Render Grid/Clues
        renderGrid();

        renderClues(
            acrossWords, 
            downWords, 
            activeWord, 
            setActiveWord
        );
    } catch (error) {
        console.error(error);

        alert("Failed to load the crossword puzzle");
    }

}

// Resume Saved Game
async function resumeSavedGame(savedGame) {
    restoreGameState(savedGame);

    selectedPuzzleId = savedGame.puzzleId;

    await loadSelectedPuzzle();

    restoreGrid(savedGame.grid);

    renderGrid();
}


// Populate Puzzle Selector
function populatePuzzleSelector() {
    puzzleSelect.innerHTML = "";

    puzzleCatalog.forEach(puzzle => {
        const option = document.createElement("option");

        option.value = puzzle.id;
        option.textContent =
            `${puzzle.name} (${puzzle.difficulty})`;

        puzzleSelect.appendChild(option);
    });

    if (puzzleCatalog.length > 0) {
        selectedPuzzleId = puzzleCatalog[0].id;
        puzzleSelect.value = selectedPuzzleId;
    }

    selectedPuzzleId = puzzleCatalog[0].id;
}

populatePuzzleSelector();
showResumePromptIfSavedGameExists();

// Setup welcome Screen
setupWelcomeScreen({
    welcomeScreen,
    gameScreen,
    startGameButton,
    playerOneInput,
    playerTwoInput,
    playerTwoSection,
    modeInputs,
    startGame
});

// Check Answers Button Listener
checkButton.addEventListener("click", async () => {
    acrossWords.forEach(word => validateWord(grid, word));
    downWords.forEach(word => validateWord(grid, word));

    renderGrid();
    saveGameState();

    if (isPuzzleComplete(grid, SIZE)) {
        finishPuzzle();
    }; 
});


// Reveal Menu Listener
revealButton.addEventListener("click", () => {
    revealMenu.classList.toggle("hidden");
});

// Reveal Letter Listener
revealLetterButton.addEventListener("click", () => {
    const { row, col } = selectedCell;

    currentSession.usedReveal = true;
    revealCell(grid, row, col, acrossWords, downWords, renderGrid);
    saveGameState();

    revealMenu.classList.add("hidden");
});

// Reveal Word Listener
revealWordButton.addEventListener("click", () => {

    currentSession.usedReveal = true;

    revealWord(
        grid,
        activeWord,
        acrossWords,
        downWords,
        renderGrid
    );

    saveGameState();

    revealMenu.classList.add("hidden");
});

// Reveal Puzzle Listener
revealPuzzleButton.addEventListener("click", async () => {

    currentSession.usedReveal = true;

    revealPuzzle(grid, acrossWords, downWords, renderGrid);
    saveGameState();

    revealMenu.classList.add("hidden");

    await finishPuzzle();
});

// Completion Modal Close Listener
completionCloseButton.addEventListener("click", () => {
    completionModal.classList.add("hidden");
});

// Completion Modal New Game Listener
completionNewGameButton.addEventListener("click", () => {
    returnToWelcomeScreen();
})

// Discard Saved Game Listener
discardSavedGameButton.addEventListener("click", () => {
    localStorage.removeItem("crosswordCurrentGame");
    resumeGamePanel.classList.add("hidden");
})

// Resume Game listener
resumeGameButton.addEventListener("click", async () => {
    const savedGame = getSavedGameState();

    if (!savedGame) {
        return;
    }

    await resumeSavedGame(savedGame);

    startTimer();
    startAutosave();

    resumeGamePanel.classList.add("hidden");

    welcomeScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    setGameActive(true);
});

// Unload Listener
window.addEventListener("beforeunload", () => {
    if (!gameActive) return;
    if (currentSession.completed) return;

    saveGameState();
});

// Setup Keyboard input
setupKeyboardInput({
    grid,
    SIZE,
    getNextCell,
    getPreviousCell,
    moveSelection,
    renderGrid,
    handleDevShortcut,
    revealPuzzle: () =>
        revealPuzzle(
            grid, 
            getAcrossWords(), 
            getDownWords(), 
            renderGrid
        ),
    getSelectedCell,
    setSelectedCell,
    getDirection,
    setDirection, 
    findWordAtCell,
    getAcrossWords,
    getDownWords,
    setActiveWord,
    saveGameState,
    forceEligibleCompletion: forceEligibleCompletionForDev
});

// Active word detection
function isInActiveWord(row, col) {
    if (!activeWord) return false;

    return activeWord.cells.some(
        cell => cell.row === row && cell.col === col
    );
}

// Set Active Word
function setActiveWord(word, fromClue = false) {
    activeWord = word;

    // move selection to first cell of word
    if (word && word.cells.length > 0) {
        if (fromClue) {
            selectedCell = word.cells[0];
            direction = word.direction;
        } else {
            // ensure cursor is always inside word
            const match = word.cells.find(c =>
                c.row === selectedCell.row &&
                c.col === selectedCell.col
            );

            if (!match) {
                selectedCell = word.cells[0];
            }
        }
        direction = word.direction;
        
    }

    renderClues(acrossWords, downWords, activeWord, setActiveWord);
    renderGrid();
}










