# Frontend + Backend
- The visuals and services...

## React Set up (don't do this if there is already a little villagehub folder): 
### 1. Install Node.js on your system (one-time)
### Download from nodejs.org

### 2. Create Vite project
npm create vite@latest mememail-fresh -- --template react
cd mememail-fresh

### 3. Install all npm packages (including firebase)
npm install
npm install firebase react-router-dom

### 4. Set up Firebase project online
### Go to console.firebase.google.com
### Create project, enable Auth & Firestore

### 5. Add your Firebase keys to .env file

### 6. Run your app
npm run dev