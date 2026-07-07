import { supabaseClient } from "./supabaseClient.js";
import { getCurrentUser } from "./authService.js";

// Save Crossword Cells
export async function saveCrosswordCell({
    roomId,
    row,
    col,
    letter,
    isRevealed = false
}) {
    const user = await getCurrentUser();

    if (!user) {
        console.error("Cannot sync crossword cell without a signed-in user.");
        return null;
    }

    const cleanedLetter = (letter || "").trim().toUpperCase();

    if (cleanedLetter.length > 1) {
        console.error("Cell letter must be empty or one character.");
        return null;
    }

    const cellRow = {
        room_id: roomId,
        row_index: row,
        col_indec: col,
        letter: cleanedLetter,
        updated_by: user.id,
        updated_at: new Date().toISOString()
    };

    if (isRevealed) {
        cellRow.is_revealed = true;
    }

    const { data, error } = await supabaseClient
        .from("crossword_cell_states")
        .upsert(
            cellRow,
            {
                onConflict: "room_id,row_index,coll_index"
            }
        )
        .select("room_id, row_index, col_index, letter, is_revealed, updated_by, updated_at")
        .single();

    if (error) {
        console.error("Failed to sync crossword cell:", error);
        return null;
    }

    return data;
}

// Save Crossword Cells
export async function saveCrosswordCells({
    roomId,
    cells
}) {
    const user = await getCurrentUser();

    if (!user) {
        console.error("Cannot sync crossword cells without a signed-in user.");
        return [];
    }

    if (!Array.isArray(cells) || cells.length === 0) {
        return [];
    }

    const now = new Date().toISOString();

    const rows = cells.map(cell => {
        const cleanedLetter = (cell.letter || "").trim().toUpperCase();

        const row = {
            room_id: roomId,
            row_index: cell.row,
            col_index: cell.col,
            letter: cleanedLetter,
            updated_by: user.id,
            updated_at: now
        };

        if (cell.isRevealed) {
            row.is_revealed = true;
        }

        return row;
    });

    const { data, error } = await supabaseClient
        .from("crossword_cell_states")
        .upsert(
            rows,
            {
                onConflict: "room_id,row_index,col_index"
            }
        )
        .select("room_id, row_index, col_index, letter, is_revealed, updated_by, updated_at");

    if (error) {
        console.error("Failed to sync crossword cells:", error);
        return [];
    }

    return data;
}

// Load crossword cells
export async function loadCrosswordCells(roomId) {
    const { data, error } = await supabaseClient
        .from("crossword_cell_states")
        .select("room_id, row_index, col_index, letter, updated_by, updated_at")
        .eq("room_id", roomId);

    if (error) {
        console.error("Failed to load crossword cell state:", error);
        return [];
    }

    return data;
}

// Subscribe to Crossword Cell Updates
export function subscribeToCrosswordCellUpdates(roomId, onCellUpdate) {
    return supabaseClient
        .channel(`crossword-cells-${roomId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "crossword_cell_states",
                filter: `room_id=eq.${roomId}`
            },
            payload => {
                onCellUpdate(payload.new);
            }
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "crossword_cell_states",
                filter: `room_id=eq.${roomId}`
            },
            payload => {
                onCellUpdate(payload.new);
            }
        )
        .subscribe((status, error) => {
            console.log("Crossword cell sync status:", status, error);
        });
}

// Unsubscribe From Crossword Cell Updates
export function unsubscribeFromCrosswordCellUpdates(channel) {
    if (!channel) return;

    supabaseClient.removeChannel(channel);
}