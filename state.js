export const SIZE = 15;

export let currentPuzzle = null;

export function setCurrentPuzzle(puzzle) {
    currentPuzzle = puzzle;
}

export let currentSession = {
    players: [],
    mode: "solo",
    puzzleId: null, 
    startTime: null,
    endTime: null,
    completed: false,
}

export let gameActive = false;