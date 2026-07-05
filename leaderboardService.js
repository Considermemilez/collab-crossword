export function getLeaderboard(puzzleId, mode) {
    const mockLeaderboards = {
        easy001: {
            solo: [
                { player: "Gregg", time: "1:38" },
                { player: "Omi", time: "2:38" },
                { player: "Brian", time: "5:56" },
            ],
            pair: [
                { player: "Gregg and Omi", time: "1:38" },
                { player: "Gregg and Omi", time: "5:42" },
                { player: "Gregg and Omi", time: "18:11" },
            ]
        }
    };

    return mockLeaderboards[puzzleId]?.[mode] || [];
}
