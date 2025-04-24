
Built by https://www.blackbox.ai

---

```markdown
# Chat Application

## Project Overview
This is a chat application built with HTML, CSS, and JavaScript, leveraging Firebase for authentication and real-time data storage. The application supports both user registration and login, as well as real-time messaging capabilities. The user interface is designed using the Tailwind CSS framework, providing a responsive and interactive experience for users, and it is fully localized in Arabic.

## Installation

To run the application locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Set up Firebase**:
   - Visit the [Firebase Console](https://console.firebase.google.com/) and create a new project.
   - Enable authentication methods and Firestore/Database.
   - Download your `firebase-config.js` file and replace `js/firebase-config.js` with your configuration.

3. **Run the server**:
   - Make sure you have Python installed.
   - Run the server with the following command:
   ```bash
   python server.py
   ```

4. **Access the application**:
   - Open your web browser and go to `http://localhost:8000/index.html`.

## Usage

You can access the application through the following pages:
- **Login Page**: `index.html`
- **Registration Page**: `register.html`
- **Chat Page**: `chat.html`
- **Admin Dashboard**: `admin.html`

### Features
- User authentication (sign up and log in).
- Real-time chat functionality.
- Google Sign-In option for quick authentication.
- User profile display.
- Admin dashboard to manage users and view statistics.

## Dependencies
The project uses the following external libraries:

- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/)
- [Font Awesome](https://fontawesome.com/)

The following scripts are included in `index.html`, `chat.html`, `admin.html`, and `register.html`:
```html
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-database-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-storage-compat.js"></script>
```

## Project Structure
Here's the structure of the project files:

```
/
├── index.html            # Login page
├── chat.html             # Chat interface
├── admin.html            # Admin dashboard
├── register.html         # User registration page
├── server.py             # Python server script for local hosting
├── js/                   # JavaScript files
│   ├── auth.js           # Authentication logic
│   ├── chat.js           # Chat functionality
│   └── admin.js          # Admin dashboard logic
└── css/                  # Stylesheets (if any)
```

## Licensing
This project is licensed under the MIT License. See the LICENSE file for details.
```