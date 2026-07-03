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
