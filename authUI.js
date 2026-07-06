import {
    getCurrentUser,
    signUpWithEmail,
    signInWithEmail,
    signOut
} from "./authService.js";

export function setupAuthUI({
    authStatus,
    authEmailInput,
    authPasswordInput,
    signUpButton,
    signInButton,
    signOutButton
}) {
    async function refreshAuthStatus() {
        const user = await getCurrentUser();

        if (user) {
            authStatus.textContent = `Signed in as ${user.email}`;

            authEmailInput.classList.add("hidden");
            authPasswordInput.classList.add("hidden");
            signUpButton.classList.add("hidden");
            signInButton.classList.add("hidden");
            signOutButton.classList.remove("hidden");

            return;
        }

        authStatus.textContent = "Not signed in";

        authEmailInput.classList.remove("hidden");
        authPasswordInput.classList.remove("hidden");
        signUpButton.classList.remove("hidden");
        signInButton.classList.remove("hidden");
        signOutButton.classList.add("hidden");
    }

    function getAuthInputValues() {
        return {
            email: authEmailInput.value.trim(),
            password: authPasswordInput.value
        };
    }

    function validateAuthInputs(email, password) {
        if (!email) {
            alert("Please enter an email address.");
            return false;
        }

        if (!password){
            alert("Please enter a password.");
            return false;
        }

        if (password.length < 6) {
            alert("Password must be at lest 6 characters.");
            return false;
        }

        return true;
    }

    signUpButton.addEventListener("click", async () => {
        const { email, password } = getAuthInputValues();

        if (!validateAuthInputs(email, password)) {
            return;
        }

        const result = await signUpWithEmail(email, password);

        if (!result) {
            alert("Sign up failed. Check the console for details");
            return;
        }

        alert("Sign up successful. You may need top confirm your email before signing in.");

        await refreshAuthStatus();
    });

    signInButton.addEventListener("click", async () => {
        const { email, password } = getAuthInputValues();

        if (!validateAuthInputs(email, password)) {
            return;
        }

        const result = await signInWithEmail(email, password);

        if (!result) {
            alert("Sign in failed. Check your email/password and the console.");
            return;
        }

        authPasswordInput.value = "";

        await refreshAuthStatus();
    });
    
    signOutButton.addEventListener("click", async () => {
        const success = await signOut();

        if (!success) {
            alert("Sign out failed. Check the console for details.");
            return;
        }

        await refreshAuthStatus();
    });

    refreshAuthStatus();
}