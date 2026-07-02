console.log("script loaded")

const SIZE = 15;
const DEV_MODE = true;

// Puzzle Data

const puzzle = {
  across: {
    1: { answer: "CAT", clue: "Common household pet" },
    5: { answer: "DOG", clue: "Man's best friend" },
    7: { answer: "SUN", clue: "Star at the center of our solar system" }
  },

  down: {
    1: { answer: "CAR", clue: "Road vehicle with four wheels" },
    2: { answer: "TIN", clue: "Metal container material" }
  }
};


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

// TEST Black Squares
const blackSquares = [
  [0, 4], [0, 5], [0, 9], [0, 10],

  [1, 3], [1, 11],

  [2, 6],

  [3, 1], [3, 7], [3, 13],

  [4, 5], [4, 9],

  [5, 2], [5, 12],

  [6, 0], [6, 6], [6, 8], [6, 14],

  [7, 4], [7, 10],

  [8, 2], [8, 12],

  [9, 5], [9, 9],

  [10, 1], [10, 13],

  [11, 3], [11, 11],

  [12, 6],

  [13, 4], [13, 5], [13, 9], [13, 10],

  [14, 5], [14, 9]
];

for (const [row, col] of blackSquares) {
  grid[row][col].isBlack = true;
}

// Add Clue Numbers
let clueNumber = 1;

for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
        if (isWordStart(row, col)) {
            grid[row][col].number = clueNumber;
            clueNumber++;
        }
    }
}

// Words
let acrossWords = [];
let downWords = [];

// UI STATE
let selectedCell = { row: 0, col: 0 };
let direction = "across";
let activeWord = null;

// DOM Container
const gridContainer = document.getElementById("grid");
const checkButton = document.getElementById("check-btn");
const revealButton = document.getElementById("reveal-btn");
const revealMenu = document.getElementById("reveal-menu");
const revealLetterButton = document.getElementById("reveal-letter-btn");
const revealWordButton = document.getElementById("reveal-word-btn");
const revealPuzzleButton = document.getElementById("reveal-puzzle-btn");

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

