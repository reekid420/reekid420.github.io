// Server configuration
const SERVER_URL = 'http://localhost:3000'; // Change this to your deployed server URL when deploying

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
        const response = await fetch(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password, turnstileToken: loginToken })
        });

        // Log the raw response for debugging
        const responseText = await response.text();
        console.log('Raw server response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response text that failed to parse:', responseText);
            throw new Error('Server response was not valid JSON. Please try again.');
        }
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store token and redirect to chat
        localStorage.setItem('chatToken', data.token);
        localStorage.setItem('chatUsername', data.username);
        window.location.href = '/chat.html';
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message);
    } finally {
        window.turnstile.reset();
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
        console.log('Sending registration request with data:', {
            username,
            email,
            turnstileToken: registerToken,
            password: '***' // Hide password in logs
        });

        const response = await fetch(`${SERVER_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                username,
                email,
                password,
                turnstileToken: registerToken
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        // Log the raw response for debugging
        const responseText = await response.text();
        console.log('Raw server response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response text that failed to parse:', responseText);
            throw new Error('Server response was not valid JSON. Please try again.');
        }
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        showSuccess('Registration successful! Please check your email to verify your account.');
        // Switch to login form
        tabBtns[0].click();
    } catch (error) {
        console.error('Registration error:', error);
        console.error('Full error object:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        showError(error.message);
    } finally {
        window.turnstile.reset();
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
        const response = await fetch(`${SERVER_URL}/api/auth/reset-password-request`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, turnstileToken: resetToken })
        });

        // Log the raw response for debugging
        const responseText = await response.text();
        console.log('Raw server response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response text that failed to parse:', responseText);
            throw new Error('Server response was not valid JSON. Please try again.');
        }
        
        if (!response.ok) {
            throw new Error(data.error || 'Password reset request failed');
        }

        showSuccess(data.message);
        // Switch back to login form
        backToLoginBtn.click();
    } catch (error) {
        console.error('Password reset error:', error);
        showError(error.message);
    } finally {
        window.turnstile.reset();
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

// Check server availability
async function checkServer() {
    try {
        const response = await fetch(`${SERVER_URL}/api/health`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            console.log('Server is running and accessible');
        } else {
            console.error('Server returned error:', response.status);
            showError('Server is not responding properly. Please try again later.');
        }
    } catch (error) {
        console.error('Server connection error:', error);
        showError('Cannot connect to server. Please check your connection.');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in
    const token = localStorage.getItem('chatToken');
    if (token) {
        window.location.href = '/chat.html';
        return;
    }

    // Check server availability
    await checkServer();
});