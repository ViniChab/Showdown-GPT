import puppeteer from "puppeteer";
import dotenv from "dotenv";
dotenv.config();

import { PuppeteerService } from "./services/puppeteer/pupeteer.service.mjs";
import { ChatGptService } from "./services/chat-gpt/chat-gpt.service.mjs";
import { ShowdownService } from "./services/showdown/showdown.service.mjs";

const chatGptService = new ChatGptService();
const puppeteerService = new PuppeteerService();
const showdownService = new ShowdownService(chatGptService, puppeteerService);

const args = process.argv.slice(2);
const isTeamBuilder = args.includes("--teambuilder");
const isUnnoficial = args.includes("--unnoficial");

console.log("### ARGS", args);
console.log("### STARTING PUPPETEER");
await puppeteer.launch();

if (!isTeamBuilder) {
  // await startChatGpt(isUnnoficial);
}

await showdownService.startService(isTeamBuilder);

async function startChatGpt(isUnnoficial) {
  const hasStarted = await chatGptService.startService(isUnnoficial);

  if (!hasStarted) {
    throw new Error("Chat GPT service failed to start");
  }

  return true;
}
