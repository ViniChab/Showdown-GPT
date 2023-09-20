import { ChatGPTUnofficialProxyAPI, ChatGPTAPI } from "chatgpt";
import { oraPromise } from "ora";

export class ChatGptService {
  currentConversationId;
  parentMessageId;
  api;

  async startService(unnofical = false) {
    if (unnofical) {
      this.api = new ChatGPTUnofficialProxyAPI({
        accessToken: process.env.CHAT_GPT_ACCESS_TOKEN,
        apiReverseProxyUrl: "https://ai.fakeopen.com/api/conversation",
        model: "gpt-4",
      });
    } else {
      this.api = new ChatGPTAPI({
        apiKey: process.env.OPENAI_API_KEY,
        completionParams: {
          model: "gpt-4",
          temperature: 0.3,
          top_p: 0.3,
        },
      });
    }

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
        text: "Waiting for response",
      }
    );
    this.parentMessageId = res.id;
    console.log("\n### REPONSE:\n", res.text.trim());

    return res.text;
  }
}
