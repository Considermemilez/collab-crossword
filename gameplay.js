// Validate Word
export function validateWord(grid, word) {
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

// Puzzle Completion
export function isPuzzleComplete(grid, SIZE) {


    
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

// Get correct letter
export function getCorrectLetterForCell(row, col, acrossWords, downWords) {
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
export function revealCell(grid, row, col, acrossWords, downWords, renderGrid) {
    const cell = grid[row][col];

    if (cell.isBlack) return;

    const correctLetter = getCorrectLetterForCell(row, col, acrossWords, downWords);

    if (!correctLetter) return;

    cell.letter = correctLetter;
    cell.isCorrect = true;
    cell.isWrong = false;
    cell.isLocked = true;

    renderGrid();
}

// Reveal Word
export function revealWord(grid, word, acrossWords, downWords, renderGrid) {
    if (!word) return;

    word.cells.forEach(cell => {
        revealCell(grid, cell.row, cell.col, acrossWords, downWords, renderGrid);
    });

    renderGrid();
}

// Reveal Puzzle
export function revealPuzzle(grid, acrossWords, downWords, renderGrid) {
    acrossWords.forEach(word => {
        revealWord(grid, word, acrossWords, downWords, renderGrid);
    });

    downWords.forEach(word => {
        revealWord(grid, word, acrossWords, downWords, renderGrid);
    });

    renderGrid();
}
