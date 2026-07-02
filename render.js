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