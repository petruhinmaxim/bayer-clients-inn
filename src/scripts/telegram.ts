import config from '../config/config'
import {Telegraf} from "telegraf";
import {getTexts, HelloGetInn, Scene} from "../model/texts";

async function main() {
    const telegraf = new Telegraf(config.telegram.mainToken)

    await telegraf.on('text', async (ctx) => {
        const user = ctx.from
        const text = ctx.message.text
        if (text.includes("getinn")) {
            await loadAgRegAndParseInn(telegraf, user.id)
        }
    })
    await telegraf.launch(config.telegram.mainToken)
}

main().catch(console.dir)


async function loadAgRegAndParseInn(telegraf: Telegraf, chatId: number) {
    let scene: Scene = {
        tpe: "HelloGetInn"
    }
    await telegraf.telegram.sendMessage(chatId, getTexts(scene))
}
