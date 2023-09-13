import {AgReg} from "../model/model"
import xlsx from "xlsx"
import Excel, {Workbook, Worksheet} from "exceljs"
import * as path from "path"
import {getINN} from "./selenium-worker"

export async function agRegCreateFile(pathAgReg:string):Promise<string> {
    let agRegs: AgReg[] = parseAgRegXlsx(pathAgReg)
    agRegs = await getINN(agRegs)
    agRegs = parseCultures(agRegs)
    return await saveAgrRegsToXlsx(agRegs)
}

function parseAgRegXlsx(path: string): AgReg[] {
    const file = xlsx.readFile(path)
    let agRegs: AgReg[] = []
    const sheets = file.SheetNames
    let client: string, cultures: string, status: string, region: string, area: string, fullName: string
    let totalSquare: number = 0
    for (let i = 0; i < sheets.length; i++) {
        const temp = xlsx.utils.sheet_to_json(
            file.Sheets[file.SheetNames[i]])
        temp.forEach((res) => {
            if (typeof res == "object" && res != null) {
                for (let [key, value] of Object.entries(res)) {
                    if (key == "Наименование") {
                        client = value
                    } else if (key.includes("Культуры")) {
                        cultures = value
                    } else if (key.includes("Статус")) {
                        status = value
                    } else if (key.includes("Регион")) {
                        region = value
                    } else if (key.includes("Район")) {
                        area = value
                    } else if (key.includes("ФИО")) {
                        fullName = value
                    } else if (key.includes("Посевная площадь")) {
                        totalSquare = value
                    }
                }
                if (client) {
                    let agReg: AgReg = {
                        client: client ? client : "",
                        fullName: fullName ? fullName : "",
                        region: region ? region : "",
                        totalSquare: totalSquare ? totalSquare : 0,
                        area: area ? area : "",
                        cultures,
                        prepareClientName: client ? prepareAgRegName(client) : "",
                        status
                    }
                    agRegs.push(agReg)
                }
            }
        })
    }
    return agRegs
}

function prepareAgRegName(client: string): string {
    //удаляем абривиатуры и оставляем первое слово более 3-х букв
    let prepareClientName = client.replace("ИП", '')
        .replace("им. И.П.", '')
        .replace("ЗАО", '')
        .replace("АО", '')
        .replace("ГЛАВА КРЕСТЬЯНСКОГО (ФЕРМЕРСКОГО) ХОЗЯЙСТВА - ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ", '')
        .replace("Глава КФХ", '')
        .replace("Индивидуальный предприниматель глава крестьянского (фермерского) хозяйства", '')
        .replace("Глава К(Ф)Х ", '')
        .replace("ИП ГКФХ", '')
        .replace("ООО", '')
        .replace("СПК", '')
        .replace("ОП СХП", '')
        .replace("КХ", '')
        .replace("глава", '')
        .replace("А/Ф", '')
        .replace("Общество с ограниченной ответственностью", '')
        .replace("Агрофирма", '')
        .replace("Кфх", '')
        .replace("АПК", '')
        .replace("АТП", '')
        .replace("СО", '')
        .replace("АО", '')
        .replace("ГКФХ", '')
        .replace("КФХ", '')
        .replace("СХПК", '')
        .replace("СХА", '')
        .replace("ГЛАВА К(Ф) Х", '')
        .replace("СКСХОС – филиал ФГБНУ НЦЗ им. П.П.", '')
        .replace("Глава К(Ф)Х С", '')
        .replace("АПХ", '')
        .replace("Индивидуальный", '')
        .replace(".", '')
        .replace(",", '')
        .replace("\"", '')
        .replace("\"", '')
        .replace("\"", '')
        .replace("\,", '')
        .replace("\,", '')
        .replace("\\", '')
        .replace("»", '')
        .replace("«", '')
        .replace("«", '')
        .replace("»", '')
        .trim()

    const clientNameMass = prepareClientName.split(" ")
    for (let j = 0; j < clientNameMass.length; j++) {
        if (clientNameMass[j].length > 3) {
            prepareClientName = clientNameMass[j]
            j = clientNameMass.length
        }
    }
    return prepareClientName
}

function parseCultures(agRegs: AgReg[]): AgReg[] {
    const agRegsCulture: AgReg[] = []
    for (let i = 0; i < agRegs.length; i++) {
        const culturesMass = agRegs[i].cultures
            ?.replace("\"", '')
            .replace("\"", '')
            .replace("Га", '')
            .replace(" га", '')
            .replace("га", '')
            .replace("ГА", '')
            .replace("}", '')
            .split('),')
        if (culturesMass) {
            for (let culture of culturesMass) {
                culture = culture.trim()
                let singleCulture = culture.slice(0, culture.lastIndexOf(" ")).trim()
                let square = culture.slice(culture.lastIndexOf(" "), culture.length)
                    .replace("(", '')
                    .replace(")", '')
                    .trim().replace(",", ".")
                const agRegCulture: AgReg = {
                    client: agRegs[i].client,
                    prepareClientName: agRegs[i].prepareClientName,
                    fullName: agRegs[i].fullName,
                    region: agRegs[i].region,
                    area: agRegs[i].area,
                    cultures: agRegs[i].cultures,
                    totalSquare: agRegs[i].totalSquare,
                    culture: singleCulture,
                    square: Number(square),
                    status: agRegs[i].status,
                    inn: agRegs[i].inn
                }
                agRegsCulture.push(agRegCulture)
            }
        }
    }
    return agRegsCulture
}

async function saveAgrRegsToXlsx(agRegs: AgReg[]):Promise<string> {
    const workbook: Workbook = new Excel.Workbook()
    const worksheet: Worksheet = workbook.addWorksheet("АгРег")

    worksheet.columns = [
        {header: 'inn', key: 'inn', width: 15},
        {header: 'client', key: 'client', width: 25},
        {header: 'fullName', key: 'fullName', width: 25},
        {header: 'region', key: 'region', width: 25},
        {header: 'area', key: 'area', width: 25},
        {header: 'totalSquare', key: 'totalSquare', width: 20},
        {header: 'cultures', key: 'cultures', width: 25},
        {header: 'culture', key: 'culture', width: 25},
        {header: 'square', key: 'square', width: 25},
        {header: 'status', key: 'status', width: 15}
    ]
    for (let data of agRegs) {
        worksheet.addRow(data).commit()
    }
    const fileName = path.join("files", `АгРегРучноеЗаполнениеИнн${new Date().getDate()},${new Date().getMonth() + 1}.xlsx`)
    await workbook.xlsx.writeFile(fileName)
    return fileName
}
