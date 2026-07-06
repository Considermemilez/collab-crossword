import { supabaseClient } from "./supabaseClient.js";
import { getCurrentUser } from "./authService.js";
import { getCurrentUserProfile } from "./profileService.js";

export async function getGames() {
    const { data, error } = await supabaseClient
        .from("games")
        .select("key, name, description")
        .eq("is_active", true)
        .order("name", {ascending: true});

    if (error) {
        console.error("Failed to load games:", error)
        return [];
    }

    return data;
}

export async function getRoomsForGame(gameKey) {
    const { data, error } = await supabaseClient
        .from("game_rooms")
        .select(`
            id,
            game_key,
            room_name,
            visibility,
            status,
            max_players,
            created_at
        `)
        .eq("game_key", gameKey)
        .eq("status", "lobby")
        .order("created_at", {ascending: false});

    if (error) {
        console.error("Failed to load rooms:", error);
        return [];
    }

    return data;
        
}

export async function getRoomPlayers(roomId) {
    const { data, error } = await supabaseClient
        .from("game_players")
        .select("id, room_id, user_id, display_name, player_order")
        .eq("room_id", roomId)
        .order("player_order", {ascending: true});

    if (error) {
        console.error("Failed to load room players:", error);
        return [];
    }

    return data;
}

export async function getCrosswordRoomSettings(roomId) {
    const { data, error } = await supabaseClient
        .from("crossword_room_settings")
        .select("room_id, puzzle_id, mode")
        .eq("room_id", roomId)
        .single();

    if (error) {
        console.error("Failed to load crossword room settings", error);
        return null;
    }

    return data;
}

export async function createCrosswordRoom({
    roomName,
    visibility = "public",
    puzzleId,
    mode
}) {
    const user = await getCurrentUser();

    if (!user) {
        console.error("Cannot create room without a signed-in user.");
        return null;
    }

    const profile = await getCurrentUserProfile();

    if (!profile) {
        console.error("Cannot create room without a user profile.");
        return null;
    }

    const cleanedRoomName = roomName.trim();

    if (!cleanedRoomName) {
        console.error("Room name is required.");
        return null;
    }

    const { data: room, error: roomError } = await supabaseClient
        .from("game_rooms")
        .insert({
            game_key: "crossword",
            room_name: cleanedRoomName,
            visibility,
            status: "lobby",
            created_by: user.id,
            max_players: mode === "pair" ? 2 : 1
        })
        .select("id, game_key, room_name, visibility, status, max_players")
        .single();

    if (roomError) {
        console.error("Failed to create room:", roomError);
        return null;
    }

    const { error: playerError } = await supabaseClient
        .from("game_players")
        .insert({
            room_id: room.id,
            user_id: user.id,
            display_name: profile.display_name,
            player_order: 1
        });

    if (playerError) {
        console.error("Failed to add creator as a room player:", playerError);
        return null;
    }

    const { error: settingsError } = await supabaseClient
        .from("crossword_room_settings")
        .insert({
            room_id: room.id,
            puzzle_id: puzzleId,
            mode
        });

    if (settingsError) {
        console.error("Failed to create crossword room settings:", settingsError);
        return null;
    }

    return room;
}

export async function getCrosswordRoomSummaries() {
    const currentUser = await getCurrentUser();

    const { data, error } = await supabaseClient
        .from("game_rooms")
        .select(`
            id,
            room_name,
            visibility,
            status,
            max_players,
            created_at,
            game_players (
                id,
                user_id,
                display_name,
                player_order
            ),
            crossword_room_settings (
                puzzle_id,
                mode
            )
        `)
        .eq("game_key", "crossword")
        .in("status", ["lobby", "active"])
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to load crossword room summaries:", error);
        return [];
    }

    return data.map(room => {

        const players = [...room.game_players].sort(
            (a, b) => a.player_order - b.player_order
        );

        const crosswordSettings = Array.isArray(room.crossword_room_settings)
            ? room.crossword_room_settings[0]
            : room.crossword_room_settings;

        return {
            id: room.id,
            roomName: room.room_name,
            visibility: room.visibility,
            status: room.status,
            playerCount: players.length,
            maxPlayers: room.max_players,
            puzzleId: crosswordSettings?.puzzle_id || "Unknown",
            mode: crosswordSettings?.mode || "Unknown",
            players: players.map(player => ({
                id: player.id,
                userId: player.user_id,
                displayName: player.display_name,
                playerOrder: player.player_order
            })),
            isCurrentUserInRoom: players.some(player =>
                player.user_id === currentUser?.id
            )
        };
    });
}

