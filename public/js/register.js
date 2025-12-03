function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    strengthFill.className = 'strength-fill';

    if (password.length === 0) {
        strengthText.textContent = '';
        strengthFill.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
    } else if (strength <= 1) {
        strengthFill.classList.add('strength-weak');
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#ff4757';
    } else if (strength <= 3) {
        strengthFill.classList.add('strength-medium');
        strengthText.textContent = 'Medium';
        strengthText.style.color = '#ffa502';
    } else {
        strengthFill.classList.add('strength-strong');
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#26de81';
    }
}

function handleSignup(event) {
    event.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const passwordError = document.getElementById('password-error');

    if (password !== confirmPassword) {
        passwordError.style.display = 'block';
        return;
    } else {
        passwordError.style.display = 'none';
    }

    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;

    alert('Account created with success for: ' + firstname + ' ' + lastname);
    /* Add account to database */
}
