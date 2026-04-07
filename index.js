const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("Puppeteer PDF API Running...");
});

app.post("/pdf", async (req, res) => {
  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).send("HTML required");
    }

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdf.length,
    });

    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
