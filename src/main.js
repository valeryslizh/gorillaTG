import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import config from "config";
import { ogg } from "./ogg.js";
import { openAI } from "./openAi.js";

const INITIAL_SESSION = {
  messages: []
};

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

bot.command("new", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply(
    code("Новая сессия. Жду вашего голосовго или текстового сообщения")
  );
});

bot.command("start", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply(
    code("Новая сессия. Жду вашего голосовго или текстового сообщения")
  );
});

bot.on(message("voice"), async (ctx) => {
  ctx.session = ctx.session ?? INITIAL_SESSION;
  try {
    await ctx.reply(code("Жду ответ от сервера..."));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Patch = await ogg.toMp3(oggPath, userId);

    const text = await openAI.transcription(mp3Patch);
    await ctx.reply(code(`Ваш запрос: ${text}`));

    ctx.session.messages.push({ role: openAI.roles.USER, content: text });
    const response = await openAI.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openAI.roles.ASSISTANT,
      content: response.content
    });

    await ctx.reply(response.content);
  } catch (error) {
    console.log("Error while voice message", error.message);
  }
});

bot.on(message("text"), async (ctx) => {
  ctx.session = ctx.session ?? INITIAL_SESSION;
  try {
    await ctx.reply(code("Жду ответ от сервера..."));

    ctx.session.messages.push({ role: openAI.roles.USER, content: ctx.message.text });
    const response = await openAI.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openAI.roles.ASSISTANT,
      content: response.content
    });

    await ctx.reply(response.content);
  } catch (error) {
    console.log("Error while voice message", error.message);
  }
});

try {
  bot.launch();
} catch (err) {
  console.log("Ошибка при запуске бота", err.message);
}

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
