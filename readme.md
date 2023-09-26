# What is this project?

This is a simple program that allows ChatGPT to interact with Pokémon Showdown and control the game.  
  
Pokémon Showdown is an online game that allows players to fight with each other using pokémon. The is game very faithful to the original Pokémon games, and works as a very accurate "battle simulator".  
  
It's perfect for this project since it runs in the browser, meaning that I could use Pupetter to get it to work.  

## How does it work?

The real brain of the operation is ChatGPT. By using the [chatgpt](https://www.npmjs.com/package/chatgpt) npm library, the program will inform the bot of everything that happens every turn, and ChatGPT will respond with an action.  
  
Every action uses one of three patterns, those are: `action:Move_Name` or `action:switch:Pokemon_Name` or `action:mega:Move_Name`.  
The program will then read those actions and react accordingly by clicking on the page, really serving as the eyes and hands of ChatGPT.  

## Running the program locally

There are a few requirements for running this project locally.  
First, you'll need NodeJS 18 or above, since the application relies on global `fetch`.  
You will also need a ChatGPT Plus account, since no models below 4 will work properly, as they're unable to properly follow the program's instructions.  
  
With that in mind, here's what you need to do:  
  
- Clone this repository and run `npm install`;  
- Create a `.env` file on root level. The file must have the following variables:  
  - `CHAT_GPT_ACCESS_TOKEN`: You OpenAI's account's access token. You can find that info by accessing `https://chat.openai.com/api/auth/session`;  
  - `OPENAI_API_KEY`: Official API key - I do not recommend using the official API, but more on that later;  
  - `SHOWDONW_URL`: "https://play.pokemonshowdown.com/";  
  - `CURRENT_MODEL`: I recommend using "gpt-4", feel free to try out other models, but from what I've seen, no model besides 4 can handle it;  
  - `PROXY_URL`: ChatGPT proxy URL, for bypassing Cloudflare. I used "https://ai.fakeopen.com/api/conversation";  
  - `BROWSER_WIDTH`: Numeric value for the browser width, I used 1360;  
  - `BROWSER_HEIGHT`: Numeric value for the browser height, I used 1050;  
  - `START_PROMPT`: The first prompt we'll send, it should have all the game rules as well as team information. More on that later;  
  - `LEAD_PROMPT`: The prompt that tells ChatGPT to select its lead pokémon;  
  - `SWITCH_PROMPT`: The prompt that tells ChatGPT to switch pokémon;  
  - `RETRY_PROMPT`: A prompt sent if ChatGPT says something wrong (usually too late by this point);  
  
  
And there are three start commands to have in mind:  

- `npm start`: This will start the program and use the official ChatGPT API;  
- `npm run start:unofficial`: This starts the program and uses and creates an actual conversation with ChatGPT. This is handled by the `chatgpt` npm library, and is the best option;  
- `npm run start:teambuilder`: This will open the browser and allow you to log in and paste your team into the teambuilder. You have 30 seconds to do so, after that, the localstorage will be saved and used to "load" your session every time you start;  

## Observations and notes

I'd say ChatGPT plays decently, but it still lost most of the battles it fought.  
Any model lower than 4 is completely unable to follow the instructions correctly, and will fail pretty quickly, responding something it shouldn't and crashing the program.  
  
Even model 4 will sometimes have trouble "remembering" all the instructions I gave it, that will happen when a battle goes on for too long. If the model "derails", the battle is over.  
Also, model 4 currently has a hard limit of 50 messages every three hours, meaning that you can really go for one battle at a time, or two really short ones.
  
Sometimes it will insist on doing inefficient actions, such as using earthquake on pokémon that are immune to it, or replacing a pokémon only to immediately replace it again.  
But it is clear that its actions are not random. Often, it will use priority moves, super-effective attacks, and switch just at the right time. Take a look at the `replays.txt` files if you want to see a few battles.  
  
I also uploaded a video of the bot playing (and winning) to Youtube, that really shows how it works.  
Generally, I'd say ChatGPT passes the test. Maybe one day a better model will be able to do more - even just being able to remember more information would help a lot. The prompts are very limited by that, and could be used to provide tips on what to do in different situations.  
  
## Why not use the official API?

Two reasons - first, it's crazy expensive. I put $5 in my OpenAI account, and it burned through it in just a few battles. Absolutely not worth it.  
Secondly, even the official API has rate limits, and for some reason, they are even worse than the "normal conversation" ones. A normal conversation with GPT-4 has a 50-message hard limit, but the official API has a "messages/time" rate limit, and this program is able to reach it before a single battle is over. Overall, the official API just won't cut.  

## Prompts

While ChatGPT is the brain of the operation, it will need a lot of information to play decently. I left the prompts I used in the `example-prompts.md` file.  
Feel free to play around with the prompts, but know that making the excessively large will make ChatGPT "derail" much faster. If we had a model even as smart as 4, but with a much larger "memory", a bigger and better prompt would for sure improve its gameplay. The prompts I used are the result of many modifications to strike a good balance between being short, and with enough information.  
  
I'd recommend using the official [OpenAI Tokenizer](https://platform.openai.com/tokenizer) to build your prompts.  

## That's all, folks!

Please, take a moment to connect with me on Linkedin: https://linkedin.com/in/vinicius-chab/, and have a great day!  

## License

MIT - Vinícius Chab  
