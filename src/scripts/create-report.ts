import xlsx from "xlsx"
import {
    AgReg,
    DistributorData,
    DistributorReport,
    CultureReport,
    ProductReport,
    SisLink,
    Ts,
    ProductPrice
} from "../model/model"
import {Workbook, Worksheet} from "exceljs"

async function main() {
    const pathSisLinkXlsx = process.argv[2]
    const pathAgRegXlsx = process.argv[3]
    const pathTsXlsx = process.argv[4]
    const pathPriceXlsx = process.argv[5]
    const sisLinks: SisLink[] = parseSisLinkXlsx(pathSisLinkXlsx)
    const agRegs: AgReg[] = parseAgRegInnXlsx(pathAgRegXlsx)
    const tss: Ts[] = parseTsXlsx(pathTsXlsx)
    const prices: ProductPrice[] = parseProductPriceXls(pathPriceXlsx)
    const distributorReports: DistributorReport[] = createReports(sisLinks, agRegs, tss, prices)
    await convertAndSaveReportsToXls(distributorReports)
}

main().catch(console.dir)

function parseSisLinkXlsx(path: string): SisLink[] {
    const file = xlsx.readFile(path)
    let sisLinks: SisLink[] = []
    const sheets = file.SheetNames
    for (let i = 0; i < sheets.length; i++) {
        const temp = xlsx.utils.sheet_to_json(
            file.Sheets[file.SheetNames[i]])
        let name = ""
        let inn = ""
        let client = ""
        let product = ""
        let amount = ""
        temp.forEach((res) => {
            if (typeof res == "object" && res != null) {
                for (let [key, value] of Object.entries(res)) {
                    if (key.includes("дистрибьютора")) {
                        name = value
                    } else if (key.includes("клиента")) {
                        client = value
                    } else if (key.includes("ИНН")) {
                        inn = value
                    } else if (key.includes("Наименование")) {
                        product = value
                    } else if (key.includes("BayerCS")) {
                        amount = value
                    }
                }
                let distributorData: DistributorData = {
                    inn,
                    client,
                    product,
                    amount
                }
                let flagToAdd: boolean = true
                sisLinks.forEach((key) => {
                    if (key.distributorName == name) {
                        key.distributorDates.push(distributorData)
                        flagToAdd = false
                    }
                })
                if (flagToAdd) {
                    let sisLink: SisLink = {
                        distributorName: name,
                        distributorDates: [distributorData]
                    }
                    sisLinks.push(sisLink)
                }
            }
        })
    }
    return sisLinks
}

function parseAgRegInnXlsx(path: string): AgReg[] {
    const file = xlsx.readFile(path)
    let agRegs: AgReg[] = []
    const sheets = file.SheetNames
    for (let i = 0; i < sheets.length; i++) {
        const temp = xlsx.utils.sheet_to_json(
            file.Sheets[file.SheetNames[i]])
        let inn = ""
        let client = ""
        let totalSquare = 0
        let culture = ""
        let square = 0
        let status = ""
        temp.forEach((res) => {
            if (typeof res == "object" && res != null) {
                for (let [key, value] of Object.entries(res)) {
                    if (key.includes("inn")) {
                        inn = value.toString().replace("\"", "").replace("\"", "")
                    } else if (key.includes("client")) {
                        client = value
                    } else if (key.includes("totalSquare")) {
                        totalSquare = Number(value)
                    } else if (key.includes("culture")) {
                        culture = value
                    } else if (key.includes("square")) {
                        square = Number(value)
                    } else if (key.includes("status")) {
                        status = value.trim()
                            .replace("\"", "")
                            .replace("\"", "")
                            .replace("}", "")
                    }
                }
                let agReg: AgReg = {
                    inn,
                    client,
                    totalSquare,
                    culture,
                    square,
                    status
                }
                agRegs.push(agReg)
            }
        })
    }
    return agRegs
}

function parseTsXlsx(path: string): Ts[] {
    const file = xlsx.readFile(path)
    let tss: Ts[] = []
    const sheets = file.SheetNames
    for (let i = 0; i < sheets.length; i++) {
        const temp = xlsx.utils.sheet_to_json(
            file.Sheets[file.SheetNames[i]])
        let inn = ""
        let premium = ""
        temp.forEach((res) => {
            if (typeof res == "object" && res != null) {
                for (let [key, value] of Object.entries(res)) {
                    if (key.includes("ИНН")) {
                        inn = value
                    } else if (key.includes("Премиальный")) {
                        premium = value
                    }
                }
                let ts: Ts = {
                    inn,
                    premium
                }
                tss.push(ts)
            }
        })
    }
    return tss
}

function parseProductPriceXls(path: string): ProductPrice[] {
    const file = xlsx.readFile(path)
    let productPrices: ProductPrice[] = []
    const sheets = file.SheetNames
    for (let i = 0; i < sheets.length; i++) {
        const temp = xlsx.utils.sheet_to_json(
            file.Sheets[file.SheetNames[i]])
        let product = ""
        let price = ""
        temp.forEach((res) => {
            if (typeof res == "object" && res != null) {
                for (let [key, value] of Object.entries(res)) {
                    if (key.includes("Препарат")) {
                        product = value
                    } else if (key.includes("Цена")) {
                        price = value
                    }
                }
                let productPrice: ProductPrice = {
                    product,
                    price
                }
                productPrices.push(productPrice)
            }
        })
    }
    return productPrices
}

