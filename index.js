import dotenv from "dotenv";
import express from "express";
dotenv.config();

import { PuppeteerService } from "./services/puppeteer/pupeteer.service.mjs";
import { BrowserHandler } from "./services/browser-handler/browser-handler.service.mjs";
import { ChatGptService } from "./services/chat-gpt/chat-gpt.service.mjs";
import { ShowdownService } from "./services/showdown/showdown.service.mjs";

const port = process?.env?.PORT || 5100;
const app = express();

app.listen(port, () => {
  console.log(`### API STARTED ON PORT ${port}`);
  main();
});

async function main() {
  const args = process.argv.slice(2);
  const isTeamBuilder = args.includes("--teambuilder");
  const isVersus = args.includes("--versus");
  const isUnnoficial = args.includes("--unnoficial");
  const chatGptCoordinator = new ChatGptService();

  console.log("### ARGS", args);

  console.log("### STARTING PUPPETEER");
  await new PuppeteerService().waitForBrowser(new BrowserHandler());

  if (!isTeamBuilder) {
    await startChatGpt(chatGptCoordinator, isUnnoficial);
  }

  await new ShowdownService().startService(isTeamBuilder, isVersus, chatGptCoordinator);
}

async function startChatGpt(chatGptCoordinator, isUnnoficial) {
  const hasStarted = await chatGptCoordinator.startService(isUnnoficial);

  if (!hasStarted) {
    throw new Error("Chat GPT service failed to start");
  }

  return true;
}
