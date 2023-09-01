import fs from "fs"
import {AgReg, DataModel, SisLink, Ts} from "../model/model";
import {getINN} from "./run-browser";

/*
1) Указываем путь до файла
2) Загружаем файл и преобразуем в массив
3) Открываем сайт для получения данных ИНН
4) По названию каждого элемента массива получаем ИНН
5) Формируем исходящие таблицы
*/

async function main() {
    const path = process.argv[2]
    const contents = fs.readFileSync(path).toString()

    let agRegs: AgReg[] = []
    JSON.parse(contents, function (key, value) {
            if (key == "Выгрузка из агрорегистра") {
                value.forEach((element: string) => {
                    let client, cultures, status, region, area, fullName
                    let totalSquare: number = 0
                    let stringElement = JSON.stringify(element)
                    let agRegStringData: string[] = stringElement.split(",\"")
                    agRegStringData.forEach(data => {
                        if (data.includes("Наименование")) {
                            const replacer = "\\\""
                            client = data.split(':')[1].replace(replacer, '').replace(replacer, '')
                        } else if (data.includes("Культуры")) {
                            cultures = data.split(':')[1]
                        } else if (data.includes("Статус")) {
                            status = data.split(':')[1]
                        } else if (data.includes("Регион")) {
                            region = data.split(':')[1].replace("\"", '')
                                .replace("\"", '')
                        } else if (data.includes("Район")) {
                            area = data.split(':')[1].replace("\"", '')
                                .replace("\"", '')
                        } else if (data.includes("ФИО")) {
                            fullName = data.split(':')[1].replace("\"", '')
                                .replace("\"", '')
                        } else if (data.includes("Посевная площадь")) {
                            totalSquare = Number(data.split(':')[1].replace("\"", '')
                                .replace("\"", ''))
                        }
                    })
                    const prepareClientName = prepareAgRegNames(client ? client : '')
                    let agReg: AgReg = {
                        client: client ? client : "",
                        fullName: fullName ? fullName : "",
                        region: region ? region : "",
                        totalSquare: totalSquare ? totalSquare : 0,
                        area: area ? area : "",
                        cultures,
                        prepareClientName,
                        status
                    }
                    agRegs.push(agReg)
                })
            }
            return value
        }
    )
    agRegs = await getINN(agRegs)
    agRegs = parseCultures(agRegs)
    const JSONtoExcel = JSON.stringify(agRegs)
    fs.writeFileSync("agReg5.json", JSONtoExcel)
}

function prepareAgRegNames(client: string): string {
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