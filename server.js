require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT; 

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
