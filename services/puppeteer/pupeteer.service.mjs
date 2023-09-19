import fs from "fs";

export class PuppeteerService {
  waitForBrowser(browserHandler) {
    if (!browserHandler) {
      throw new Error("browserHandler is not defined");
    }

    return new Promise((resolve, reject) => {
      const browserCheck = setInterval(() => {
        if (browserHandler.browser !== false) {
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
    const sessionData = JSON.parse(fs.readFileSync(filePath, "utf8"));

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
}
