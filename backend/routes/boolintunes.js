const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

// Define la ruta para boolintunes
router.get('/boolintunes', async (req, res) => {
    const desiredMonth = req.query.month; // Ejemplo: ?month=March
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://boolintunes.com/calendar/');
    await page.waitForSelector('.gutentor-module-accordion-body');

    const data = await page.evaluate(() => {
        const accordionBodies = document.querySelectorAll('.gutentor-module-accordion-body');
        let structuredData = [];

        accordionBodies.forEach(accordionBody => {
            const htmlContent = accordionBody.innerHTML;
            const lines = htmlContent.split('<br>').map(line => line.trim());
            let currentDate = '';

            lines.forEach(line => {
                const dateMatch = line.match(/>([^<]+)<\/span><\/strong>/);
                if (dateMatch && dateMatch[1]) {
                    // Agrega el año explícitamente y elimina los sufijos ordinales del día
                    let dateWithoutOrdinal = dateMatch[1].replace(/(\d+)(st|nd|rd|th)/, "$1");
                    currentDate = `${dateWithoutOrdinal}, 2024`;
                } else if (line.includes('<strong>') && currentDate) {
                    const albumDetail = line.replace(/<[^>]+>/g, '').trim();
                    if (albumDetail) {
                        const entryIndex = structuredData.findIndex(entry => entry.date === currentDate);
                        if (entryIndex !== -1) {
                            structuredData[entryIndex].albums.push(albumDetail);
                        } else {
                            structuredData.push({ date: currentDate, albums: [albumDetail] });
                        }
                    }
                }
            });
        });

        return structuredData;
    });

    await browser.close();

    const filteredData = data.filter(item => item.date.includes(desiredMonth));
    res.json(filteredData);
});

module.exports = router;
