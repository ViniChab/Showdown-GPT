export class BattleService {
  puppeteerService;
  currentTurn = 0;
  currentLog = "";

  constructor(puppeteerService) {
    this.puppeteerService = puppeteerService;
  }

  async startBattle(page, chatGptCoordinator) {
    await page.waitForTimeout(3000);

    await this.selectLead(page, chatGptCoordinator);
    this.startBattleLoop(page, chatGptCoordinator);
    this.checkIfHasToSwitch(page, chatGptCoordinator);
    this.checkForSkipAnimations(page);
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
    await this.selectAction(page, chatGptCoordinator);
    await page.waitForTimeout(2000);

    const gameFinished = await this.checkForGameFinished(
      page,
      chatGptCoordinator
    );

    if (gameFinished) {
      return this.finishGame(page);
    }

    return this.startBattleLoop(page, chatGptCoordinator);
  }

  async waitForTurn(page, turn) {
    await this.puppeteerService.waitForXPathIndefinitely(
      page,
      `//h2[text()="Turn ${turn}"]`
    );
  }

  async selectAction(page, chatGptCoordinator) {
    const newLog = await this.getNewLog(page);
    let res = await chatGptCoordinator.sendPrompt(newLog);
    res = res.split("\n").slice(1).join("\n");
    await this.doAction(page, res);
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
    const isSwitch = action.includes("action:switch:");

    if (isSwitch) {
      const newPokemon = action.split(":")[2];

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

  async checkForPokemonSwitch(page) {
    const timeout = 5000;

    try {
      await Promise.race([
        page.waitForSelector(".movecontrols", { timeout }),
        page.waitForSelector(".whatdo .healthy", { timeout }),
        page.waitForSelector('button[name="undoChoice"]', { timeout }),
        page.waitForXPath(`//em[text()="Waiting for opponent..."]`, {
          timeout,
        }),
      ]);

      return false;
    } catch (err) {
      return true;
    }
  }

  async checkForGameFinished(page) {
    const instantReplay = await page.evaluate(() => {
      return document.querySelector('button[name="instantReplay"]');
    });

    return !!instantReplay;
  }

  async finishGame(page) {
    try {
      const textarea = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll(".battle-log-add .chatbox textarea")
        )[1];
      });

      if (textarea) {
        await textarea.type("GG");
        await textarea.press("Enter");
      }
    } catch {}

    await page.evaluate(() => {
      document.querySelector(".closebutton").click();
    });
  }

  async checkIfHasToSwitch(page, chatGptCoordinator) {
    (async () => {
      while (true) {
        try {
          const hasToSwitch = await this.checkForPokemonSwitch(page);

          if (hasToSwitch) {
            console.log("### HAS TO SWITCH POKEMON");
            await this.switchPokemon(page, chatGptCoordinator);
          }
        } catch (error) {
          console.error("An error occurred:", error);
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    })();
  }

  async switchPokemon(page, chatGptCoordinator) {
    const newLog = await this.getNewLog(page);
    let res = await chatGptCoordinator.sendPrompt(
      `${process.env.SWITCH_PROMPT} ${newLog}`
    );

    console.log("### SWITCH TO", res);
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
  }

  async checkForSkipAnimations(page) {
    const element = await this.puppeteerService.waitForSelectorIndefinitely(
      page,
      'button[name="goToEnd"]'
    );

    await element.click();
    await page.waitForTimeout(2000);
    this.checkForSkipAnimations(page);
  }
}
