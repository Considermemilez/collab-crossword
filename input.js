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
    setActiveWord,
    saveGameState,
    onCellLetterChange,
    onFocusChange,
    forceEligibleCompletion
}) {

    const mobileKeyboardInput = document.getElementById("mobile-keyboard-input");

    function focusMobileKeyboardInput() {
        if (!mobileKeyboardInput) {
            return;
        }

        mobileKeyboardInput.value = "";
        mobileKeyboardInput.focus({
            preventScroll: true
        });
    }

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

    document.addEventListener("click", event => {
        if (!gameActive) return;

        const clickedCell = event.target.closest(".cell");

        if (!clickedCell) {
            return;
        }

        focusMobileKeyboardInput();
    });

    document.addEventListener("keydown", async (event) => {
        if (!gameActive) return;
        
        const selectedCell = getSelectedCell()
        const { row, col } = selectedCell;
        const cell = grid[row][col];
    
        // ====== Developer Shortcuts ======
        const devHandled = await handleDevShortcut(
            event, 
            grid, 
            SIZE, 
            renderGrid, 
            () => revealPuzzle(grid, getAcrossWords(), getDownWords(), renderGrid),
            forceEligibleCompletion
        );
        if (devHandled) return;

        // Prevent browser scrolling / navigation during gameplay
        const browserHandledKeys = [
            "ArrowRight",
            "ArrowLeft",
            "ArrowDown",
            "ArrowUp",
            "Backspace"
        ];

        if (browserHandledKeys.includes(event.key)) {
            event.preventDefault();
        }
    
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
            saveGameState();

            if (typeof onCellLetterChange === "function") {
                await onCellLetterChange({
                    row,
                    col,
                    letter: cell.letter
                });
            }

            if (
                next &&
                typeof onFocusChange === "function"
            ) {
                await onFocusChange();
            }

            return;
        }
    
        // backspace
        if (event.key === "Backspace") {
            let changedCell = null;

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

                        changedCell = {
                            row: previous.row,
                            col: previous.col,
                            letter: ""
                        };
                    }
                }
            } else {
                cell.letter = "";
                cell.isWrong = false;
                cell.isCorrect = false;

                changedCell = {
                    row,
                    col,
                    letter: ""
                };
            }
    
            renderGrid();
            saveGameState();

            if (
                changedCell &&
                typeof onCellLetterChange === "function"
            ) {
                await onCellLetterChange(changedCell);
            }

            if (typeof onFocusChange === "function") {
                await onFocusChange();
            }
        }
    });

    async function handleVirtualKey(key) {
        const selectedCell = getSelectedCell();
        const { row, col } = selectedCell;
        const cell = grid[row][col];

        if (cell.isBlack) return;
        if (cell.isLocked) return;

        if (key.length === 1 && key.match(/[a-z]/i)) {
            cell.letter = key.toUpperCase();

            const next = getNextCell(row, col);

            if (next) {
                setSelectedCell(next);
            }

            renderGrid();
            saveGameState();

            if (typeof onCellLetterChange === "function") {
                await onCellLetterChange({
                    row,
                    col,
                    letter: cell.letter
                });
            }

            if (
                next &&
                typeof onFocusChange === "function"
            ) {
                await onFocusChange();
            }

            return;
        }

        if (key === "Backspace") {
            let changedCell = null;

            if (cell.letter === "") {
                const previous = getPreviousCell(row, col);

                if (previous) {
                    const previousCell = grid[previous.row][previous.col];

                    setSelectedCell(previous);

                    if (!previousCell.isLocked) {
                        previousCell.letter = "";
                        previousCell.isWrong = false;
                        previousCell.isCorrect = false;

                        changedCell = {
                            row: previous.row,
                            col: previous.col,
                            letter: ""
                        };
                    }
                }
            } else {
                cell.letter = "";
                cell.isWrong = false;
                cell.isCorrect = false;

                changedCell = {
                    row,
                    col,
                    letter: ""
                };
            }

            renderGrid();
            saveGameState();

            if (
                changedCell &&
                typeof onCellLetterChange === "function"
            ) {
                await onCellLetterChange(changedCell);
            }

            if (typeof onFocusChange === "function") {
                await onFocusChange();
            }
        }
    }

    if (mobileKeyboardInput) {
        mobileKeyboardInput.addEventListener("beforeinput", async event => {
            if (!gameActive) return;

            event.preventDefault();

            if (event.inputType === "deleteContentBackward") {
                await handleVirtualKey("Backspace");
                mobileKeyboardInput.value = "";
                return;
            }

            const typedLetter = event.data;

            if (
                typedLetter &&
                typedLetter.length === 1 &&
                typedLetter.match(/[a-z]/i)
            ) {
                await handleVirtualKey(typedLetter);
            }

            mobileKeyboardInput.value = "";
        });
    }
}