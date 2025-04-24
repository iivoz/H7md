// DOM Elements
const messageInput = document.querySelector('input[type="text"]');
const sendButton = document.querySelector('.fa-paper-plane').parentElement;
const imageButton = document.querySelector('.fa-image').parentElement;
const messagesContainer = document.querySelector('.message-container');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const contactsList = document.querySelector('.overflow-y-auto');

let currentRecipient = null;
let isPublicChat = true; // Flag for public chat

auth.onAuthStateChanged((user) => {
    if (user) {
        userAvatar.src = user.photoURL || 'https://via.placeholder.com/40';
        userName.textContent = user.displayName || user.email;

        updateOnlineStatus('online');

        loadContacts();

        // Load public chat messages
        loadPublicMessages();

        database.ref('.info/connected').on('value', (snap) => {
            if (snap.val() === true) {
                database.ref(`users/${user.uid}/status`).onDisconnect().update({
                    state: 'offline',
                    last_changed: firebase.database.ServerValue.TIMESTAMP
                });
            }
        });

        // Show admin link if user is admin
        const adminLink = document.getElementById('admin-link');
        if (adminLink) {
            if (user.email === 'admin@example.com') {
                adminLink.classList.remove('hidden');
            } else {
                adminLink.classList.add('hidden');
            }
        }
    }
});

function loadContacts() {
    database.ref('users').on('value', (snapshot) => {
        contactsList.innerHTML = ''; // Clear existing contacts

        snapshot.forEach((child) => {
            const contact = child.val();
            const userId = child.key;

            // Show all users including current user
            const contactElement = createContactElement(contact, userId);
            contactsList.appendChild(contactElement);
        });
    });
}

function createContactElement(contact, userId) {
    const div = document.createElement('div');
    div.className = 'p-4 border-b hover:bg-gray-50 cursor-pointer';
    div.innerHTML = `
        <div class="flex items-center">
            <div class="relative">
                <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-lg">
                    ${contact.displayName ? contact.displayName.charAt(0).toUpperCase() : 'م'}
                </div>
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

    div.addEventListener('click', () => {
        currentRecipient = userId;
        isPublicChat = false;
        loadMessages(userId);
        updateChatHeader(contact);
    });

    return div;
}

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

function loadMessages(recipientId) {
    messagesContainer.innerHTML = '';

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

function loadPublicMessages() {
    messagesContainer.innerHTML = '';

    database.ref('publicMessages')
        .orderByChild('timestamp')
        .on('child_added', (snapshot) => {
            const message = snapshot.val();
            displayMessage(message);
        });
}

function displayMessage(message) {
    const isOwnMessage = message.senderId === auth.currentUser.uid;
    const div = document.createElement('div');
    div.className = `flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`;

    let messageContent = '';
    if (message.type === 'image') {
        messageContent = `<img src="${message.message}" alt="Shared image" class="max-w-xs rounded">`;
    } else if (message.type === 'pdf') {
        messageContent = `<embed src="${message.message}" type="application/pdf" width="200" height="150" />`;
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

sendButton.addEventListener('click', sendNewMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendNewMessage();
    }
});

function sendNewMessage() {
    if (isPublicChat) {
        if (!messageInput.value.trim()) {
            alert('يرجى كتابة رسالة');
            return;
        }
        sendPublicMessage(messageInput.value.trim());
    } else {
        if (!currentRecipient || !messageInput.value.trim()) {
            alert('يرجى اختيار مستلم وكتابة رسالة');
            return;
        }
        sendMessage(currentRecipient, messageInput.value.trim())
            .catch((error) => {
                console.error('Error sending message:', error);
                alert('حدث خطأ أثناء إرسال الرسالة');
            });
    }
    messageInput.value = '';
}

function sendPublicMessage(message) {
    const senderId = auth.currentUser.uid;
    const timestamp = firebase.database.ServerValue.TIMESTAMP;

    database.ref('publicMessages').push({
        senderId,
        message,
        timestamp
    });
}

imageButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const storageRef = storage.ref(`files/${auth.currentUser.uid}/${Date.now()}_${file.name}`);

        storageRef.put(file)
            .then((snapshot) => snapshot.ref.getDownloadURL())
            .then((url) => {
                const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
                if (isPublicChat) {
                    return sendPublicMessage(url, fileType);
                } else {
                    return sendMessage(currentRecipient, url, fileType);
                }
            })
            .catch((error) => {
                console.error('Error uploading file:', error);
                alert('حدث خطأ أثناء رفع الملف');
            });
    };

    input.click();
});

document.addEventListener('visibilitychange', () => {
    updateOnlineStatus(document.hidden ? 'away' : 'online');
});

window.addEventListener('beforeunload', () => {
    updateOnlineStatus('offline');
});
