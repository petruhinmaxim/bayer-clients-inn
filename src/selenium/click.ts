import { WebDriver, Locator, until, WebElement } from 'selenium-webdriver'

export async function click(
  webDriver: WebDriver,
  locator: Locator,
  timeout: number = 10000
): Promise<WebElement> {
  const elem = await webDriver.wait(until.elementLocated(locator), timeout)
  await webDriver.wait(until.elementIsEnabled(elem), timeout)
  await webDriver.executeScript('arguments[0].click();', elem)
  return elem
}

export async function clickAction(
  webDriver: WebDriver,
  locator: Locator,
  timeout: number = 10000
): Promise<WebElement> {
  const elem = await webDriver.wait(until.elementLocated(locator), timeout)
  await webDriver.wait(until.elementIsEnabled(elem), timeout)
  await webDriver.actions().move({ x: 1, y: 1, origin: elem }).click().perform()
  return elem
}
