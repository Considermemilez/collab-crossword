import { supabaseClient } from "./supabaseClient.js";
import { getCurrentUser } from "./authService.js";

export async function getCurrentUserProfile() {
    const user = await getCurrentUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, display_name")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error("Failed to load profile:", error);
        return null;
    }

    return data;
}

export async function saveCurrentUserProfile(displayName) {
    const user = await getCurrentUser();

    if (!user) {
        console.error("Cannot save profile without a signed-in user.");
        return null;
    }

    const cleanedDisplayName = displayName.trim();

    if (!cleanedDisplayName) {
        console.error("display name is required.");
        return null;
    }

    const { data, error } = await supabaseClient
        .from("profiles")
        .upsert({
            id: user.id,
            display_name: cleanedDisplayName,
            updated_at: new Date().toISOString()
        })
        .select("id, display_name")
        .single();
    
    if (error) {
        console.error("failed to save profile:", error);
        return null;
    }

    return data;
}