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
const startGameButton = document.getElementById("start-game-btn");
const playerOneInput = document.getElementById("player-one-name");
const playerTwoInput = document.getElementById("player-two-name");
const playerTwoSection = document.getElementById("player-two-section");
const modeInputs = document.querySelectorAll("input[name='play-mode']");

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
function startGame() {
    renderGrid();
    renderClues(
        acrossWords,
        downWords,
        activeWord,
        setActiveWord
    );

    updateTimer();

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(updateTimer, 1000);
}

// Update Game Timer
function updateTimer() {
    const timerElement = document.getElementById("timer");

    const elapsedSeconds = Math.floor(
        (Date.now() - currentSession.startTime) / 1000
    );

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    timerElement.textContent = 
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Stop Timer 
function stopTimer () {
    currentSession.endTime = Date.now();

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    updateTimer();
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

// INIT function
async function init() {
    try {
        await loadPuzzle("easy001");
        currentSession.startTime = Date.now(); 

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

init();

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
checkButton.addEventListener("click", () => {
    acrossWords.forEach(word => validateWord(grid, word));
    downWords.forEach(word => validateWord(grid, word));

    renderGrid();

    if (isPuzzleComplete(grid, SIZE)) {
        currentSession.completed = true;

        stopTimer();

        setGameActive(false);

        // Victory screen
        alert("🎉 Congratulations! You solved the puzzle!")
    }
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

    revealMenu.classList.add("hidden");
});

// Reveal Puzzle Listener
revealPuzzleButton.addEventListener("click", () => {

    currentSession.usedReveal = true;

    revealPuzzle(grid, acrossWords, downWords, renderGrid);
    stopTimer();

    revealMenu.classList.add("hidden");
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
    setActiveWord
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










