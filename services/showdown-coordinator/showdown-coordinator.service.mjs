import { PuppeteerService } from "../puppeteer/pupeteer.service.mjs";
import puppeteer from "puppeteer";

export class ShowdownCoordinatorService {
  puppeteerService;

  constructor() {
    this.puppeteerService = new PuppeteerService();
  }

  async startService(isTeamBuilder) {
    console.log("### STARTING SHOWDOWN SERVICE");

    let browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--window-size=1920,1080",
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });

    const page = await browser.newPage();
    await page.goto("https://play.pokemonshowdown.com/");
    await this.puppeteerService.restoreSession(page, "sessionData.json");
    await page.reload();

    if (isTeamBuilder) {
      console.log("### CLOSE THE BROWSER WHEN YOU'RE DONE");

      browser.on("disconnected", async () => {
        console.log("### SESSION STORED!");
        await this.puppeteerService.saveSession(page, "sessionData.json");
      });

      return;
    }

    const isLoggedIn = await page.evaluate(
      () => !document.querySelector('button[name="login"]')
    );

    if (!isLoggedIn) {
      throw new Error("Not logged in, please run 'start:teambuilder'");
    }

    return browser;
  }

  async findAGame() {}
}
