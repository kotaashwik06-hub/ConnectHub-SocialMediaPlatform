# ConnectHub – Social Media Platform

## About the Project

ConnectHub is a full-stack social media web application that allows users to connect with others, share posts, upload profile pictures, like and comment on posts, and manage their profiles.

The project is developed as part of an internship project.

## Features

- User Registration and Login
- Secure Password Hashing
- JWT Authentication
- Create, Edit and Delete Posts
- Upload Images with Posts
- Like and Unlike Posts
- Comment on Posts
- Search Posts
- Search Users
- User Profiles
- Upload and Update Profile Pictures
- Update Profile Bio
- Follow and Unfollow Users
- Notifications for Likes, Comments and Follows
- Mark Notifications as Read
- Responsive User Interface

## Technologies Used

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- Bcrypt.js

**Tools**
- Visual Studio Code
- Git and GitHub
- MongoDB Atlas

## Project Structure

```text
ConnectHub-SocialMediaPlatform/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── profile.html
│   ├── notifications.html
│   ├── style.css
│   ├── script.js
│   ├── profile.js
│   └── notifications.js
│
└── .gitignore
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kotaashwik06-hub/ConnectHub-SocialMediaPlatform.git
```

### 2. Open the Project

```bash
cd ConnectHub-SocialMediaPlatform
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the backend folder.

Add your own configuration:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_private_jwt_secret
```

### 5. Start the Backend

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:5001
```

### 6. Run the Frontend

Open the `frontend/index.html` file using the VS Code Live Server extension.

## Database

ConnectHub uses MongoDB Atlas to store user accounts, posts, comments, likes, follows and notifications.

## Developer

**Project Name:** ConnectHub – Social Media Platform

**GitHub Repository:**

https://github.com/kotaashwik06-hub/ConnectHub-SocialMediaPlatform

---

## Future Enhancements

- Real-time messaging
- Real-time notifications
- Forgot Password functionality
- Improved user experience and interface
