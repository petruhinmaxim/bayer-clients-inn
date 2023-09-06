import {consoleAndFileLogger} from "../util/Logger";
import {Browser, Builder, By, Key, until, WebDriver, WebElement} from "selenium-webdriver";
import {AgReg} from "../model/model";

export async function getINN(agReg: AgReg[]): Promise<AgReg[]> {

    const log = consoleAndFileLogger('runBrowser')

    let webDriver = await new Builder().forBrowser(Browser.CHROME).build();

    try {
        await academyReg(webDriver)
        // ожидаем загрузки страницы
        await webDriver.wait(until.elementLocated(By.xpath('//*[@id="edit-field-company-0-value"]')), 1000)

        const nameInput = await webDriver.findElement(By.xpath('//*[@id="edit-field-company-0-value"]'))
        const regionBottom = await webDriver
            .findElement(By.xpath('//*[@id="edit-field-region-list-wrapper"]/div/div/div[3]/div[1]/input'))


        for (let i = 0; i < agReg.length; i++) {
            // @ts-ignore вводим имя
            await nameInput.sendKeys(agReg[i].prepareClientName)
            await webDriver.sleep(2000)
            try {
                await webDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-id-2"]')), 2000)
                const elemInn = await webDriver.findElement(By.xpath('//*[@id="ui-id-2"]'))
                //проверяем число совпадений
                let innCount = await checkInnCount(webDriver, elemInn)
                if (innCount == 2) {
                    agReg[i].inn = await getInn(webDriver, elemInn)
                } else if (innCount < 2) {
                    //ручная проверка
                } else if (innCount > 2) {
                    try {
                        // @ts-ignore
                        const region = agReg[i].region.split(" ")[0]
                        // @ts-ignore
                        const area = agReg[i].area.split(" ")[0]
                        await inputRegion(webDriver, regionBottom, region, area)
                        //заполняем повторно имя и получаем данные
                        await clearNameField(webDriver, nameInput)
                        // @ts-ignore
                        await nameInput.sendKeys(agReg[i].prepareClientName)
                        await webDriver.sleep(2000)
                        await webDriver.wait(until.elementLocated(By.xpath('//*[@id="ui-id-2"]')), 2000)
                        const elemInn = await webDriver.findElement(By.xpath('//*[@id="ui-id-2"]'))
                        innCount = await checkInnCount(webDriver, elemInn)
                        if (innCount == 2) {
                            agReg[i].inn = await getInn(webDriver, elemInn)
                        } else {
                            try {
                                //проверка по имени todo  мб посимвольный ввод
                                await clearRegionFields(webDriver, regionBottom)
                                await clearNameField(webDriver, nameInput)
                                // @ts-ignore
                                const name = agReg[i].fullName.split(" ")[1]
                                await nameInput.sendKeys(agReg[i].prepareClientName + " " + name)
                                await webDriver.sleep(5000)
                                innCount = await checkInnCount(webDriver, elemInn)
                                if (innCount == 2) {
                                    agReg[i].inn = await getInn(webDriver, elemInn)
                                }
                            }
                            catch (ignore) {}
                        }
                    } catch (ignore) {
                    }
                    await clearRegionFields(webDriver, regionBottom)
                }
            } catch (ignore) {
            }
            await clearNameField(webDriver, nameInput)
        }
    } catch (e) {
        log.error(`Run Browser failed: ${e}`)
    } finally {
        try {
            await webDriver.quit()
        } catch (e) {
            log.error(`${e}`)
        }
    }
    return agReg
}

async function academyReg(webDriver: WebDriver) {
    const startUrl = 'https://academy.cs.bayer.ru/user/register/client?destination=/feed'
    await webDriver.get(startUrl)
    await webDriver.wait(until.elementLocated(By.xpath('//*[@id="edit-field-name-0-value"]')), 1000)

    const nameInput = await webDriver.findElement(By.xpath('//*[@id="edit-field-name-0-value"]'))
    await nameInput.sendKeys("Иванов")
    await nameInput.sendKeys(Key.ENTER)

    const phoneInput = await webDriver.findElement(By.xpath('//*[@id="edit-field-phone-0-value"]'))
    await phoneInput.sendKeys("9991232233")

    const emailInput = await webDriver.findElement(By.xpath('//*[@id="edit-mail"]'))
    await emailInput.sendKeys("ivanov@gmail.com")

    const passInput = await webDriver.findElement(By.xpath('//*[@id="edit-pass-pass1"]'))
    await passInput.sendKeys("1233")
    const passInput2 = await webDriver.findElement(By.xpath('//*[@id="edit-pass-pass2"]'))
    await passInput2.sendKeys("1233")

    const gotoInput = await webDriver.findElement(By.xpath('//*[@id="block-academy-bayer-content"]/div/div[3]/div[1]/a[2]\n'))
    await gotoInput.sendKeys(Key.ENTER)
}

async function clearNameField(webDriver: WebDriver, nameInput: WebElement) {
    await nameInput.sendKeys(Key.chord(Key.COMMAND, "A"))
    await webDriver.sleep(1000)
    await nameInput.sendKeys(Key.chord(Key.COMMAND, "A"))
    await nameInput.sendKeys(Key.BACK_SPACE)
}

async function checkInnCount(webdriver: WebDriver, elemInn: WebElement): Promise<number> {
    const text: string = await elemInn.getText()
    const stringMass: string[] = text.split('\n')
    return stringMass.length
}

async function getInn(webdriver: WebDriver, elemInn: WebElement): Promise<string> {
    const text: string = await elemInn.getText()
    const stringMass: string[] = text.split('\n')
    return stringMass[0].split("ИНН: ")[1]
}

async function inputRegion(webDriver: WebDriver,
                           regionBottom: WebElement,
                           region: string,
                           area: string) {
    try {
        await webDriver.findElement(By.xpath('//*[@id="edit-field-region-list-wrapper"]/div/div/div[2]')).click()
        // @ts-ignore
        await regionBottom.sendKeys(region)
        await webDriver.sleep(1000)
        await webDriver.findElement(By.css(`div[class="list__option"]`)).click()
        await webDriver.sleep(1000)
        await webDriver.findElement(By.xpath('//*[@id="edit-field-district-list-wrapper"]/div/div/div[2]')).click()
        await webDriver.sleep(1000)
        const areaBottom = await webDriver
            .findElement(By.xpath('//*[@id="edit-field-district-list-wrapper"]/div/div/div[3]/div[1]/input'))
        await areaBottom.sendKeys(area)
        await webDriver.sleep(2000)
        await webDriver.findElement(By.css(`div[class="list__option"]`)).click()
    } catch (e) {
    }
}

async function clearRegionFields(webDriver: WebDriver, regionBottom: WebElement) {
    await webDriver.findElement(By.xpath('//*[@id="edit-field-region-list-wrapper"]/div/div/div[2]')).click()
    await webDriver.sleep(1000)
    await regionBottom.sendKeys(Key.chord(Key.COMMAND, "A"))
    await regionBottom.sendKeys(Key.chord(Key.COMMAND, "A"))
    await regionBottom.sendKeys(Key.BACK_SPACE)
    await webDriver.sleep(1000)
    await webDriver.findElement(By.xpath('//*[@id="edit-field-region-list-wrapper"]/div/div/div[3]/div[2]/div[1]/span')).click()
}