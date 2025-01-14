// Form elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const resetForm = document.getElementById('reset-form');
const forgotPasswordLink = document.getElementById('forgot-password');
const backToLoginBtn = document.querySelector('.back-to-login');
const tabBtns = document.querySelectorAll('.tab-btn');

// Turnstile token storage
let loginToken = '';
let registerToken = '';
let resetToken = '';

// Initialize Turnstile widgets
function initializeTurnstile() {
    window.turnstile.render('#login-turnstile', {
        sitekey: '0x4AAAAAAA5Rv_TPzkRnuzYs',
        callback: function(token) {
            loginToken = token;
        },
    });

    window.turnstile.render('#register-turnstile', {
        sitekey: '0x4AAAAAAA5Rv_TPzkRnuzYs',
        callback: function(token) {
            registerToken = token;
        },
    });

    window.turnstile.render('#reset-turnstile', {
        sitekey: '0x4AAAAAAA5Rv_TPzkRnuzYs',
        callback: function(token) {
            resetToken = token;
        },
    });
}

// Initialize Turnstile when the script is loaded
if (document.readyState === 'complete') {
    initializeTurnstile();
} else {
    window.addEventListener('load', initializeTurnstile);
}

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => form.classList.add('hidden'));
        
        const targetForm = btn.dataset.tab === 'login' ? loginForm : registerForm;
        targetForm.classList.remove('hidden');
        
        // Reset all Turnstile widgets
        window.turnstile.reset();
    });
});

// Show/hide password reset form
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    resetForm.classList.remove('hidden');
    window.turnstile.reset();
});

backToLoginBtn.addEventListener('click', () => {
    resetForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    window.turnstile.reset();
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!loginToken) {
        showError('Please complete the Turnstile challenge');
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, turnstileToken: loginToken })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store token and redirect to chat
        localStorage.setItem('chatToken', data.token);
        localStorage.setItem('chatUsername', data.username);
        window.location.href = '/chat.html';
    } catch (error) {
        showError(error.message);
    } finally {
        turnstile.reset();
        loginToken = '';
    }
});

// Register form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    if (!registerToken) {
        showError('Please complete the Turnstile challenge');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, turnstileToken: registerToken })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        showSuccess('Registration successful! Please check your email to verify your account.');
        // Switch to login form
        tabBtns[0].click();
    } catch (error) {
        showError(error.message);
    } finally {
        turnstile.reset();
        registerToken = '';
    }
});

// Password reset request
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value;

    if (!resetToken) {
        showError('Please complete the Turnstile challenge');
        return;
    }

    try {
        const response = await fetch('/api/auth/reset-password-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, turnstileToken: resetToken })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Password reset request failed');
        }

        showSuccess(data.message);
        // Switch back to login form
        backToLoginBtn.click();
    } catch (error) {
        showError(error.message);
    } finally {
        turnstile.reset();
        resetToken = '';
    }
});

// Helper functions for displaying messages
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.auth-container').prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.querySelector('.auth-container').prepend(successDiv);
    setTimeout(() => successDiv.remove(), 5000);
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('chatToken');
    if (token) {
        window.location.href = '/chat.html';
    }
});