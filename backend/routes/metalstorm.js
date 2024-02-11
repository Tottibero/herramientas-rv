const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

router.get('/api/metalstorm', async (req, res) => {
    const desiredMonth = req.query.month; // Ejemplo: "April"
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://metalstorm.net/events/new_releases.php?upcoming=1');
    await page.waitForSelector('.cbox');

    const data = await page.evaluate(() => {
        const rows = document.querySelectorAll('.table tbody tr');
        let albums = [];
        rows.forEach(row => {
            const date = row.querySelector('td.dark').innerText.trim(); // "DD.MM"
            const albumInfo = row.querySelector('td:not(.dark) a');
            if (albumInfo) {
                const albumDetail = albumInfo.innerText.trim();
                const albumLink = albumInfo.getAttribute('href');
                albums.push({ date, album: albumDetail });
            }
        });
        return albums;
    });

    // Convertir DD.MM a "Month DD, YYYY"
    function convertDate(dateString) {
        const [day, month] = dateString.split('.');
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, 2024`;
    }

    // Agrupar álbumes por fecha
    let groupedAlbums = {};
    data.forEach(({ date, album, link }) => {
        const formattedDate = convertDate(date);
        if (!groupedAlbums[formattedDate]) {
            groupedAlbums[formattedDate] = [];
        }
        groupedAlbums[formattedDate].push(`${album}`);
    });

    // Filtrar por el mes deseado, si se proporcionó
    let result = Object.keys(groupedAlbums)
        .filter(date => desiredMonth ? date.includes(desiredMonth) : true)
        .map(date => ({
            date,
            albums: groupedAlbums[date]
        }));

    await browser.close();
    res.json(result);
});

module.exports = router;
