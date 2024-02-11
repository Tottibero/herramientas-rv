const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

router.get('/heavymusichq', async (req, res) => {
    const desiredMonth = req.query.month; // Ejemplo: ?month=May
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://heavymusichq.com/heavy-metal-album-release-calendar/');
    await page.waitForSelector('.post-single-content');

    // Extrae los datos
    const data = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('.thecontent p'));
        return elements.map(element => element.innerText);
    });

    await browser.close();

    // Filtrar y estructurar los datos extraídos
    const filteredAndStructuredReleases = filterAndStructureReleases(data, desiredMonth);

    // Envía los datos filtrados y estructurados al frontend
    res.json(filteredAndStructuredReleases);
});



function filterAndStructureReleases(releases, desiredMonth) {
    const currentYear = new Date().getFullYear(); // Asumimos el año actual para el filtrado
    const structuredReleases = [];
    let currentDate = null;

    // Función para determinar si una fecha está dentro del mes deseado
    const isDateInDesiredMonth = (dateString, desiredMonth, year) => {
        const date = new Date(dateString);
        const month = date.toLocaleString('en-US', { month: 'long' });
        return date.getFullYear() === year && month === desiredMonth;
    };

    // Itera sobre cada elemento del array de lanzamientos
    releases.forEach(release => {
        // Verifica si el elemento es una fecha
        if (/^\w+ \d{1,2}, \d{4}$/.test(release)) {
            // Verifica si la fecha pertenece al mes y año deseados
            if (isDateInDesiredMonth(release, desiredMonth, currentYear)) {
                currentDate = release; // Actualiza la fecha actual si es relevante
                structuredReleases.push({ date: currentDate, albums: [] }); // Añade un nuevo objeto de lanzamiento
            } else {
                currentDate = null; // Resetea la fecha actual si no es relevante
            }
        } else if (currentDate && release.trim() !== '') {
            // Si hay una fecha actual relevante y el elemento no es una fecha, procesa los álbumes
            const albums = release.split('\n').map(album => album.trim()).filter(album => album !== '');
            if (albums.length > 0 && structuredReleases.length > 0) {
                structuredReleases[structuredReleases.length - 1].albums.push(...albums);
            }
        }
    });

    return structuredReleases.filter(entry => entry.albums.length > 0);
}

module.exports = router;
