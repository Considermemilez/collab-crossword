export function getLeaderboard(puzzleId, mode) {
    const mockLeaderboards = {
        easy001: {
            solo: [
                { playerName: "Gregg", solveTimeMs: "98000" },
                { playerName: "Omi", solveTimeMs: "158000" },
                { playerName: "Brian", solveTimeMs: "356000" },
            ],
            pair: [
                { playerName: "Gregg and Omi", solveTimeMs: "98000" },
                { playerName: "Gregg and Omi", solveTimeMs: "342000" },
                { playerName: "Gregg and Omi", solveTimeMs: "1091000" },
            ]
        }
    };

    const leaderboard = mockLeaderboards[puzzleId]?.[mode] || [];

    return leaderboard.map(entry => ({
        player: entry.playerName,
        time: formatSolveTime(entry.solveTimeMs)
    }));
}

// Format Solve Time
function formatSolveTime(solveTimeMs) {
    const elapsedSeconds = Math.floor(solveTimeMs / 1000);

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
