import { supabaseClient } from "./supabaseClient.js";
import { getCurrentUser } from "./authService.js";

// Save Crossword FOcus
export async function saveCrosswordFocus({
    roomId,
    row,
    col,
    direction
}) {
    const user = await getCurrentUser();

    if (!user) {
        console.error("Cannot sync crossword focus without a signed-in user.");
        return null;
    }

    const { data, error } = await supabaseClient
        .from("crossword_room_focus")
        .upsert(
            {
                room_id: roomId,
                row_index: row,
                col_index: col,
                direction,
                updated_by: user.id,
                updated_at: new Date().toISOString()
            },
            {
                onConflict: "room_id"
            }
        )
        .select("room_id, row_index, col_index, direction, updated_by, updated_at")
        .single();

    if (error) {
        console.error("Failed to sync crossword focus:", error);
        return null;
    }

    return data;
}

// Load Crossword Focus
export async function loadCrosswordFocus(roomId) {
    const { data, error } = await supabaseClient
        .from("crossword_room_focus")
        .select("room_id, row_index, col_index, direction, updated_by, updated_at")
        .eq("room_id", roomId)
        .maybeSingle();

    if (error) {
        console.error("Failed to load crossword focus:", error);
        return null;
    }

    return data;
}

// Subscribe to Crossword Focus
export function subscribeToCrosswordFocus(roomId, onFocusUpdate) {
    return supabaseClient
        .channel(`crossword-focus-${roomId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "crossword_room_focus",
                filter: `room_id=eq.${roomId}`
            },
            payload => {
                onFocusUpdate(payload.new);
            }
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "crossword_room_focus",
                filter: `room_id=eq.${roomId}`
            },
            payload => {
                onFocusUpdate(payload.new);
            }
        )
        .subscribe((status, error) => {
            console.log("Crossword focus sync status:", status, error);
        });
}

// Unsubscribe from Crossword Focus
export function unsubscribeFromCrosswordFocus(channel) {
    if (!channel) return;

    supabaseClient.removeChannel(channel);
}