// DOM Elements
const messageInput = document.querySelector('input[type="text"]');
const sendButton = document.querySelector('.fa-paper-plane').parentElement;
const imageButton = document.querySelector('.fa-image').parentElement;
const messagesContainer = document.querySelector('.message-container');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const contactsList = document.querySelector('.overflow-y-auto');

// Current chat recipient
let currentRecipient = null;

// Initialize user profile
auth.onAuthStateChanged((user) => {
    if (user) {
        // Update profile display
        userAvatar.src = user.photoURL || 'https://via.placeholder.com/40';
        userName.textContent = user.displayName || user.email;
        
        // Set online status
        updateOnlineStatus('online');
        
        // Load contacts
        loadContacts();
        
        // Set offline status on disconnect
        database.ref('.info/connected').on('value', (snap) => {
            if (snap.val() === true) {
                database.ref(`users/${user.uid}/status`).onDisconnect().set({
                    state: 'offline',
                    last_changed: firebase.database.ServerValue.TIMESTAMP
                });
            }
        });
    }
});

// Load contacts
function loadContacts() {
    database.ref('users').on('value', (snapshot) => {
        contactsList.innerHTML = ''; // Clear existing contacts
        
        snapshot.forEach((child) => {
            const contact = child.val();
            const userId = child.key;
            
            if (userId !== auth.currentUser.uid) {
                const contactElement = createContactElement(contact, userId);
                contactsList.appendChild(contactElement);
            }
        });
    });
}

// Create contact element
function createContactElement(contact, userId) {
    const div = document.createElement('div');
    div.className = 'p-4 border-b hover:bg-gray-50 cursor-pointer';
    div.innerHTML = `
        <div class="flex items-center">
            <div class="relative">
                <img src="${contact.photoURL || 'https://via.placeholder.com/40'}" 
                     alt="Contact" 
                     class="w-10 h-10 rounded-full">
                <span class="absolute bottom-0 right-0 w-3 h-3 ${
                    contact.status?.state === 'online' ? 'bg-green-500' : 'bg-gray-500'
                } border-2 border-white rounded-full"></span>
            </div>
            <div class="mr-3">
                <div class="font-semibold">${contact.displayName || 'مستخدم'}</div>
                <div class="text-sm text-gray-500">${
                    contact.status?.state === 'online' ? 'متصل' : 'غير متصل'
                }</div>
            </div>
        </div>
    `;
    
    // Add click event to start chat
    div.addEventListener('click', () => {
        currentRecipient = userId;
        loadMessages(userId);
        updateChatHeader(contact);
    });
    
    return div;
}

// Update chat header
function updateChatHeader(contact) {
    const header = document.querySelector('.chat-header');
    header.innerHTML = `
        <div class="flex items-center">
            <img src="${contact.photoURL || 'https://via.placeholder.com/40'}" 
                 alt="Contact" 
                 class="w-10 h-10 rounded-full">
            <div class="mr-3">
                <div class="font-semibold">${contact.displayName || 'مستخدم'}</div>
                <div class="text-sm text-gray-500">${
                    contact.status?.state === 'online' ? 'متصل' : 'غير متصل'
                }</div>
            </div>
        </div>
    `;
}

// Load messages
function loadMessages(recipientId) {
    messagesContainer.innerHTML = ''; // Clear existing messages
    
    database.ref('messages')
        .orderByChild('timestamp')
        .on('child_added', (snapshot) => {
            const message = snapshot.val();
            if ((message.senderId === auth.currentUser.uid && message.recipientId === recipientId) ||
                (message.senderId === recipientId && message.recipientId === auth.currentUser.uid)) {
                displayMessage(message);
            }
        });
}

// Display message
function displayMessage(message) {
    const isOwnMessage = message.senderId === auth.currentUser.uid;
    const div = document.createElement('div');
    div.className = `flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`;
    
    let messageContent = '';
    if (message.type === 'image') {
        messageContent = `<img src="${message.message}" alt="Shared image" class="max-w-xs rounded">`;
    } else {
        messageContent = message.message;
    }
    
    div.innerHTML = `
        <div class="${
            isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
        } rounded-lg py-2 px-4 max-w-md">
            ${messageContent}
        </div>
    `;
    
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message
sendButton.addEventListener('click', sendNewMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendNewMessage();
    }
});

function sendNewMessage() {
    if (!currentRecipient || !messageInput.value.trim()) return;
    
    sendMessage(currentRecipient, messageInput.value.trim())
        .then(() => {
            messageInput.value = '';
        })
        .catch((error) => {
            console.error('Error sending message:', error);
            alert('حدث خطأ أثناء إرسال الرسالة');
        });
}

// Image upload
imageButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const storageRef = storage.ref(`images/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
        
        storageRef.put(file)
            .then((snapshot) => snapshot.ref.getDownloadURL())
            .then((url) => {
                return sendMessage(currentRecipient, url, 'image');
            })
            .catch((error) => {
                console.error('Error uploading image:', error);
                alert('حدث خطأ أثناء رفع الصورة');
            });
    };
    
    input.click();
});

// Handle page visibility for online status
document.addEventListener('visibilitychange', () => {
    updateOnlineStatus(document.hidden ? 'away' : 'online');
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    updateOnlineStatus('offline');
});
