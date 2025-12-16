async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            alert(data.message || "Invalid credentials");
            return;
        }

        if (data.token) {
            localStorage.setItem("authToken", data.token);
        }
        if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
        }

        await mergeGuestCartAfterLogin(data.token);

        if (window.navAPI) {
            window.navAPI.updateSideMenu();
        }

        alert("Login successful!");
        window.location.href = "/";

    } catch (err) {
        console.error("LOGIN FRONT ERROR:", err);
        alert("An error occurred. Please try again.");
    }
}

/**
 * Merge guest cart with user cart after successful login
 */
async function mergeGuestCartAfterLogin(token) {
    try {
        const response = await fetch('/cart/merge', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Important pour envoyer les cookies
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('Cart merged successfully:', data.message);
        } else {
            console.warn('Cart merge warning:', data.message);
        }
    } catch (error) {
        console.error('MERGE CART ERROR:', error);
        // Ne pas bloquer le login si le merge échoue
    }
}