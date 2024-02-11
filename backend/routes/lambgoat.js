const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

router.get('/api/lambgoat', async (req, res) => {
    const desiredMonth = req.query.month; // Ejemplo: ?month=May
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const monthNumber = getMonthNumber(desiredMonth);
    await page.goto(`https://lambgoat.com/albums/releases?month=${monthNumber}`); // Reemplaza 'https://example.com/your-page-url' con la URL real
    await page.waitForSelector('.table');

    // Extrae los datos de la tabla
    const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.table tbody tr'));
        return rows.map(row => {
            const columns = row.querySelectorAll('td');
            return {
                date: columns[0].textContent.trim(),
                artist: columns[1].querySelector('b').textContent.trim(),
                album: columns[2].querySelector('i').textContent.trim(),
                label: columns[3].textContent.trim(),
                buyLink: columns[4].querySelector('a').href.trim()
            };
        });
    });

    await browser.close();

    // Filtra y estructura los datos extraídos
    const filteredAndStructuredReleases = filterAndStructureReleases(data, desiredMonth);

    // Envía los datos filtrados y estructurados al frontend
    res.json(filteredAndStructuredReleases);
});

function getMonthNumber(monthName) {
    // Crear una fecha con el primer día del mes y el año arbitrarios
    const date = new Date(`2022 ${monthName} 01`);
    // Obtener el número del mes (los meses son indexados desde 0)
    return date.getMonth() + 1; // Sumar 1 porque los meses se indexan desde 0
}

function filterAndStructureReleases(releases, desiredMonth) {
    const structuredReleases = releases.reduce((acc, release) => {
        // Cambiar el formato de la fecha
        const [month, day, year] = release.date.split('/');
        const formattedDate = new Date(`${year}-${month}-${day}`).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        // Verificar si el mes coincide con el mes deseado
        const releaseMonth = new Date(`${year}-${month}-${day}`).toLocaleString('en-US', { month: 'long' });
        if (releaseMonth === desiredMonth) {
            // Comprobar si ya existe una entrada para esta fecha en el acumulador
            const existingEntry = acc.find(entry => entry.date === formattedDate);
            if (existingEntry) {
                // Si existe, agregar el álbum a la lista existente
                existingEntry.albums.push(`${release.artist} – ${release.album} (${release.label})`);
            } else {
                // Si no existe, crear una nueva entrada con el álbum
                acc.push({
                    date: formattedDate,
                    albums: [`${release.artist} – ${release.album} (${release.label})`]
                });
            }
        }
        return acc;
    }, []);

    return structuredReleases;
}

module.exports = router;
