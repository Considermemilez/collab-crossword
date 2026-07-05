import { supabaseClient } from "./supabaseClient.js";

// Format Solve Time
function formatSolveTime(solveTimeMs) {
    const elapsedSeconds = Math.floor(solveTimeMs / 1000);

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
// Get Leaderboard Entries
export async function getLeaderboard(puzzleId, mode) {
    const { data, error} = await supabaseClient
        .from("leaderboard_entries")
        .select("player_name, solve_time_ms")
        .eq("puzzle_id", puzzleId)
        .eq("mode", mode)
        .eq("used_reveal", false)
        .order("solve_time_ms", { ascending: true})
        .limit(10);
        
    if (error) {
        console.error("Failed to load leaderboard:", error);
        return [];
    }

    return data.map(entry => ({
        player: entry.player_name,
        time: formatSolveTime(entry.solve_time_ms)
    }));
}

// Save Leaderboard Entry
export async function saveLeaderboardEntry({
    puzzleId,
    mode,
    playerName,
    solveTimeMs,
    usedReveal
}) {
    if (usedReveal) {
        return;
    }

    const { error } = await supabaseClient
    .from("leaderboard_entries")
    .insert({
        puzzle_id: puzzleId,
        mode,
        player_name: playerName,
        solve_time_ms: solveTimeMs,
        used_reveal: usedReveal
    });

    if (error) {
        console.error("Failed to save leaderboard entry:", error);
    }
}


