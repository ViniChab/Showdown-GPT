import { ChatGPTUnofficialProxyAPI } from "chatgpt";
import { oraPromise } from "ora";

export class ChatGptCoordinatorService {
  currentConversationId;
  parentMessageId;
  puppeteerService;
  api;

  async startService() {
    this.api = new ChatGPTUnofficialProxyAPI({
      accessToken: process.env.CHAT_GPT_ACCESS_TOKEN,
      apiReverseProxyUrl: "https://ai.fakeopen.com/api/conversation",
      model: "gpt-4",
    });

    const prompt = process.env.START_PROMPT;
    const res = await oraPromise(this.api.sendMessage(prompt), {
      text: "STARTING CHAT GPT SERVICE",
    });
    console.log("### REPONSE:", res.text);

    this.currentConversationId = res.conversationId;
    this.parentMessageId = res.id;

    return res.text === "OK";
  }

  async sendPrompt(prompt) {
    const res = await oraPromise(
      this.api.sendMessage(prompt, {
        conversationId: this.currentConversationId,
        parentMessageId: this.parentMessageId,
      }),
      {
        text: prompt,
      }
    );
    console.log("### REPONSE:", res.text);

    return res.text;
  }
}
