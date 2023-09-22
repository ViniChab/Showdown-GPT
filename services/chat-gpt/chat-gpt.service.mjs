import { ChatGPTUnofficialProxyAPI, ChatGPTAPI } from "chatgpt";
import { oraPromise } from "ora";

export class ChatGptService {
  currentConversationId;
  parentMessageId;
  api;

  async startService(isUnnoficial = false) {
    if (isUnnoficial) {
      this.api = new ChatGPTUnofficialProxyAPI({
        accessToken: process.env.CHAT_GPT_ACCESS_TOKEN,
        apiReverseProxyUrl: process.env.PROXY_URL,
        model: process.env.CURRENT_MODEL,
      });
    } else {
      this.api = new ChatGPTAPI({
        apiKey: process.env.OPENAI_API_KEY,
        completionParams: {
          model: process.env.CURRENT_MODEL,
          temperature: 0.3,
          top_p: 0.3,
        },
      });
    }

    const prompt = process.env.START_PROMPT;
    const res = await oraPromise(this.api.sendMessage(prompt), {
      text: "STARTING CHATGPT SERVICE",
    });
    console.log("### REPONSE:", res.text);

    this.currentConversationId = res.conversationId;
    this.parentMessageId = res.id;

    return res.text === "OK";
  }

  async sendPrompt(prompt) {
    console.log("\n");

    const res = await oraPromise(
      this.api.sendMessage(prompt, {
        conversationId: this.currentConversationId,
        parentMessageId: this.parentMessageId,
      }),
      {
        text: "Waiting for ChatGPT",
      }
    );
    this.parentMessageId = res.id;
    console.log("### REPONSE:", res.text.trim());

    return res.text;
  }
}
