import config from '../config/config'
import {Telegraf} from "telegraf"
import {texts} from "../model/texts"
import {agRegCreateFile} from "./ag-reg-converter"
import fs from "fs"
import {getReports} from "./create-report"
import * as path from "path"
import Downloader from "nodejs-file-downloader"

async function main() {
    const telegraf = new Telegraf(config.telegram.mainToken, {handlerTimeout: 9000000})

    enum states {reboot, getInn, getSisLink, getTs, getAgRes, getPrice, createReport }

    let state: states = states.getInn
    let chatId: number
    let agReg: string| undefined
    let sisLink: string| undefined
    let ts: string| undefined
    let price: string| undefined

    // state manager and inform user
    telegraf.on('text', async (ctx) => {
        const user = ctx.from
        chatId = user.id
        const text = ctx.message.text
        if (text.includes("reboot")) {
            state = states.reboot
            agReg = undefined
            sisLink = undefined
            ts = undefined
            price = undefined
            try {
                await fs.rmSync(path.join(`files`), {recursive: true, force: true})
            } catch (e) {
                console.error(e)
            }
            await telegraf.telegram.sendMessage(chatId, texts.reboot)
        } else if (text.includes("getinn")) {
            state = states.getInn
            await telegraf.telegram.sendMessage(chatId, texts.getInnHello)
        } else if (text.includes("getsislink")) {
            state = states.getSisLink
            await telegraf.telegram.sendMessage(chatId, texts.sendSisLink)
        } else if (text.includes("getts")) {
            state = states.getTs
            await telegraf.telegram.sendMessage(chatId, texts.sendTs)
        } else if (text.includes("getagreg")) {
            state = states.getAgRes
            await telegraf.telegram.sendMessage(chatId, texts.sendAgReg)
        } else if (text.includes("getprice")) {
            state = states.getPrice
            await telegraf.telegram.sendMessage(chatId, texts.sendPrice)
        } else if (text.includes("createreport")) {
            state = states.createReport
            if (agReg && sisLink && ts && price) {
                await telegraf.telegram.sendMessage(chatId, texts.createReport)
                const reportsZipPath = await getReports(sisLink, agReg, ts, price)
                await telegraf.telegram.sendDocument(
                    chatId, {
                        filename: "reports.zip",
                        source: reportsZipPath
                    }
                )
                try {
                    await fs.rmSync(path.join(`files`), {recursive: true, force: true})
                } catch (ignore) {
                }
            } else {
                await telegraf.telegram.sendMessage(chatId, `Статус загрузки: \n` +
                    `Сислинк - ${sisLink ? "загружен" : "отсуствует"} \n` +
                    `Тс - ${ts ? "загружен" : "отсуствует"} \n` +
                    `АгРег - ${agReg ? "загружен" : "отсуствует"} \n` +
                    `Цены - ${price ? "загружен" : "отсуствует"} \n` +
                    `Загрузите недостающие файлы
                `)
            }
        }
    })

    // load files
    await telegraf.on('document', async (ctx) => {

            const document = ctx.message.document
            const file = await telegraf.telegram.getFile(document.file_id)
            const fileUrl = `http://api.telegram.org/file/bot${config.telegram.mainToken}/${file.file_path}`
            const downloader = new Downloader({url: fileUrl, directory: path.join("files")})
            const {filePath} = await downloader.download()
            if (filePath) {
                switch (state) {
                    case states.getInn:
                        try {
                            await telegraf.telegram.sendMessage(chatId, texts.getInnStart)
                            const fileName = await agRegCreateFile(filePath)
                            await telegraf.telegram.sendDocument(
                                chatId, {
                                    filename: fileName,
                                    source: fileName
                                }
                            )
                            await telegraf.telegram.sendMessage(chatId, texts.getInnFinish)
                        } catch (error) {
                            await telegraf.telegram.sendMessage(chatId, `Download failed${error}`)
                        }
                        break

                    case states.getSisLink:
                        try {
                            sisLink = filePath
                            await telegraf.telegram.sendMessage(chatId, texts.doneSisLink)
                        } catch (error) {
                            await telegraf.telegram.sendMessage(chatId, `Download failed${error}`)
                        }
                        break;
                    case states.getTs:
                        try {
                            ts = filePath
                            await telegraf.telegram.sendMessage(chatId, texts.doneTs)
                        } catch (error) {
                            await telegraf.telegram.sendMessage(chatId, `Download failed${error}`)
                        }
                        break;
                    case states.getAgRes:
                        try {
                            agReg = filePath
                            await telegraf.telegram.sendMessage(chatId, texts.doneAgReg)
                        } catch (error) {
                            await telegraf.telegram.sendMessage(chatId, `Download failed${error}`)
                        }
                        break;
                    case states.getPrice:
                        try {
                            price = filePath
                            await telegraf.telegram.sendMessage(chatId, texts.donePrice)
                        } catch (error) {
                            await telegraf.telegram.sendMessage(chatId, `Download failed${error}`)
                        }
                        break;
                }
            }

    })
    await telegraf.launch(config.telegram.mainToken)
}

main().catch(console.dir)
