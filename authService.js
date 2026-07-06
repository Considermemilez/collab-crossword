import { supabaseClient } from "./supabaseClient.js";

export async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Failed to get current auth session:", error);
        return null;
    }

    return data.session?.user || null;
}

export async function signUpWithEmail(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        console.error("Sign up failed:", error);
        return null;
    }

    return data;
}

export async function signInWithEmail(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email, 
        password
    });

    if (error) {
        console.error("Sign in failed:", error);
        return null;
    }

    return data;
}

export async function signOut() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Sign out failed:", error)
        return false;
    }

    return true;
}