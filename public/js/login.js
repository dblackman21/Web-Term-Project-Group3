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

        alert("Login successful!");

        window.location.href = "/";

    } catch (err) {
        console.error("LOGIN FRONT ERROR:", err);
        alert("An error occurred. Please try again.");
    }
}

