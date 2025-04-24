// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACSUFO7HRa7N7UiVJvUarKl-rm8V9Ka84",
  authDomain: "tstapp-8204d.firebaseapp.com",
  projectId: "tstapp-8204d",
  storageBucket: "tstapp-8204d.firebasestorage.app",
  messagingSenderId: "148357944551",
  appId: "1:148357944551:web:978ac0e7652303817fbe42"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Auth instance
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.uid);
        if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
            window.location.href = '/chat.html';
        }
    } else {
        // User is signed out
        console.log('User is signed out');
        if (window.location.pathname === '/chat.html') {
            window.location.href = '/index.html';
        }
    }
});

// Google Sign In
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
}

// Email/Password Sign In
function signInWithEmail(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

// Sign Out
function signOut() {
    return auth.signOut();
}

// Create new user
function createUser(email, password) {
    return auth.createUserWithEmailAndPassword(email, password);
}

// Update user profile
function updateProfile(displayName, photoURL) {
    return auth.currentUser.updateProfile({
        displayName: displayName,
        photoURL: photoURL
    });
}

// Send message
function sendMessage(recipientId, message, type = 'text') {
    const senderId = auth.currentUser.uid;
    const timestamp = firebase.database.ServerValue.TIMESTAMP;
    
    return database.ref('messages').push({
        senderId,
        recipientId,
        message,
        type,
        timestamp
    });
}

// Get messages
function getMessages(userId1, userId2) {
    return database.ref('messages')
        .orderByChild('timestamp')
        .on('value', (snapshot) => {
            const messages = [];
            snapshot.forEach((child) => {
                const message = child.val();
                if ((message.senderId === userId1 && message.recipientId === userId2) ||
                    (message.senderId === userId2 && message.recipientId === userId1)) {
                    messages.push({
                        ...message,
                        id: child.key
                    });
                }
            });
            return messages;
        });
}

// Update online status
function updateOnlineStatus(status) {
    if (!auth.currentUser) return;
    
    return database.ref(`users/${auth.currentUser.uid}/status`).set({
        state: status,
        last_changed: firebase.database.ServerValue.TIMESTAMP
    });
}
