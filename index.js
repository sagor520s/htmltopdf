const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

// JSON limit
app.use(express.json({ limit: '20mb' }));

// ==========================
// ROOT (Server check)
// ==========================
app.get('/', (req, res) => {
  res.send('Server OK 🚀');
});

// ==========================
// GET → URL to PDF
// ==========================
app.get('/pdf', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send('URL missing');
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="file.pdf"',
    });

    res.send(pdf);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating PDF');
  } finally {
    if (browser) await browser.close();
  }
});

// ==========================
// POST → HTML to PDF
// ==========================
app.post('/pdf', async (req, res) => {
  const html = req.body.html;

  if (!html) {
    return res.status(400).send('HTML missing');
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="file.pdf"',
    });

    res.send(pdf);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating PDF');
  } finally {
    if (browser) await browser.close();
  }
});

// ==========================
// SERVER START
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
