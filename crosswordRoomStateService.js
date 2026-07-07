import { supabaseClient } from "./supabaseClient.js";
import { getCurrentUser } from "./authService.js";
// Mark Crossword Room Reveal Used
export async function markCrosswordRoomRevealUsed(roomId) {
    const user = await getCurrentUser();

    if (!user) {
        console.error("Cannot mark reveal used without a signed-in user.");
        return null;
    }

    const { data, error } = await supabaseClient
        .from("crossword_room_game_state")
        .upsert(
            {
                room_id: roomId,
                used_reveal: true,
                updated_by: user.id,
                updated_at: new Date().toISOString()
            },
            {
                onConflict: "room_id"
            }
        )
        .select("room_id, used_reveal, updated_by, updated_at")
        .single();

    if (error) {
        console.error("Failed to mark room reveal used:", error);
        return null;
    }

    return data;
}

// Load Crossword Room State
export async function loadCrosswordRoomGameState(roomId) {
    const { data, error } = await supabaseClient
        .from("crossword_room_game_state")
        .select("room_id, used_reveal, updated_by, updated_at")
        .eq("room_id", roomId)
        .maybeSingle();

    if (error) {
        console.error("Failed to load crossword room game state:", error);
        return null;
    }

    return data;
}

// Subscribe to Crossword Room State
export function subscribeToCrosswordRoomGameState(roomId, onRoomGameStateUpdate) {
    return supabaseClient
        .channel(`crossword-room-game-state-${roomId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "crossword_room_game_state",
                filter: `room_id=eq.${roomId}`
            },
            payload => {
                onRoomGameStateUpdate(payload.new);
            }
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "crossword_room_game_state",
                filter: `room_id=eq.${roomId}`
            },
            payload => {
                onRoomGameStateUpdate(payload.new);
            }
        )
        .subscribe((status, error) => {
            console.log("Crossword room game state sync status:", status, error);
        });
}

// Unsubscribe from Crossword Room State
export function unsubscribeFromCrosswordRoomGameState(channel) {
    if (!channel) return;

    supabaseClient.removeChannel(channel);
}