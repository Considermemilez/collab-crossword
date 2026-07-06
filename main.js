import "./supabaseClient.js";
import { setupAuthUI } from "./authUI.js";
import "./script.js";

setupAuthUI({
    authStatus: document.getElementById("auth-status"),
    authEmailInput: document.getElementById("auth-email"),
    authPasswordInput: document.getElementById("auth-password"),
    signUpButton: document.getElementById("auth-sign-up-btn"),
    signInButton: document.getElementById("auth-sign-in-btn"),
    signOutButton: document.getElementById("auth-sign-out-btn"),
});