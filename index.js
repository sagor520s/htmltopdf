const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.use(express.json({ limit: '25mb' }));

// ==========================
// ROOT
// ==========================
app.get('/', (req, res) => {
  res.send('Server OK 🚀');
});

// ==========================
// Launch Browser
// ==========================
async function launchBrowser() {
  return await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
  });
}

// ==========================
// GET → URL to PDF
// ==========================
app.get('/pdf', async (req, res) => {
  const url = req.query.url;

  if (!url) return res.status(400).send('URL missing');

  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // ⏳ wait for full render
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="file.pdf"',
    });

    res.send(pdf);

  } catch (err) {
    console.error('GET ERROR:', err);
    res.status(500).send('Error generating PDF');
  } finally {
    if (browser) await browser.close();
  }
});

// ==========================
// POST → HTML to PDF (MAIN)
// ==========================
app.post('/pdf', async (req, res) => {
  let html = req.body.html;

  if (!html) return res.status(400).send('HTML missing');

  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    // 👉 ensure full HTML structure
    if (!html.includes('<html')) {
      html = `
      <!DOCTYPE html>
      <html>
      <head>
      <meta charset="UTF-8">
      </head>
      <body>
      ${html}
      </body>
      </html>
      `;
    }

    await page.setContent(html);

    // ⏳ VERY IMPORTANT (fix empty PDF)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="file.pdf"',
    });

    res.send(pdf);

  } catch (err) {
    console.error('POST ERROR:', err);
    res.status(500).send('Error generating PDF');
  } finally {
    if (browser) await browser.close();
  }
});

// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
