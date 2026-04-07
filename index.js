const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

// HTML receive করার জন্য
app.use(express.json({ limit: '10mb' }));

// ==========================
// GET → URL থেকে PDF
// ==========================
app.get('/pdf', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.send('URL missing');
  }

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
    });

    res.send(pdf);

  } catch (err) {
    res.status(500).send('Error generating PDF');
  }
});

// ==========================
// POST → HTML থেকে PDF (BEST)
// ==========================
app.post('/pdf', async (req, res) => {
  const html = req.body.html;

  if (!html) {
    return res.send('HTML missing');
  }

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
    });

    res.send(pdf);

  } catch (err) {
    res.status(500).send('Error generating PDF');
  }
});

app.listen(3000, () => {
  console.log('Server running...');
});
