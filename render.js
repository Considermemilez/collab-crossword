import { SIZE, currentPuzzle } from "./state.js";

// Render Clues
export function renderClues(acrossWords, downWords, activeWord, setActiveWord) {
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

// Create Cell Element
export function createCellElement() {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    return cell;
}

// Render Cell Number
export function renderCellNumber(cellElement, cellData) {
    if (!cellData.number) return;

    const number = document.createElement("span");
    number.classList.add("cell-number");
    number.textContent = cellData.number;

    cellElement.appendChild(number);
}

// Render Cell Letter
export function renderCellLetter(cellElement, cellData) {
    const letter = document.createElement("span");
    letter.textContent = cellData.letter;

    cellElement.appendChild(letter);
}

// Apply Cell Classes
export function applyCellClasses(
    cellElement,
    cellData,
    row,
    col,
    selectedCell,
    isActive
) {

    if (cellData.isBlack) {
        cellElement.classList.add("black");
    } else {
        cellElement.classList.add("white");
    }

    if (cellData.isCorrect) {
        cellElement.classList.add("correct");
    }

    if (cellData.isLocked) {
        cellElement.classList.add("locked");
    }

    if (cellData.isWrong) {
        cellElement.classList.add("wrong");
    }

    if (isActive) {
        cellElement.classList.add("active-word");
    }

    if (
        selectedCell.row === row &&
        selectedCell.col === col
    ) {
        cellElement.classList.add("selected");
    }
}


