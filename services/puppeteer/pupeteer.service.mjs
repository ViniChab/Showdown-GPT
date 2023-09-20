import fs from "fs";

export class PuppeteerService {
  browserHandler;

  constructor(browserHandler) {
    this.browserHandler = browserHandler;
  }

  waitForBrowser() {
    return new Promise((resolve) => {
      const browserCheck = setInterval(() => {
        if (this.browserHandler.browser !== false) {
          clearInterval(browserCheck);
          resolve(true);
        }
      }, 200);
    });
  }

  async saveSession(page, filePath) {
    const cookies = await page.cookies();
    const cookiesString = JSON.stringify(cookies);

    const sessionStorage = await page.evaluate(() => {
      return JSON.stringify(window.sessionStorage);
    });

    const localStorage = await page.evaluate(() => {
      return JSON.stringify(window.localStorage);
    });

    fs.writeFileSync(
      filePath,
      JSON.stringify({
        cookies: cookiesString,
        sessionStorage,
        localStorage,
      })
    );
  }

  async restoreSession(page, filePath) {
    let sessionData = fs.readFileSync(filePath, "utf8");
    if (!sessionData) {
      return;
    }

    sessionData = JSON.parse(sessionData);

    const cookies = JSON.parse(sessionData.cookies);
    await page.setCookie(...cookies);

    await page.evaluate((sessionStorageData) => {
      window.sessionStorage.clear();
      const parsedData = JSON.parse(sessionStorageData);

      for (let key in parsedData) {
        window.sessionStorage.setItem(key, parsedData[key]);
      }
    }, sessionData.sessionStorage);

    await page.evaluate((localStorageData) => {
      window.localStorage.clear();
      const parsedData = JSON.parse(localStorageData);

      for (let key in parsedData) {
        window.localStorage.setItem(key, parsedData[key]);
      }
    }, sessionData.localStorage);
  }

  async waitForXPathIndefinitely(page, xpath) {
    let elementHandle = null;
    const timeout = 60000;

    while (!elementHandle) {
      try {
        elementHandle = await page.waitForXPath(xpath, { timeout });
      } catch {}
    }

    return elementHandle;
  }

  async waitForSelectorIndefinitely(page, selector) {
    let elementHandle = null;
    const timeout = 60000;

    while (!elementHandle) {
      try {
        elementHandle = await page.waitForSelector(selector, { timeout });
      } catch {}
    }

    return elementHandle;
  }

  async clickOnXpathButton(page, text) {
    let success = false;

    while (!success) {
      try {
        await page.evaluate((text) => {
          const button = document.evaluate(
            `//button[text()="${text}"]`,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;

          button.click();
        }, text);

        success = true;
      } catch {}
    }
  }
}
