import fs from "fs"
import {AgReg} from "../model/model"
import {getINN} from "./selenium-worker"
import xlsx from "xlsx"

/*
1) Указываем путь до файла
2) Загружаем файл и преобразуем в массив
3) Открываем сайт для получения данных ИНН
4) По названию каждого элемента массива получаем ИНН
5) Формируем исходящие таблицы
*/

async function main() {
    const pathAgReg = process.argv[2]

    let agRegs: AgReg[] = parseAgRegXlsx(pathAgReg)
    agRegs = await getINN(agRegs)
    agRegs = parseCultures(agRegs)
    const JSONtoExcel = JSON.stringify(agRegs)
    fs.writeFileSync("agReg6.json", JSONtoExcel)
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
                            client,
                            fullName,
                            region,
                            totalSquare,
                            area,
                            cultures,
                            prepareClientName: client ? prepareAgRegName(client) : undefined,
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

main().catch(console.dir)