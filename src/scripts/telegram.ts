import config from '../config/config'
import {Telegraf} from "telegraf"
import {texts} from "../model/texts"
import {agRegCreateFile} from "./ag-reg-converter"
import fs from "fs"
import {getReports} from "./create-report"
import * as path from "path";
import {text} from "telegraf/typings/button";

async function main() {
    const telegraf = new Telegraf(config.telegram.mainToken)

    await telegraf.on('text', async (ctx) => {
        const user = ctx.from
        const text = ctx.message.text
        if (text.includes("getinn")) {
            await loadAgRegAndParseInn(telegraf, user.id)
        }
        else if (text.includes("createreports")) {
            await createReports(telegraf, user.id)
        }
    })
    await telegraf.launch(config.telegram.mainToken)
}

main().catch(console.dir)

async function loadAgRegAndParseInn(telegraf: Telegraf, chatId: number) {
    await telegraf.telegram.sendMessage(chatId, texts.getInnHello)

    await telegraf.on('document', async (ctx) => {
        const document = ctx.message.document
        const file = await telegraf.telegram.getFile(document.file_id)
        const fileUrl = `http://api.telegram.org/file/bot${config.telegram.mainToken}/${file.file_path}`
        const Downloader = require("nodejs-file-downloader")
        const downloader = new Downloader({url: fileUrl, directory:path.join("files")})
        try {
            const {filePath, downloadStatus} = await downloader.download()
            await telegraf.telegram.sendMessage(chatId, texts.getInnStart)
            const fileName = await agRegCreateFile(filePath)
            await telegraf.telegram.sendDocument(
                chatId, {
                    filename: fileName,
                    source: fileName
                }
            )
            await telegraf.telegram.sendMessage(chatId, texts.getInnFinish)
            await fs.rmSync(filePath)
            await fs.rmSync(fileName)
        } catch (error) {
            await telegraf.telegram.sendMessage(chatId, `Download failed${error}`)
        }
    })
}

async function createReports(telegraf: Telegraf, chatId: number) {
    await telegraf.telegram.sendMessage(chatId, texts.sendSisLink)
    let pathSisLinkXlsx:string = ""
    await telegraf.on('document', async (ctx) => {
        const document = ctx.message.document
        const file = await telegraf.telegram.getFile(document.file_id)
        const fileUrl = `http://api.telegram.org/file/bot${config.telegram.mainToken}/${file.file_path}`
        const Downloader = require("nodejs-file-downloader")
        const downloader = new Downloader({url: fileUrl})
        try {
            const {filePath, downloadStatus} = await downloader.download()
            pathSisLinkXlsx = filePath
        } catch (error) {
            await telegraf.telegram.sendMessage(chatId, `Download failed${error}`)
        }
    })
    if (pathSisLinkXlsx.length > 3) {
        await telegraf.telegram.sendMessage(chatId, texts.sendAgReg)
        let pathAgRegXlsx: string = ""
        await telegraf.on('document', async (ctx) => {
            const document = ctx.message.document
            const file = await telegraf.telegram.getFile(document.file_id)
            const fileUrl = `http://api.telegram.org/file/bot${config.telegram.mainToken}/${file.file_path}`
            const Downloader = require("nodejs-file-downloader")
            const downloader = new Downloader({url: fileUrl})
            try {
                const {filePath, downloadStatus} = await downloader.download()
                pathAgRegXlsx = filePath
            } catch (error) {
                await telegraf.telegram.sendMessage(chatId, `Download failed${error}`)
            }
        })
        await telegraf.telegram.sendMessage(chatId, texts.sendTs)
        let pathTsXlsx: string = ""
        await telegraf.on('document', async (ctx) => {
            const document = ctx.message.document
            const file = await telegraf.telegram.getFile(document.file_id)
            const fileUrl = `http://api.telegram.org/file/bot${config.telegram.mainToken}/${file.file_path}`
            const Downloader = require("nodejs-file-downloader")
            const downloader = new Downloader({url: fileUrl})
            try {
                const {filePath, downloadStatus} = await downloader.download()
                pathTsXlsx = filePath
            } catch (error) {
                await telegraf.telegram.sendMessage(chatId, `Download failed${error}`)
            }
        })

        await telegraf.telegram.sendMessage(chatId, texts.sendPrice)
        let pathPriceXlsx: string = ""
        await telegraf.on('document', async (ctx) => {
            const document = ctx.message.document
            const file = await telegraf.telegram.getFile(document.file_id)
            const fileUrl = `http://api.telegram.org/file/bot${config.telegram.mainToken}/${file.file_path}`
            const Downloader = require("nodejs-file-downloader")
            const downloader = new Downloader({url: fileUrl})
            try {
                const {filePath, downloadStatus} = await downloader.download()
                pathPriceXlsx = filePath
            } catch (error) {
                await telegraf.telegram.sendMessage(chatId, `Download failed${error}`)
            }
        })

        const reportsFileName = await getReports(pathSisLinkXlsx, pathAgRegXlsx, pathTsXlsx, pathPriceXlsx)
        await telegraf.telegram.sendDocument(
            chatId, {
                filename: reportsFileName,
                source: reportsFileName
            }
            //todo наверное нужно будет загрузить все 4 файла и только после этого проверить наличие всех и сформировать отчет
        )
    }
}
