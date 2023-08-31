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

    let data: DataModel = {
        sisLink: [],
        agReg: [],
        ts: [],
        psp: [],
        price: []
    }

    JSON.parse(contents, function (key, value) {
            if (key == "Сислинк") {
                value.forEach((element: string) => {
                    let distributor, inn, client, product, amount
                    let stringElement = JSON.stringify(element)
                    let sisLinkStringData: string[] = stringElement.split(",\"")
                    sisLinkStringData.forEach(data => {
                            if (data.includes("наименование дистрибьютора")) {
                                const replacer = "\\"
                                distributor = data.split(':')[1].replace(replacer, '').replace(replacer, '')
                            } else if (data.includes("ИНН")) {
                                inn = data.split(':')[1]
                            } else if (data.includes("Название клиента")) {
                                client = data.split(':')[1]
                            } else if (data.includes("Наименование товара краткое")) {
                                product = data.split(':')[1]
                            } else if (data.includes("Количество, в ед. изм BayerCS\"")) {
                                amount = data.split(':')[1]
                            }
                        }
                    )
                    let sisLink: SisLink = {
                        distributor,
                        inn,
                        client,
                        product,
                        amount
                    }
                    data.sisLink.push(sisLink)
                })
            }
            if (key == "Выгрузка из агрорегистра") {
                value.forEach((element: string) => {
                    let client, culture, status, region, area
                    let stringElement = JSON.stringify(element)
                    let agRegStringData: string[] = stringElement.split(",\"")
                    agRegStringData.forEach(data => {
                        if (data.includes("Наименование")) {
                            const replacer = "\\\""
                            client = data.split(':')[1].replace(replacer, '').replace(replacer, '')
                        } else if (data.includes("Культуры")) {
                            culture = data.split(':')[1]
                        } else if (data.includes("Статус")) {
                            status = data.split(':')[1]
                        } else if (data.includes("Регион")) {
                            region = data.split(':')[1].replace("\"", '')
                                .replace("\"", '')
                        } else if (data.includes("Район")) {
                            area = data.split(':')[1].replace("\"", '')
                                .replace("\"", '')
                        }
                    })
                    const prepareClientName = prepareAgRegNames(client?client:'')
                    let agReg: AgReg = {
                        client,
                        region: region ? region : "",
                        area: area ? area : "",
                        culture,
                        prepareClientName,
                        status
                    }
                    data.agReg.push(agReg)
                })
            }
            if (key == "Выгрузка из TS") {
                value.forEach((element: string) => {
                    let inn, premium
                    let stringElement = JSON.stringify(element)
                    let agRegStringData: string[] = stringElement.split(",\"")
                    agRegStringData.forEach(data => {
                        if (data.includes("ИНН")) {
                            inn = data.split(':')[1]
                        } else if (data.includes("Премиальный")) {
                            premium = data.split(':')[1]
                        }
                    })
                    let ts: Ts = {
                        inn,
                        premium,
                    }
                    data.ts.push(ts)
                })
            }
            return value
        }
    )
    await getINN(data.agReg)
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

main().catch(console.dir)