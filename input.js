import { gameActive } from "./state.js";


export function setupKeyboardInput({
    grid,
    SIZE,
    getNextCell,
    getPreviousCell,
    moveSelection,
    renderGrid,
    handleDevShortcut,
    revealPuzzle,
    getSelectedCell,
    setSelectedCell,
    getDirection,
    setDirection,
    findWordAtCell,
    getAcrossWords,
    getDownWords,
    setActiveWord
}) {
    function updateActiveWordForCell(row, col) {
        const direction = getDirection();

        const acrossMatch = findWordAtCell(row, col, getAcrossWords());
        const downMatch = findWordAtCell(row, col, getDownWords());

        let targetWord = null;

        if (direction === "across" && acrossMatch) {
            targetWord = acrossMatch;
        } else if (direction === "down" && downMatch) {
            targetWord = downMatch;
        }

        if (!targetWord) {
            targetWord = acrossMatch || downMatch;
        }

        if (targetWord) {
            setActiveWord(targetWord, false);
        }
    }

    document.addEventListener("keydown", (event) => {
        if (!gameActive) return;
        
        const selectedCell = getSelectedCell()
        const { row, col } = selectedCell;
        const cell = grid[row][col];
    
        // ====== Developer Shortcuts ======
        const devHandled = handleDevShortcut(event, grid, SIZE, renderGrid, revealPuzzle);
        if (devHandled) return;
    
        // prevent typing into black squares
        if (cell.isBlack) return;
        if (cell.isLocked) return;
    
        // Arrow Right
        if (event.key === "ArrowRight") {
            setDirection("across");
    
            if (col < SIZE - 1 && !grid[row][col + 1].isBlack) {
                moveSelection(row, col + 1);
                updateActiveWordForCell(row, col + 1)
            }
    
            return;
        };
    
        // Arrow Left
        if (event.key === "ArrowLeft") {
            setDirection("across");
    
            if (col > 0 && !grid[row][col - 1].isBlack) {
                moveSelection(row, col - 1);
                updateActiveWordForCell(row, col - 1);
            }
    
            return;
        }
    
        // Arrow Down
        if (event.key === "ArrowDown") {
            setDirection("down");
    
            if (row < SIZE - 1 && !grid[row + 1][col].isBlack) {
                moveSelection(row + 1, col );
                updateActiveWordForCell(row + 1, col);
            }
    
            return;
        }
        // Arrow Up
        if (event.key === "ArrowUp") {
            setDirection("down");
    
            if (row > 0 && !grid[row - 1][col].isBlack) {
                moveSelection(row - 1, col);
                updateActiveWordForCell(row - 1, col);
            }
    
            return;
        }
    
        // handle letters A-Z
        if (event.key.length === 1 && event.key.match(/[a-z]/i)) {
            cell.letter = event.key.toUpperCase();
    
            const next = getNextCell(row, col);
    
            if (next) {
                setSelectedCell(next);
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
    
                    setSelectedCell(previous);
    
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
}