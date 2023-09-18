import dotenv from "dotenv";
import express from "express";
dotenv.config();

import { PuppeteerService } from "./services/puppeteer/pupeteer.service.mjs";
import { BrowserHandler } from "./services/browser-handler/browser-handler.service.mjs";
import { ChatGptCoordinatorService } from "./services/chat-gpt-coordinator/chat-gpt-coordinator.service.mjs";
import { ShowdownCoordinatorService } from "./services/showdown-coordinator/showdown-coordinator.service.mjs";

const port = process?.env?.PORT || 5100;
const app = express();

app.listen(port, () => {
  console.log(`### API RESTARTED ON PORT: ${port}`);
  main();
});

async function main() {
  const browserHandler = new BrowserHandler();
  const puppeteerService = new PuppeteerService();
  const showdownCoordinatorService = new ShowdownCoordinatorService();

  console.log("### WAITING FOR PUPPETEER");
  await puppeteerService.waitForBrowser(browserHandler);
  console.log("### PUPPETEER STARTED");

  startChatGpt();
  // await showdownCoordinatorService.startService();
}

async function startChatGpt() {
  const chatGptCoordinator = new ChatGptCoordinatorService();
  const hasStarted = await chatGptCoordinator.startService();

  if (!hasStarted) {
    throw new Error("Chat GPT service failed to start");
  }
}
