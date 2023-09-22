import { BattleService } from "../battle/battle.service.mjs";
import puppeteer from "puppeteer";

export class ShowdownService {
  puppeteerService;
  battleService;
  chatGptService;

  constructor(chatGptService, puppeteerService) {
    this.chatGptService = chatGptService;
    this.puppeteerService = puppeteerService;
    this.battleService = new BattleService(puppeteerService, chatGptService);
  }

  async startService(isTeamBuilder) {
    console.log("### STARTING SHOWDOWN SERVICE");

    const browser = await this.openBrowser();
    const page = await browser.newPage();
    page.goto(process.env.SHOWDONW_URL, { timeout: 0 });

    await page.waitForTimeout(5000); // Timeout is better than waiting for page load, because sometimes showdown simply won't finish loading

    await this.puppeteerService.restoreSession(page, "sessionData.json");
    page.reload({ timeout: 0 });
    console.log("### SESSION LOADED");

    await page.waitForTimeout(5000);

    if (isTeamBuilder) {
      console.log("### YOU HAVE 30 SECONDS TO SET UP YOUR TEAM");

      await page.waitForTimeout(30000);
      await this.puppeteerService.saveSession(page, "sessionData.json");

      console.log("### SESSION STORED!");
      process.exit(0);
    }

    const isLoggedIn = await page.evaluate(() => !document.querySelector('button[name="login"]'));

    if (!isLoggedIn) {
      throw new Error("Not logged in, please run 'start:teambuilder'");
    }

    await this.waitForBattle(page);
    console.log("### BATTLE STARTED");
    this.battleService.startBattle(page);
  }

  async openBrowser() {
    const width = +process.env.BROWSER_WIDTH;
    const height = +process.env.BROWSER_HEIGHT;

    return await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox", `--window-size=${width},${height}`],
      ignoreHTTPSErrors: true,
      defaultViewport: { width, height },
    });
  }

  async waitForBattle(page) {
    console.log("### WAITING FOR BATTLE");
    await this.puppeteerService.waitForSelectorIndefinitely(page, ".innerbattle");
    return true;
  }
}
