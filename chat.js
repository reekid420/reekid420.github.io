// Connect to Socket.IO server
const socket = io('http://localhost:3000');

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const usersList = document.getElementById('users');
const onlineCount = document.getElementById('online-count');

// Get username
let username = localStorage.getItem('chatUsername');
if (!username) {
    username = prompt('Enter your username:') || 'User' + Math.floor(Math.random() * 1000);
    localStorage.setItem('chatUsername', username);
}

// Join chat
socket.emit('userJoin', username);

// Handle chat history
socket.on('chatHistory', (messages) => {
    chatMessages.innerHTML = '';
    messages.forEach(addMessage);
    scrollToBottom();
});

// Handle incoming messages
socket.on('chatMessage', (data) => {
    addMessage(data);
    scrollToBottom();
});

// Handle user join
socket.on('userJoined', (data) => {
    addSystemMessage(`${data.user} joined the chat`);
    updateUsersList(data.activeUsers);
});

// Handle user leave
socket.on('userLeft', (data) => {
    addSystemMessage(`${data.user} left the chat`);
    updateUsersList(data.activeUsers);
});

// Handle errors
socket.on('error', (message) => {
    addSystemMessage(`Error: ${message}`, true);
});

// Send message function
function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        socket.emit('chatMessage', message);
        chatInput.value = '';
    }
}

// Add message to chat
function addMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    if (data.user === username) {
        messageDiv.className += ' own-message';
    }

    const usernameDiv = document.createElement('div');
    usernameDiv.className = 'username';
    usernameDiv.textContent = data.user;

    const messageContent = document.createElement('div');
    messageContent.className = 'content';
    messageContent.textContent = data.message;

    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date(data.timestamp).toLocaleTimeString();

    messageDiv.appendChild(usernameDiv);
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(timestamp);
    chatMessages.appendChild(messageDiv);
}

// Add system message
function addSystemMessage(message, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message system';
    if (isError) {
        messageDiv.className += ' error';
    }

    const messageContent = document.createElement('div');
    messageContent.className = 'content';
    messageContent.textContent = message;

    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Update users list
function updateUsersList(users) {
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.username;
        if (user.username === username) {
            li.textContent += ' (You)';
            li.className = 'current-user';
        }
        usersList.appendChild(li);
    });
    onlineCount.textContent = users.length;
}

// Scroll chat to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        scrollToBottom();
    }
}); 