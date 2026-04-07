const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');

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
      '--single-process'
    ],
  });
}

// ==========================
// GET → URL to PDF (FIXED)
// ==========================
app.get('/pdf', async (req, res) => {
  const url = req.query.url;

  if (!url) return res.status(400).send('URL missing');

  let browser;

  try {
    console.log("Fetching URL:", url);

    // 🔥 STEP 1: fetch HTML
    const response = await axios.get(url, {
      responseType: 'text',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    let html = response.data;

    console.log("HTML length:", html.length);

    if (!html || html.length < 50) {
      throw new Error("HTML empty or too small");
    }

    browser = await launchBrowser();
    const page = await browser.newPage();

    // 👉 ensure valid HTML
    if (!html.includes('<html')) {
      html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body>${html}</body>
      </html>
      `;
    }

    // 🔥 STEP 2: render
    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 60000,
    });

    // ⏳ wait render
    await page.waitForTimeout(3000);

    // 🔥 STEP 3: generate PDF
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
    console.error("GET ERROR FULL:", err);
    res.status(500).send('Error generating PDF');
  } finally {
    if (browser) await browser.close();
  }
});

// ==========================
// POST → HTML to PDF (BEST)
// ==========================
app.post('/pdf', async (req, res) => {
  let html = req.body.html;

  if (!html) return res.status(400).send('HTML missing');

  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    // 👉 ensure valid HTML
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

    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 60000,
    });

    // ⏳ wait render
    await page.waitForTimeout(2000);

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
    console.error("POST ERROR FULL:", err);
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
