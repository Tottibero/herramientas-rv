const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// Importa las rutas
const heavymusichqRoute = require('./routes/heavymusichq');
const boolintunesRoute = require('./routes/boolintunes');
const lambgoat = require('./routes/lambgoat');
const metalstorm = require('./routes/metalstorm');

// Utiliza las rutas en la aplicación
app.use(heavymusichqRoute);
app.use(boolintunesRoute);
app.use(lambgoat);
app.use(metalstorm);

// Sirve los archivos estáticos después de configurar las rutas de la API
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
console.log(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
// Captura todas las demás rutas y sirve el index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

const port = 3000;

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
