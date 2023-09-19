export class BattleService {
  currentTurn = 0;
  currentLog = "";

  async startBattle(page, chatGptCoordinator) {
    await page.waitForTimeout(5000);

    await this.selectLead(page, chatGptCoordinator);
    this.startBattleLoop(page, chatGptCoordinator);
  }

  async selectLead(page, chatGptCoordinator) {
    this.currentLog = await page.evaluate(() => {
      return document.querySelector(".inner.message-log").innerText;
    });

    const res = await chatGptCoordinator.sendPrompt(
      `${process.env.LEAD_PROMPT}
      ${this.currentLog}`
    );

    await page.evaluate((res) => {
      const button = document.evaluate(
        `//button[text()="${res}"]`,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      button.click();
    }, res);

    return true;
  }

  async startBattleLoop(page, chatGptCoordinator) {
    await this.waitForTurn(page, ++this.currentTurn);
    await this.selectMove(page, chatGptCoordinator);
    return this.startBattleLoop(page, chatGptCoordinator);
  }

  async waitForTurn(page, turn) {
    await page.waitForXPath(`//h2[text()="Turn ${turn}"]`);
    return true;
  }

  async selectMove(page, chatGptCoordinator) {
    const newLog = await this.getNewLog(page);
    let res = await chatGptCoordinator.sendPrompt(newLog);
    // remove first line of the response
    res = res.split("\n").slice(1).join("\n");
    await this.doAction(page, res);
    return;
  }

  async getNewLog(page) {
    const newLog = await page.evaluate(() => {
      return document.querySelector(".inner.message-log").innerText;
    });

    const log = newLog.replace(this.currentLog, "");
    this.currentLog = newLog;

    return log;
  }

  async doAction(page, action) {
    console.log("### ACTION", action);
    const isSwitch = action.includes("action:switch:");

    if (isSwitch) {
      const newPokemon = action.split(":")[2];
      console.log("### SWITCHING TO", newPokemon);

      await page.evaluate((newPokemon) => {
        const button = document.evaluate(
          `//button[text()="${newPokemon}"]`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        button.click();
      }, newPokemon);
    } else {
      const move = action.split(":")[1];
      console.log("### USE MOVE", move);

      await page.evaluate((move) => {
        const button = document.evaluate(
          `//button[text()="${move}"]`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        button.click();
      }, move);
    }
  }

  async listenForPokemonSwitch(page) {
    await page.waitForFunction(() => !document.querySelector(".movecontrols"));
  }
}
