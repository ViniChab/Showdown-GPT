import { BattleService } from "../battle/battle.service.mjs";
import { PuppeteerService } from "../puppeteer/pupeteer.service.mjs";
import puppeteer from "puppeteer";

export class ShowdownCoordinatorService {
  puppeteerService;
  battleService;

  constructor() {
    this.puppeteerService = new PuppeteerService();
    this.battleService = new BattleService();
  }

  async startService(isTeamBuilder, isVersus, chatGptCoordinator) {
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
    page.goto("https://play.pokemonshowdown.com/");
    await page.waitForTimeout(5000);
    await this.puppeteerService.restoreSession(page, "sessionData.json");
    page.reload();
    await page.waitForTimeout(5000);

    if (isTeamBuilder) {
      console.log("### YOU HAVE 30 SECONDS TO SET UP YOUR TEAM");

      await page.waitForTimeout(30000);
      await this.puppeteerService.saveSession(page, "sessionData.json");
      console.log("### SESSION STORED!");
      process.exit(0);
    }

    if (isVersus) {
      await this.waitForBattle(page);
      console.log("### BATTLE STARTED");
      this.battleService.startBattle(page, chatGptCoordinator);
    }

    const isLoggedIn = await page.evaluate(
      () => !document.querySelector('button[name="login"]')
    );

    if (!isLoggedIn) {
      throw new Error("Not logged in, please run 'start:teambuilder'");
    }

    return browser;
  }

  async waitForBattle(page) {
    console.log("### WAITING FOR BATTLE");
    await page.waitForSelector(".innerbattle", { timeout: 60000 });
    return true;
  }
}
