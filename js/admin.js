// DOM Elements
const activeUsersCount = document.getElementById('active-users');
const messagesTodayCount = document.getElementById('messages-today');
const sharedImagesCount = document.getElementById('shared-images');
const usersTableBody = document.getElementById('users-table-body');
const testAccountForm = document.getElementById('test-account-form');
const themeToggle = document.getElementById('theme-toggle');
const logoutBtn = document.getElementById('logout-btn');

const adminCredentials = {
    email: "adminh7md@gmail.com",
    password: "AdminPass123"
};

// حساب وهمي للاختبار
const testUser = {
    uid: "test-user-uid",
    email: "testuser@example.com",
    displayName: "مستخدم تجريبي",
    photoURL: "https://via.placeholder.com/40"
};

// إضافة حساب وهمي إلى قاعدة البيانات
database.ref(`users/${testUser.uid}`).set({
    email: testUser.email,
    displayName: testUser.displayName,
    photoURL: testUser.photoURL,
    status: {
        state: "online",
        lastChanged: firebase.database.ServerValue.TIMESTAMP
    },
    createdAt: firebase.database.ServerValue.TIMESTAMP
});

// Check if user is admin
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    if (user.email === adminCredentials.email) {
        initializeAdminDashboard();
    } else {
        window.location.href = 'chat.html';
    }
});

// Initialize Dashboard
function initializeAdminDashboard() {
    loadUsers();
    updateStats();
    setupRealtimeListeners();
}

// Load Users
function loadUsers() {
    database.ref('users').on('value', (snapshot) => {
        usersTableBody.innerHTML = '';
        
        snapshot.forEach((child) => {
            const user = child.val();
            const userId = child.key;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img class="h-10 w-10 rounded-full" 
                             src="${user.photoURL || 'https://via.placeholder.com/40'}" 
                             alt="">
                        <div class="mr-4">
                            <div class="text-sm font-medium text-gray-900">
                                ${user.displayName || 'مستخدم'}
                            </div>
                            <div class="text-sm text-gray-500">
                                ${user.email}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status?.state === 'online' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                    }">
                        ${user.status?.state === 'online' ? 'متصل' : 'غير متصل'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(user.createdAt || Date.now()).toLocaleDateString('ar-SA')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    <button class="text-red-600 hover:text-red-900 delete-user" data-user-id="${userId}">
                        حذف
                    </button>
                </td>
            `;
            
            // Add delete event listener
            const deleteBtn = tr.querySelector('.delete-user');
            deleteBtn.addEventListener('click', () => deleteUser(userId));
            
            usersTableBody.appendChild(tr);
        });
    });
}

// Update Stats
function updateStats() {
    // Count active users
    database.ref('users').orderByChild('status/state').equalTo('online')
        .on('value', (snapshot) => {
            activeUsersCount.textContent = snapshot.numChildren();
        });
    
    // Count today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    database.ref('messages').orderByChild('timestamp')
        .startAt(today.getTime())
        .on('value', (snapshot) => {
            messagesTodayCount.textContent = snapshot.numChildren();
        });
    
    // Count shared images
    database.ref('messages').orderByChild('type')
        .equalTo('image')
        .on('value', (snapshot) => {
            sharedImagesCount.textContent = snapshot.numChildren();
        });
}

// Setup Realtime Listeners
function setupRealtimeListeners() {
    // Listen for new users
    database.ref('users').on('child_added', (snapshot) => {
        updateStats();
    });
    
    // Listen for user status changes
    database.ref('users').on('child_changed', (snapshot) => {
        updateStats();
    });
    
    // Listen for new messages
    database.ref('messages').on('child_added', (snapshot) => {
        updateStats();
    });
}

// Delete User
function deleteUser(userId) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        // Delete user data from database
        database.ref(`users/${userId}`).remove()
            .then(() => {
                // Delete user's messages
                return database.ref('messages').orderByChild('senderId')
                    .equalTo(userId)
                    .once('value');
            })
            .then((snapshot) => {
                const updates = {};
                snapshot.forEach((child) => {
                    updates[child.key] = null;
                });
                return database.ref('messages').update(updates);
            })
            .then(() => {
                alert('تم حذف المستخدم بنجاح');
            })
            .catch((error) => {
                console.error('Error deleting user:', error);
                alert('حدث خطأ أثناء حذف المستخدم');
            });
    }
}

// Create Test Account
testAccountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('test-email').value;
    const password = document.getElementById('test-password').value;
    
    createUser(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Add user data to database
            return database.ref(`users/${user.uid}`).set({
                email: email,
                displayName: 'حساب تجريبي',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                isTestAccount: true
            });
        })
        .then(() => {
            alert('تم إنشاء الحساب التجريبي بنجاح');
            testAccountForm.reset();
        })
        .catch((error) => {
            console.error('Error creating test account:', error);
            alert('حدث خطأ أثناء إنشاء الحساب التجريبي');
        });
});

// Theme Toggle
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

// Logout
logoutBtn.addEventListener('click', () => {
    signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Error signing out:', error);
            alert('حدث خطأ أثناء تسجيل الخروج');
        });
});
