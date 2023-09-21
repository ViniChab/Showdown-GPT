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

    let browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1366,768"],
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1366,
        height: 768,
      },
    });

    const page = await browser.newPage();
    page.goto(process.env.SHOWDONW_URL, { timeout: 0 });
    await page.waitForTimeout(5000);
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

  async waitForBattle(page) {
    console.log("### WAITING FOR BATTLE");
    await this.puppeteerService.waitForSelectorIndefinitely(page, ".innerbattle");
    return true;
  }
}
