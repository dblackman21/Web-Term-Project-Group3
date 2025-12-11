require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000; //added 3000 as a fallback
const connectDB = require('./config/database');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

connectDB();

// Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");

app.use("/auth", authRoutes);
app.use("/cart", cartRoutes);
app.use("/products", productRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/register.html'));
});

app.get('.product/:id', (req, res) => {
    // David, line below is a stand in. You can put the op for DB
    //   fetch here;
    res.sendFile(path.join(__dirname, 'public/pages/product.html'));
});

app.use((req, res) => {
    res.status(404).send('<h1>404 Not Found</h1>');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API Bridge-IT working' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
