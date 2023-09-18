import { PuppeteerService } from "../puppeteer/pupeteer.service.mjs";
import puppeteer from "puppeteer";

// document.querySelector('button[data-testid=send-button]')

export class ShowdownCoordinatorService {
  puppeteerService;

  constructor() {
    console.log("### STARTING SHOWDOWN SERVICE");
    this.puppeteerService = new PuppeteerService();
  }

  async startService() {
    let browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ignoreHTTPSErrors: true,
    });
    let page = await browser.newPage();

    await page.goto("https://play.pokemonshowdown.com/");

    const isLoggedIn = await page.evaluate(() => {
      return !document.querySelector('button[name="login"]');
    });

    if (!isLoggedIn) {
      await browser.close();

      browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      page = await browser.newPage();
      await page.goto("https://play.pokemonshowdown.com/");

      await new Promise((resolve) => setTimeout(resolve, 60000));
      return browser;
    }

    return browser;
  }

  async findAGame() {}
}
