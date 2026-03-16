# Team Collab 🚀

A full-stack **Team Collaboration Platform** built with the **MERN Stack**, real-time messaging, role-based access control, and a Kanban task management system.

This application allows teams to **create projects, manage tasks visually, communicate in real-time, and collaborate efficiently.**

---

# 🔥 Features

## Authentication

- Firebase Authentication (Signup / Login)
- Secure user identity
- Profile name auto sync

## Role Based Access

- **Admin**
  - Manage teams
  - Create / Update / Delete projects
  - Manage tasks

- **Manager**
  - Create projects
  - Assign tasks
  - Update tasks

- **Member**
  - View projects
  - Update task status

## Project Management

- Create projects
- Update project details
- Delete projects (Admin only)
- Project based task view

## Kanban Task Board

Drag and drop tasks across columns:

- Todo
- In Progress
- Done

Built using **React Beautiful DnD**.

## Task Features

- Create tasks
- Assign team members
- Update title
- Update description
- Update status
- Delete tasks

## Real Time Team Chat

- Socket.IO based messaging
- Team specific chat rooms
- Real time message updates

## AI Assistant

Integrated AI endpoint to assist users with productivity.

---

# 🛠 Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- React Beautiful DnD

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- Firebase Admin

### Authentication

- Firebase Auth

### Database

- MongoDB Atlas

---

# 📂 Project Structure

```
team-collab
│
├── client
│   ├── src
│   ├── components
│   ├── pages
│   ├── services
│   └── firebase
│
├── server
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   ├── config
│   └── server.js
```

---

# ⚙️ Environment Variables

## Server (.env)

```
PORT=5000

MONGO_URI=your_mongodb_connection

FRONTEND_URL=http://localhost:5173
```

## Client (.env)

```
VITE_API_URL=http://localhost:5000

VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

# 🚀 Installation

## Clone Repository

```
git clone https://github.com/yourusername/team-collab.git
```

---

## Backend Setup

```
cd server
npm install
npm run dev
```

---

## Frontend Setup

```
cd client
npm install
npm run dev
```

---

# 🌐 Deployment

## Backend

Deploy on **Render**

## Frontend

Deploy on **Netlify**

---

# 📸 Screens

- Dashboard
- Kanban Board
- Project Management
- Team Chat

---

# 🎯 Learning Outcomes

This project demonstrates:

- Full MERN stack architecture
- Real time applications with Socket.IO
- Role based authorization
- REST API design
- Drag and drop UI
- Authentication integration

---

# 👨‍💻 Author

**Vishal Malviya**

MERN Stack Developer
