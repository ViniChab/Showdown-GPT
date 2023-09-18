import fetch from 'node-fetch';

if (typeof globalThis !== 'undefined') {
  globalThis.fetch = fetch;
}

import { PuppeteerService } from "./services/puppeteer/pupeteer.service.mjs";
import { BrowserHandler } from "./services/browser-handler/browser-handler.service.mjs";
import { ChatGptCoordinatorService } from "./services/chat-gpt-coordinator/chat-gpt-coordinator.service.mjs";
import { ShowdownCoordinatorService } from "./services/showdown-coordinator/showdown-coordinator.service.mjs";

import express from "express";
const port = process?.env?.PORT || 5100;
const app = express();

app.listen(port, () => {
  console.log(`### API RESTARTED ON PORT: ${port}`);
  main();
});

async function main() {
  const browserHandler = new BrowserHandler();
  const puppeteerService = new PuppeteerService();
  const chatGptCoordinator = new ChatGptCoordinatorService();
  const showdownCoordinatorService = new ShowdownCoordinatorService();

  console.log("### WAITING FOR PUPPETEER");
  await puppeteerService.waitForBrowser(browserHandler);
  console.log("### PUPPETEER STARTED");

  await chatGptCoordinator.startService();
  // await showdownCoordinatorService.startService();
}
