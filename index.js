const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("Puppeteer PDF API Running...");
});

app.post("/pdf", async (req, res) => {
  let browser;

  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).send("HTML required");
    }

    // ✅ Chrome path auto detect (important)
    const executablePath = puppeteer.executablePath();

    browser = await puppeteer.launch({
      headless: "new",
      executablePath: executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process"
      ]
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdf.length,
    });

    res.send(pdf);

  } catch (err) {
    console.error("FULL ERROR:", err); // 🔥 debug
    res.status(500).send("Error generating PDF");

  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
