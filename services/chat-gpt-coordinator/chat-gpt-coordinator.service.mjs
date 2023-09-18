import { ChatGPTUnofficialProxyAPI } from "chatgpt";
import { oraPromise } from "ora";

// document.querySelector('button[data-testid=send-button]')

export class ChatGptCoordinatorService {
  puppeteerService;

  async startService() {
    console.log("### STARTING CHAT GPT SERVICE");

    const api = new ChatGPTUnofficialProxyAPI({
      accessToken: process.env.CHAT_GPT_ACCESS_TOKEN,
      apiReverseProxyUrl: "https://ai.fakeopen.com/api/conversation",
      model: "gpt-4",
    });

    const prompt = process.env.START_PROMPT;
    console.log("### HERE");
    const res = await oraPromise(api.sendMessage(prompt), { text: prompt });
    console.log("### REPONSE:", res.text);

    return res.text === "OK";
  }
}
