const DEV_SHORTCUTS_ENABLED = false; 
// set to false before production
// These shortcuts are for local testing only
// Shortcut 4 intentionally simulates an eligible solve for testing leaderboard inserts

export async function handleDevShortcut(event, grid, SIZE, renderGrid, revealPuzzle, forceEligibleCompletion) {
    // ====== Developer Shortcuts ======
        if (!DEV_SHORTCUTS_ENABLED) {
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
            console.log("DEV Shortcut: Locked every white cell.");
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
            console.log("DEV Shortcut: Unlocked every white cell.");
            return true;
        }

        // 3 - Reveal Puzzle Gris Only
        // This is not the same as the UI reveal button
        if (event.key === "3") {
            revealPuzzle();
            console.log("DEV Shortcut: Revealed puzzle grid only");
            return true;
        }

        // 4 - Force A Leaderbord Eligible Completion
        // This is intentionally used to test leaderboard save/read behavior
        if (event.key === "4") {
            if (typeof forceEligibleCompletion !== "function") {
                console.warn(
                    "DEV Shortcut: forceeligibleCompletion callback is missing."
                );
                return true;
            }

            await forceEligibleCompletion();
            
            console.log("DEV Shortcut: Forced puzzle completion state.");
            return true;
        }

        return false;
}

