const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
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




const port = 3000;

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
