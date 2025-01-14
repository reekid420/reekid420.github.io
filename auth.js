// Form elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const resetForm = document.getElementById('reset-form');
const forgotPasswordLink = document.getElementById('forgot-password');
const backToLoginBtn = document.querySelector('.back-to-login');
const tabBtns = document.querySelectorAll('.tab-btn');

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => form.classList.add('hidden'));
        
        const targetForm = btn.dataset.tab === 'login' ? loginForm : registerForm;
        targetForm.classList.remove('hidden');
    });
});

// Show/hide password reset form
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    resetForm.classList.remove('hidden');
});

backToLoginBtn.addEventListener('click', () => {
    resetForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const recaptchaToken = grecaptcha.getResponse();

    if (!recaptchaToken) {
        showError('Please complete the reCAPTCHA');
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, recaptchaToken })
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
        grecaptcha.reset();
    }
});

// Register form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const recaptchaToken = grecaptcha.getResponse();

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    if (!recaptchaToken) {
        showError('Please complete the reCAPTCHA');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, recaptchaToken })
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
        grecaptcha.reset();
    }
});

// Password reset request
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value;
    const recaptchaToken = grecaptcha.getResponse();

    if (!recaptchaToken) {
        showError('Please complete the reCAPTCHA');
        return;
    }

    try {
        const response = await fetch('/api/auth/reset-password-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, recaptchaToken })
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
        grecaptcha.reset();
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