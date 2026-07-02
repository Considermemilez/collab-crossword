import { setCurrentPuzzle, currentSession } from "./state.js";

export async function loadPuzzle(puzzleId) {
    const response = await fetch(`puzzles/${puzzleId}.json`);
    const puzzle = await response.json();

    setCurrentPuzzle(puzzle);
    currentSession.puzzleId = puzzleId;
}
