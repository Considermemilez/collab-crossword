const DEV_MODE = true;

export function handleDevShortcut(event, grid, SIZE, renderGrid, revealPuzzle) {
    // ====== Developer Shortcuts ======
        if (!DEV_MODE) {
            return false;
        }

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

        // prevent typing into black squares
        if (cell.isBlack) return;
        if (cell.isLocked) return;

        // Arrow Right
        if (event.key === "ArrowRight") {
            direction = "across";

            if (col < SIZE - 1 && !grid[row][col + 1].isBlack) {
                moveSelection(row, col + 1);
            }

            return;
        }
}
