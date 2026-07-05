const DEV_MODE = true; // set to false before production

export async function handleDevShortcut(event, grid, SIZE, renderGrid, revealPuzzle, forceEligibleCompletion) {
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
            return true;
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
            return true;
        }

        // 3 - Reveal Puzzle
        if (event.key === "3") {
            revealPuzzle();
            console.log("Developer: Puzzle revealed.");
            return true;
        }

        // 4 - Force Complete Puzzle
        if (event.key === "4") {
            await forceEligibleCompletion();
            console.log("Developer: Forced puzzle completion state.");
            return true;
        }

        return false;
}