export async function getRoomById(roomId) {
    const { data, error } = await supabaseClient
        .from("game_rooms")
        .select("id, game_key, room_name, visibility, status, max_players")
        .eq("id", roomId)
        .single();

    if (error) {
        console.error("Failed to load room:", error);
        return null;
    }

    return data;
}

export async function joinRoom(roomId) {
    const user = await getCurrentUser();

    if (!user) {
        console.error("Cannot join room without a signed-in user.");
        return null;
    }

    const profile = await getCurrentUserProfile();

    if (!profile) {
        console.error("Cannot join room without a user profile.");
        return null;
    }

    const players = await getRoomPlayers(roomId);

    const alreadyJoined = players.some(player =>
        player.user_id === user.id
    );

    if (alreadyJoined) {
        console.warn("User has already joined this room.");
        return null;
    }

    const room = await getRoomById(roomId);

    if (!room) {
        console.error("Cannot join missing room.");
        return null;
    }

    if (players.length >= room.max_players) {
        console.error("Cannot join room because it is full.");
        return null;
    }

    const nextPlayerOrder = players.length + 1;

    const { data, error } = await supabaseClient
        .from("game_players")
        .insert({
            room_id: roomId,
            user_id: user.id,
            display_name: profile.display_name,
            player_order: nextPlayerOrder
        })
        .select("id, room_id, user_id, display_name, player_order")
        .single();

    if (error) {
        console.error("Failed to join room:", error);
        return null;
    }

    const { error: roomUpdateError } = await supabaseClient
        .from("game_rooms")
        .update({
            updated_at: new Date().toISOString()
        })
        .eq("id", roomId);

    if (roomUpdateError) {
        console.error("Joined room, but failed to update room timestamp:", roomUpdateError);
    }

    return data;
}

export async function getCrosswordRoomDetails(roomId) {
    const currentUser = await getCurrentUser();

    const { data, error } = await supabaseClient
        .from("game_rooms")
        .select(`
            id,
            room_name,
            visibility,
            status,
            max_players,
            created_at,
            created_by,
            game_players (
                id,
                user_id,
                display_name,
                player_order
            ),
            crossword_room_settings (
                puzzle_id,
                mode
            )
        `)
        .eq("id", roomId)
        .single();

    if (error) {
        console.error("Error loading crossword room details:", error);
        return null;
    }

    const players = [...data.game_players].sort(
        (a, b) => a.player_order - b.player_order
    );

    const crosswordSettings = Array.isArray(data.crossword_room_settings)
        ? data.crossword_room_settings[0]
        : data.crossword_room_settings;

    return {
        id: data.id,
        roomName: data.room_name,
        visibility: data.visibility,
        status: data.status,
        maxPlayers: data.max_players,
        puzzleId: crosswordSettings?.puzzle_id || "Unknown",
        mode: crosswordSettings?.mode || "Unknown",
        createdBy: data.created_by,
        players: players.map(player => ({
            id: player.id,
            userId: player.user_id,
            displayName: player.display_name,
            playerOrder: player.player_order
        })),
        isCurrentUserInRoom: players.some(player =>
            player.user_id === currentUser?.id
        ),
        isCurrentUserCreator: data.created_by === currentUser?.id
    };
}

export async function startCrosswordRoom(roomId) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        console.error("Cannot start room without signed-in user.");
        return null;
    }

    const { data, error } = await supabaseClient
        .from("game_rooms")
        .update({
            status: "active",
            updated_at: new Date().toISOString()
        })
        .eq("id", roomId)
        .eq("created_by", currentUser.id)
        .select("id, status")
        .single();

    if (error) {
        console.error("Error starting crossword room:", error);
        return null;
    }

    return data;
}