// Render Grid Function
function renderGrid() {
    gridContainer.innerHTML = "";

    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {

            const cellData = grid[row][col];

            const cell = document.createElement("div");
            cell.classList.add("cell");

            // Style Black v. white
            if (cellData.isBlack) {
                cell.classList.add("black");
            } else {
                cell.classList.add("white");
            }

            if (cellData.isCorrect) {
                cell.classList.add("correct")
            }

            if (cellData.isLocked) {
                cell.classList.add("locked")
            }

            if (cellData.isWrong) {
                cell.classList.add("wrong")
            }

            // Render Clue Numbers
            if (cellData.number) {
                const number = document.createElement("span");
                number.classList.add("cell-number");
                number.textContent = cellData.number;
                cell.appendChild(number);
            }

            // Active word highlight
            
            if (isInActiveWord(row, col)) {
                cell.classList.add("active-word")
            }
            

            // Fill cell with letter
            const letter = document.createElement("span");
            letter.textContent = cellData.letter;
            cell.appendChild(letter);

            // Highlight selected Cell
            if (selectedCell.row === row && selectedCell.col === col) {
                cell.classList.add("selected");
            }

            // click behavior
            cell.addEventListener("click", () => {
                if (grid[row][col].isBlack) return; 

                const isSameCell = 
                    selectedCell.row === row &&
                    selectedCell.col === col;

                if (isSameCell) {
                    direction = (direction === "across") ? "down" : "across";
                }

                selectedCell = { row, col };

                // determine which word cell belongs to
                const acrossMatch = findWordAtCell(row, col, acrossWords);
                const downMatch = findWordAtCell(row, col, downWords);

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

            gridContainer.appendChild(cell);
            }
    }
}

// INIT function
function init() {
    acrossWords = buildAcrossWords();
    downWords = buildDownWords();

    renderGrid();

    acrossWords = acrossWords.map(word => ({
        ...word,
        clue: puzzle.across[word.number]?.clue || "",
        answer: puzzle.across[word.number]?.answer || ""
    }));

    downWords = downWords.map(word => ({
        ...word,
        clue: puzzle.down[word.number]?.clue || "",
        answer: puzzle.down[word.number]?.answer || ""
    }));

    renderClues();

}

init();

// Check Button Listener
checkButton.addEventListener("click", () => {
    acrossWords.forEach(word => validateWord(word));
    downWords.forEach(word => validateWord(word));

    renderGrid();

    if (isPuzzleComplete()) {
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

    revealCell(row, col);

    revealMenu.classList.add("hidden");
});

// reveal Word Listener
revealWordButton.addEventListener("click", () => {
    revealWord(activeWord);

    revealMenu.classList.add("hidden");
});

// Reveal Puzzle Listener
revealPuzzleButton.addEventListener("click", () => {
    revealPuzzle();

    revealMenu.classList.add("hidden");
});

// Keyboard listener
document.addEventListener("keydown", (event) => {
    const { row, col } = selectedCell;

    // ====== Developer Shortcuts ======
    if (DEV_MODE) {
        // 1 - Lock all white cells
        if (event.key === "1") {
            for (let r = 0; r < SIZE; r++) {
                for (let c = 0; c < SIZE; c++) {
                    if (!grid[r][c].isBlack) {
                        grid[r][c].isLocked = true;
                    }
                }
            }

            renderGrid();
            console.log("Developer: Locked every cell.");
            return;
        }

        // 2 - Unlock every white cell
        if (event.key === "2") {
            for (let r = 0; r < SIZE; r++) {
                for (let c = 0; c < SIZE; c++) {
                    if (!grid[r][c].isBlack) {
                        grid[r][c].isLocked = false;
                    }
                }
            }

            renderGrid();
            console.log("Developer: Unlocked every cell.");
            return;
        }

        // 3 - Reveal Puzzle
        if (event.key === "3") {
            revealPuzzle();
            console.log("Developer: Puzzle revealed.");
            return;
        }

        const cell = grid[row][col];

        if (cell.isLocked) return;

        // prevent typing into black squares
        if (cell.isBlack) return;

        // Arrow Right
        if (event.key === "ArrowRight") {
            direction = "across";

            if (col < SIZE - 1 && !grid[row][col + 1].isBlack) {
                moveSelection(row, col + 1);
            }

            return;
        }
    }

    // Arrow Left
    if (event.key === "ArrowLeft") {
        direction = "across";

        if (col > 0 && !grid[row][col - 1].isBlack) {
            moveSelection(row, col - 1);
        }

        return;
    }

    // Arrow Down
    if (event.key === "ArrowDown") {
        direction = "down";

        if (row < SIZE - 1 && !grid[row + 1][col].isBlack) {
            moveSelection(row + 1, col );
        }

        return;
    }
    // Arrow Up
    if (event.key === "ArrowUp") {
        direction = "down";

        if (row > 0 && !grid[row - 1][col].isBlack) {
            moveSelection(row - 1, col);
        }

        return;
    }

    // handle letters A-Z
    if (event.key.length === 1 && event.key.match(/[a-z]/i)) {
        cell.letter = event.key.toUpperCase();

        const next = getNextCell(row, col);

        if (next) {
            selectedCell = next;
        }

        renderGrid();
        return;
    }

    // backspace
    if (event.key === "Backspace") {
        if (cell.letter === "") {
            // move back if empty
            const previous = getPreviousCell(row, col);

            if (previous) {
                const previousCell = grid[previous.row][previous.col];

                selectedCell = previous;

                if (!previousCell.isLocked) {
                    previousCell.letter = "";
                    previousCell.isWrong = false;
                    previousCell.isCorrect = false;
                }
            }
        } else {
            cell.letter = "";
            cell.isWrong = false;
            cell.isCorrect = false;
        }

        renderGrid();
    }
});

// Active word detection
function isInActiveWord(row, col) {
    if (!activeWord) return false;

    return activeWord.cells.some(
        cell => cell.row === row && cell.col === col
    );
}

// Find word starts
function isWordStart(row, col) {
    if (grid[row][col].isBlack) return false;

    const startsAcross = 
        col === 0 || grid[row][col - 1].isBlack;

    const startsDown =
        row === 0 || grid[row - 1][col].isBlack;

    return startsAcross || startsDown;
}

// Build Across Words
function buildAcrossWords() {
    const words = [];

    for (let row = 0; row < SIZE; row++) {
        let col = 0;

        while (col < SIZE) {
            if (grid[row][col].isBlack) {
                col++;
                continue;
            }

            const cells = [];

            while (col < SIZE && !grid[row][col].isBlack) {
                cells.push({ row, col });
                col++;
            }

            if (cells.length >= 3) {
                const start = cells[0];

                words.push({
                    number: grid[start.row][start.col].number,
                    direction: "across",
                    cells
                });
            }
        }
    }

    return words;
}

// Build Down Words
function buildDownWords() {
    const words = [];

    for (let col = 0; col < SIZE; col++) {
        let row = 0;

        while (row < SIZE) {
            if (grid[row][col].isBlack) {
                row++;
                continue;
            }

            const cells = [];

            while (row < SIZE && !grid[row][col].isBlack) {
                cells.push({ row, col });
                row++;
            }

            if (cells.length >= 3) {
                const start = cells[0];

                words.push({
                    number: grid[start.row][start.col].number,
                    direction: "down",
                    cells
                });
            }
        }
    }

    return words;
}

// Render Clues
function renderClues() {
    const acrossContainer = document.getElementById("across-list");
    const downContainer = document.getElementById("down-list");

    const sortedAcross = [...acrossWords].sort((a, b) => a.number - b.number);
    const sortedDown = [...downWords].sort((a, b) => a.number - b.number);

    acrossContainer.innerHTML = "";
    downContainer.innerHTML = "";

    sortedAcross.forEach(word => {
        const div = document.createElement("div");
        div.textContent = `${word.number}. ${word.clue}`;

        if (
            activeWord &&
            activeWord.number === word.number &&
            activeWord.direction === "across"
        ) {
            div.classList.add("active-clue")
        }

        div.addEventListener("click", () => {
            setActiveWord(word, true)
        });

        acrossContainer.appendChild(div)
    });

    sortedDown.forEach(word => {
        const div = document.createElement("div");
        div.textContent = `${word.number}. ${word.clue}`;

        if (
            activeWord &&
            activeWord.number === word.number &&
            activeWord.direction === "down"
        ) {
            div.classList.add("active-clue")
        }

        div.addEventListener("click", () => {
            setActiveWord(word, true)
        });

        downContainer.appendChild(div);
    });
}

// Set Active Word
function setActiveWord(word, fromClue = false) {
    activeWord = word;

    // move selection to first cell of word
    if (word && word.cells.length > 0) {
        if (fromClue) {
            selectedCell = word.cells[0];
        } else {
            // ensure cursor is always inside word
            const match = word.cells.find(c =>
                c.row === selectedCell.row &&
                c.col === selectedCell.col
            );

            if (!match) {
                selectedCell = word.cells[0]
            }
        }

        direction = word.direction;
    }

    renderClues();
    renderGrid();
}

// Find Word at Cell
function findWordAtCell(row, col, words) {
    return words.find(word =>
        word.cells.some(c => c.row === row && c.col === col)
    );
}

// Get correct letter
function getCorrectLetterForCell(row, col) {
    const matchingWords = [
        ...acrossWords,
        ...downWords
    ].filter(word =>
        word.cells.some(c => c.row === row && c.col === col)
    );

    for (const word of matchingWords) {
        const index = word.cells.findIndex(c =>
            c.row === row && c.col === col
        );

        if (word.answer && word.answer[index]) {
            return word.answer[index];
        }
    }

    return "";
}

// Reveal Cell
function revealCell(row, col) {
    const cell =grid[row][col];

    if (cell.isBlack) return;

    const correctLetter = getCorrectLetterForCell(row, col);

    if (!correctLetter) return;

    cell.letter = correctLetter;
    cell.isCorrect = true;
    cell.isWrong = false;
    cell.isLocked = true;

    renderGrid();
}

// Reveal Word
function revealWord(word) {
    if (!word) return;

    word.cells.forEach(cell => {
        revealCell(cell.row, cell.col);
    });

    renderGrid();
}

// Reveal Puzzle
function revealPuzzle() {
    acrossWords.forEach(word => {
        revealWord(word);
    });

    downWords.forEach(word => {
        revealWord(word);
    });

    renderGrid();
}

// Puzzle Completion
function isPuzzleComplete() {
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {

            const cell = grid[row][col];

            if (cell.isBlack) continue;

            if (!cell.isLocked) {
                return false;
            }
        }
    }

    return true;
}

// Validate Word
function validateWord(word) {
    if (!word.answer) return;

    word.cells.forEach((cell, index) => {
        const typedLetter = grid[cell.row][cell.col].letter;
        const correctLetter = word.answer[index];

        if (typedLetter === correctLetter) {
            grid[cell.row][cell.col].isCorrect = true;
            grid[cell.row][cell.col].isWrong = false;
            grid[cell.row][cell.col].isLocked = true;
        } else if (typedLetter !== "") {
            grid[cell.row][cell.col].isCorrect = false;
            grid[cell.row][cell.col].isWrong = true;
            grid[cell.row][cell.col].isLocked = false;
        } else {
            grid[cell.row][cell.col].isCorrect = false;
            grid[cell.row][cell.col].isWrong = false;
            grid[cell.row][cell.col].isLocked = false;
        }
    });
}


