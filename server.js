require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT; 
const connectDB = require('./config/database');


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    session({
        secret: 'test1',
        resave: false,
        saveUninitialized: false
    })
);

connectDB();

// Routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/register.html'));
});


app.use((req, res) => {
    res.status(404).send('<h1>404 Not Found</h1>');
});

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API Bridge-IT fonctionne!' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
