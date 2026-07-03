// Find word starts
export function isWordStart(grid, row, col) {
    if (grid[row][col].isBlack) return false;

    const startsAcross = 
        col === 0 || grid[row][col - 1].isBlack;

    const startsDown =
        row === 0 || grid[row - 1][col].isBlack;

    return startsAcross || startsDown;
}

// Build Across Words
export function buildAcrossWords(grid, SIZE) {
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
export function buildDownWords(grid, SIZE) {
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

