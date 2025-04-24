// Handle login form submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        signInWithEmail(email, password)
            .then((userCredential) => {
                // Update user status to online
                return database.ref(`users/${userCredential.user.uid}`).update({
                    status: {
                        state: 'online',
                        lastChanged: firebase.database.ServerValue.TIMESTAMP
                    },
                    lastLogin: firebase.database.ServerValue.TIMESTAMP
                });
            })
            .then(() => {
                window.location.href = 'chat.html';
            })
            .catch((error) => {
                console.error('Login Error:', error);
                alert('خطأ في تسجيل الدخول: ' + error.message);
            });
    });
}

// Handle registration form submission
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const displayName = document.getElementById('display-name').value;
        const avatarFile = document.getElementById('avatar').files[0];
        
        if (password !== confirmPassword) {
            alert('كلمات المرور غير متطابقة');
            return;
        }
        
        try {
            // Create user account
            const userCredential = await createUser(email, password);
            const user = userCredential.user;
            
            let photoURL = null;
            
            // Upload avatar if provided
            if (avatarFile) {
                const storageRef = storage.ref(`avatars/${user.uid}/${avatarFile.name}`);
                await storageRef.put(avatarFile);
                photoURL = await storageRef.getDownloadURL();
            }
            
            // Update profile
            await updateProfile(displayName, photoURL);
            
            // Add user data to database
            await database.ref(`users/${user.uid}`).set({
                email: email,
                displayName: displayName,
                photoURL: photoURL,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                status: {
                    state: 'online',
                    lastChanged: firebase.database.ServerValue.TIMESTAMP
                }
            });
            
            // Redirect to chat
            window.location.href = 'chat.html';
        } catch (error) {
            console.error('Registration Error:', error);
            alert('حدث خطأ أثناء التسجيل: ' + error.message);
        }
    });
}

// Handle Google Sign In
const googleSignInBtn = document.getElementById('google-signin');
if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', () => {
        signInWithGoogle()
            .then((result) => {
                const user = result.user;
                // Update or create user data
                return database.ref(`users/${user.uid}`).update({
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    status: {
                        state: 'online',
                        lastChanged: firebase.database.ServerValue.TIMESTAMP
                    },
                    lastLogin: firebase.database.ServerValue.TIMESTAMP
                });
            })
            .then(() => {
                window.location.href = 'chat.html';
            })
            .catch((error) => {
                console.error('Google Sign In Error:', error);
                alert('خطأ في تسجيل الدخول باستخدام Google: ' + error.message);
            });
    });
}

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.uid);
        if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
            window.location.href = 'chat.html';
        }
    } else {
        // User is signed out
        console.log('User is signed out');
        if (window.location.pathname === '/chat.html') {
            window.location.href = 'index.html';
        }
    }
});

// Language Toggle
const langToggle = document.getElementById('lang-toggle');
if (langToggle) {
    langToggle.addEventListener('click', () => {
        const html = document.documentElement;
        const isArabic = html.lang === 'ar';
        html.lang = isArabic ? 'en' : 'ar';
        html.dir = isArabic ? 'ltr' : 'rtl';
        langToggle.innerHTML = isArabic ? 
            '<i class="fas fa-language"></i> عربي' : 
            '<i class="fas fa-language"></i> English';
    });
}

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
}

// Set up presence system
auth.onAuthStateChanged((user) => {
    if (user) {
        // Create a reference to the user's status
        const userStatusRef = database.ref(`users/${user.uid}/status`);
        
        // Create a reference to the special '.info/connected' path
        const connectedRef = database.ref('.info/connected');
        
        connectedRef.on('value', (snap) => {
            if (snap.val() === true) {
                // If we lose network then remove all callbacks
                userStatusRef.onDisconnect().update({
                    state: 'offline',
                    lastChanged: firebase.database.ServerValue.TIMESTAMP
                });
                
                // Set the user's status to online
                userStatusRef.update({
                    state: 'online',
                    lastChanged: firebase.database.ServerValue.TIMESTAMP
                });
            }
        });
    }
});
