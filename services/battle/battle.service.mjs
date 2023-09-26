import { PageElements } from "../../constants/pageElements.js";

export class BattleService {
  chatGptService;
  puppeteerService;
  currentTurn = 0;
  currentLog = "";
  isBattleFinished = false;

  constructor(puppeteerService, chatGptService) {
    this.puppeteerService = puppeteerService;
    this.chatGptService = chatGptService;
  }

  async startBattle(page) {
    this.isBattleFinished = false;
    await page.waitForTimeout(3000);

    await this.selectLead(page);
    this.startBattleLoop(page);
    this.checkIfHasToSwitch(page);
    this.checkForSkipAnimations(page);
  }

  async selectLead(page) {
    let newLog = await this.getNewLog(page);

    // Removing excess of text on battle start
    newLog = newLog.split("\n").slice(13).join("\n");

    let res = await this.chatGptService.sendPrompt(
      `${process.env.LEAD_PROMPT}
      ${newLog}`
    );

    if (res.toLowerCase().includes("action:switch:")) {
      res = res.split(":")[2];
    }

    this.puppeteerService.clickOnXpathButton(page, res);
  }

  // Main battle function, runs every turn
  async startBattleLoop(page) {
    await this.waitForTurn(page, ++this.currentTurn);
    await this.selectAction(page);
    await page.waitForTimeout(3000);

    this.isBattleFinished = await this.checkForGameFinished(page);

    if (this.isBattleFinished) {
      return this.finishGame(page);
    }

    return this.startBattleLoop(page);
  }

  async waitForTurn(page, turn) {
    await this.puppeteerService.waitForXPathIndefinitely(page, PageElements.currentTurn.replace("#", turn));
  }

  async selectAction(page) {
    const newLog = await this.getNewLog(page);
    const availableMoves = await this.getAvailableMoves(page);
    const action = await this.chatGptService.sendPrompt(
      `${newLog}

      available moves: ${availableMoves}`
    );
    await this.doAction(page, action);
  }

  async getNewLog(page) {
    const newLog = await page.evaluate(
      (PageElements) => document.querySelector(PageElements.battleLog).innerText,
      PageElements
    );

    const log = newLog.replace(this.currentLog, "");
    this.currentLog = newLog;

    return this.getCleanLog(log);
  }

  async doAction(page, action) {
    if (!action.toLowerCase().includes("action:")) {
      action = await this.retryAction();
    }

    const isSwitch = action.toLowerCase().includes("action:switch:");
    const isMega = action.toLowerCase().includes("action:mega");

    await page.waitForTimeout(1000);

    if (isSwitch) {
      const newPokemon = action.split(":")[2];
      this.puppeteerService.clickOnXpathButton(page, newPokemon);
      return;
    }

    if (isMega) {
      await page.evaluate((PageElements) => document.querySelector(PageElements.megaEvolve).click(), PageElements);
    }

    const move = isMega ? action.split(":")[2] : action.split(":")[1];
    this.puppeteerService.clickOnXpathButton(page, move);
  }

  async retryAction() {
    console.log("\n### INVALID ACTION, RETRYING");
    let action = await this.chatGptService.sendPrompt(process.env.RETRY_PROMPT);

    if (!action.toLowerCase().includes("action:")) {
      throw new Error("Chat GPT failed to return a valid action");
    }

    return action;
  }

  async checkForPokemonSwitch(page) {
    const timeout = 5000;

    try {
      // If none of these exist, it means the player has to switch pokemon
      await Promise.race([
        page.waitForSelector(PageElements.moveControls, { timeout }),
        page.waitForSelector(PageElements.pokemonHealth, { timeout }),
        page.waitForSelector(PageElements.undoButton, { timeout }),
        page.waitForXPath(PageElements.waitingForOpponent, { timeout }),
      ]);

      return false;
    } catch (err) {
      return true;
    }
  }

  async checkForGameFinished(page) {
    const instantReplay = await page.evaluate(
      (PageElements) => document.querySelector(PageElements.instantReplay),
      PageElements
    );

    return !!instantReplay;
  }

  async finishGame(page) {
    try {
      const textarea = await page.evaluate(
        (PageElements) => Array.from(document.querySelectorAll(PageElements.chatInput))[1],
        PageElements
      );

      if (textarea) {
        await textarea.type("GG");
        await textarea.press("Enter");
      }
    } catch {}

    try {
      await this.puppeteerService.waitForSelectorIndefinitely(page, PageElements.saveReplay);
      await page.evaluate((PageElements) => document.querySelector(PageElements.saveReplay).click(), PageElements);

      await page.waitForTimeout(10000);
      const replayLink = await page.evaluate(
        (PageElements) => document.querySelector(PageElements.replayLink).innerHTML,
        PageElements
      );

      await this.puppeteerService.saveReplay(replayLink);

      const popupClose = await this.puppeteerService.waitForSelectorIndefinitely(page, PageElements.popupClose);
      await popupClose.click();
    } catch {}

    await page.evaluate((PageElements) => document.querySelector(PageElements.closeBattle).click(), PageElements);
    console.log("\n### GAME FINISHED! PROGRAM WILL EXIT IN 10 SECONDS");

    await page.waitForTimeout(10000);
    process.exit(0);
  }

  async checkIfHasToSwitch(page) {
    while (!this.isBattleFinished) {
      try {
        const hasToSwitch = await this.checkForPokemonSwitch(page);

        if (hasToSwitch) {
          await this.switchPokemon(page);
        }
      } catch {
        await this.switchPokemon(page);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  async switchPokemon(page) {
    const newLog = await this.getNewLog(page);
    console.log("\n### HAS TO SWITCH");

    let res = await this.chatGptService.sendPrompt(
      `${process.env.SWITCH_PROMPT}
      ${newLog}`
    );

    if (res.toLowerCase().includes("action:switch:")) {
      res = res.split(":")[2];
    }

    console.log("\n### SWITCH TO", res);
    await this.puppeteerService.clickOnXpathButton(page, res);
  }

  async checkForSkipAnimations(page) {
    try {
      await this.puppeteerService.waitForSelectorIndefinitely(page, PageElements.skipTurn);
      await page.evaluate((PageElements) => document.querySelector(PageElements.skipTurn).click(), PageElements);
    } catch {
      await page.waitForTimeout(500);
      this.checkForSkipAnimations(page);
    }

    await page.waitForTimeout(2000);
    this.checkForSkipAnimations(page);
  }

  async getAvailableMoves(page) {
    const moves = await page.evaluate(
      (PageElements) =>
        Array.from(document.querySelectorAll(PageElements.availableMoves)).map((button) => button?.innerText),
      PageElements
    );

    return moves
      .map((move) => move.split("\n")[0])
      .toString()
      .replace(/,/g, ", ");
  }

  getCleanLog(text) {
    text = text.replace(/^\s*[\r\n]/gm, "");
    text = text.replace(/!/g, "");
    text = text.replace(/it's/gi, "its");
    text = text.toLowerCase();

    return text;
  }
}
