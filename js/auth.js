// Handle login form submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        signInWithEmail(email, password)
            .then((userCredential) => {
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
            const userCredential = await createUser(email, password);
            const user = userCredential.user;
            
            let photoURL = null;
            
            if (avatarFile) {
                const storageRef = storage.ref(`avatars/${user.uid}/${avatarFile.name}`);
                await storageRef.put(avatarFile);
                photoURL = await storageRef.getDownloadURL();
            }
            
            await updateProfile(displayName, photoURL);
            
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
            
            window.location.href = 'chat.html';
        } catch (error) {
            console.error('Registration Error:', error);
            alert('حدث خطأ أثناء التسجيل: ' + error.message);
        }
    });
}

// Password reset
const forgotPasswordLink = document.getElementById('forgot-password');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const email = prompt('يرجى إدخال بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور:');
        if (email) {
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
                })
                .catch((error) => {
                    console.error('Error sending password reset email:', error);
                    alert('حدث خطأ أثناء إرسال رابط إعادة التعيين: ' + error.message);
                });
        }
    });
}

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user.uid);
        if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
            window.location.href = 'chat.html';
        }
    } else {
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
        const userStatusRef = database.ref(`users/${user.uid}/status`);
        const connectedRef = database.ref('.info/connected');
        connectedRef.on('value', (snap) => {
            if (snap.val() === true) {
                userStatusRef.onDisconnect().update({
                    state: 'offline',
                    lastChanged: firebase.database.ServerValue.TIMESTAMP
                });
                userStatusRef.update({
                    state: 'online',
                    lastChanged: firebase.database.ServerValue.TIMESTAMP
                });
            }
        });
    }
});