function createReports(sisLinks: SisLink[], agRegs: AgReg[],
                       tss: Ts[], prices: ProductPrice[]): DistributorReport[] {
    const distributorReports: DistributorReport[] = []
    const uniqueINN = new Set()
    const premiumInn = new Set()
    for (let ts of tss) {
        if (ts.premium == "Нет") {
            premiumInn.add(ts.inn)
        }
    }
    for (let sisLink of sisLinks) {
        let name: string = sisLink.distributorName
        let cultureReports: CultureReport[] = []
        let productReports: ProductReport[] = []
        for (let distributorDate of sisLink.distributorDates) {
            if (distributorDate.inn && distributorDate.client
                && distributorDate.amount && distributorDate.product) {
                if (premiumInn.has(distributorDate.inn) && !uniqueINN.has(distributorDate.inn)) {
                    let status, totalSquare, culture, square
                    for (let i = 0; i < agRegs.length; i++) {
                        if (agRegs[i].inn == distributorDate.inn) {
                            status = agRegs[i].status
                            totalSquare = agRegs[i].totalSquare
                            culture = agRegs[i].culture
                            square = agRegs[i].square
                            if (status) {
                                let cultureReport: CultureReport = {
                                    inn: distributorDate.inn,
                                    client: distributorDate.client,
                                    status,
                                    distributorName: name,
                                    totalSquare,
                                    culture,
                                    square
                                }
                                cultureReports.push(cultureReport)
                            }
                        }
                    }
                    if (!status) status = "нет данных"
                    let premiumPercent = 5
                    let price
                    let productReport: ProductReport
                    for (let productPrice of prices) {
                        if (distributorDate.product == productPrice.product?.replace("*","").replace("*","")
                            && productPrice.price)
                            price = productPrice.price
                    }
                    if (price) {
                        productReport = {
                            inn: distributorDate.inn,
                            client: distributorDate.client,
                            status: status,
                            distributorName: name,
                            product: distributorDate.product,
                            amount: Number(distributorDate.amount),
                            price: Number(price),
                            sum: (Number(distributorDate.amount) * Number(price)),
                            premiumPercent: premiumPercent,
                            premiumSum: (Number(distributorDate.amount) *
                                Number(price) * Number(premiumPercent) / 100)
                        }
                    } else {
                        productReport = {
                            inn: distributorDate.inn,
                            client: distributorDate.client,
                            status: status,
                            distributorName: name,
                            product: distributorDate.product,
                            amount: Number(distributorDate.amount)
                        }
                    }
                    productReports.push(productReport)
                }
            }
            uniqueINN.add(distributorDate.inn)
        }
        let distributorReport: DistributorReport = {
            distributorName: name,
            cultureReports,
            productReports
        }
        distributorReport.totalPremiumSum = 0
        for (let productReport of productReports) {
            if (productReport.premiumSum)
                distributorReport.totalPremiumSum += productReport.premiumSum
        }
        distributorReports.push(distributorReport)
    }
    return distributorReports
}

async function convertAndSaveReportsToXls(distributorReports: DistributorReport[]) {
    let Excel = require('exceljs')

    for (let distributorReport of distributorReports) {
        let fileName = distributorReport.distributorName
        let sheetCulture = "Отчет по культурам"
        let sheetProduct = "Отчет по продуктам"

        const workbook: Workbook = new Excel.Workbook()
        const worksheetProduct: Worksheet = workbook.addWorksheet(sheetProduct)
        const worksheetCulture: Worksheet = workbook.addWorksheet(sheetCulture)

        worksheetProduct.columns = [
            {header: 'ИНН', key: 'inn', width: 15},
            {header: 'Малое хозяйство', key: 'client', width: 25},
            {header: 'Регистрация в "Агрорегистре', key: 'status', width: 20},
            {header: 'Наличие продаж в "Малое хозяйство', key: 'noData', width: 25},
            {
                header: 'Каким дистрибьютором была проверка',
                key: 'distributorName',
                width: 25
            },
            {header: 'Продукт', key: 'product', width: 15},
            {header: 'Кол-во', key: 'amount', width: 10},
            {header: 'Цена', key: 'price', width: 10},
            {header: 'Сумма', key: 'sum', width: 10},
            {header: 'Процент премии', key: 'premiumPercent', width: 10},
            {header: 'Сумма премии', key: 'premiumSum', width: 10},
            {header: 'Общая сумма премии за "Малое хозяйство', key: 'totalPremiumSum', width: 15}
        ]
        for (let data of distributorReport.productReports) {
            worksheetProduct.addRow(data).commit()
        }
        worksheetProduct.addRow({totalPremiumSum:distributorReport.totalPremiumSum}).commit()

        worksheetCulture.columns = [
            {header: 'ИНН', key: 'inn', width: 15},
            {header: 'Малое хозяйство', key: 'client', width: 25},
            {header: 'Регистрация в "Агрорегистре', key: 'status', width: 20},
            {header: 'Наличие продаж в "Малое хозяйство', key: 'noData', width: 20},
            {
                header: 'Каким дистрибьютором была проверка',
                key: 'distributorName',
                width: 20
            },
            {header: 'Общая посевнае S, га.', key: 'totalSquare', width: 20},
            {header: 'Культура', key: 'culture', width: 25},
            {header: 'Площадь га.', key: 'square', width: 20}
        ]
        for (let data of distributorReport.cultureReports) {
            worksheetCulture.addRow(data).commit()
        }
        await workbook.xlsx.writeFile(`${fileName} ${new Date().getDate()},${new Date().getMonth() + 1}.xlsx`)
    }
}
