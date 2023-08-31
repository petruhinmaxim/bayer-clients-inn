import { Builder, Capabilities, WebDriver, logging } from 'selenium-webdriver'
import * as ch from 'selenium-webdriver/chrome'
import * as ext from './extension-util'
import * as fs from 'fs'
import * as path from 'path'
import * as e from './extension-util'
import { ensureDir } from '@util/ensure-dir'

export type ProxyConfig = e.ProxyConfig

export type ChromeDriverConfig = {
  proxy?: e.ProxyConfig
  userAgent?: string
  userDataDirName?: string
  userDataDirCleanup?: boolean
  anticaptcha?: e.AnticaptchaConfig
  rucaptcha?: e.RucaptchaConfig
  metamask?: boolean
  phantom?: boolean
  solflare?: boolean
  headless?: boolean
  performanceLogging?: boolean
  adblock?: boolean
}

export async function makeChromeDriverWithConfig(
  config: ChromeDriverConfig
): Promise<{ webDriver: WebDriver, webDriverCleanup: () => void }> {
  let chromeDriverExe = path.join(process.cwd(), 'webdriver', 'chromedriver.exe')
  if (!fs.existsSync(chromeDriverExe)) {
    if (!fs.existsSync(chromeDriverExe + '.exe')) {
      throw `${chromeDriverExe}[.exe] not found`
    } else {
      chromeDriverExe = chromeDriverExe + '.exe'
    }
  }

  const cleanupPaths: string[] = []
  const extensions: any[] = []

  const ts = new Date().toISOString().slice(0, 19).split(':').join("-")

  const userDataDirName =
    (!config.userDataDirName || config.userDataDirName.trim().length == 0)
      ? `temp_user_data_${ts}`
      : config.userDataDirName
  const userDataDir = path.join(process.cwd(), 'webdriver', 'userData', userDataDirName)
  ensureDir(userDataDir)

  if (config.userDataDirCleanup != undefined && config.userDataDirCleanup) {
    cleanupPaths.push(userDataDir)
  }

  const extensionsDir =
    ensureDir(path.join(process.cwd(), 'webdriver', 'userData', 'extensions'))

  if (config.proxy != null) {
    const proxyExtensionPath = path.join(extensionsDir,
      `proxy_${config.proxy.host}_${config.proxy.port}_${ts}.zip`)
    await e.makeProxyExtension(config.proxy, proxyExtensionPath)
    extensions.push(proxyExtensionPath)
    cleanupPaths.push(proxyExtensionPath)
  }

  if (config.anticaptcha != null) {
    const proxyHost = config.anticaptcha.proxy?.host ?? ''
    const proxyPort = config.anticaptcha.proxy?.port ?? ''
    let anticaptchaExtensionPath0 = path.join(extensionsDir,
      `anticaptcha_${proxyHost}_${proxyPort}_${ts}.zip`)
    while (fs.existsSync(anticaptchaExtensionPath0 + '.zip')) {
      anticaptchaExtensionPath0 += '_'
    }
    const anticaptchaExtensionPath = `${anticaptchaExtensionPath0}.zip`
    await ext.makeAnticaptchaExtension(config.anticaptcha, anticaptchaExtensionPath)
    extensions.push(anticaptchaExtensionPath)
    cleanupPaths.push(anticaptchaExtensionPath)
  }

  if (config.rucaptcha != null) {
    const proxyHost = config.rucaptcha.proxy?.host ?? ''
    const proxyPort = config.rucaptcha.proxy?.port ?? ''
    let rucaptchaExtensionPath0 = path.join(extensionsDir,
      `rucaptcha_${proxyHost}_${proxyPort}_${ts}`)
    while (fs.existsSync(rucaptchaExtensionPath0 + '.zip')) {
      rucaptchaExtensionPath0 += '_'
    }
    const rucaptchaExtensionPath = `${rucaptchaExtensionPath0}.zip`
    await ext.makeRucaptchaExtension(config.rucaptcha, rucaptchaExtensionPath)
    extensions.push(rucaptchaExtensionPath)
    cleanupPaths.push(rucaptchaExtensionPath)
  }

  if (config.metamask == true) {
    const metamaskExtensionPath = path.join(process.cwd(), 'webdriver', 'metamask-chrome.zip')
    if (fs.existsSync(metamaskExtensionPath)) {
      extensions.push(metamaskExtensionPath)
    } else {
      console.log(
        `Metamask extension not found at ${metamaskExtensionPath}\n` +
        `Download metamask-chrome-XXX.zip from https://github.com/MetaMask/metamask-extension/releases ` +
        `and save as ${metamaskExtensionPath}`
      )
    }
  }

  if (config.phantom == true) {
    const phantomExtensionPath = path.join(extensionsDir, `phantom-chrome.zip`)
    if (fs.existsSync(phantomExtensionPath)) {
      extensions.push(phantomExtensionPath)
    } else {
      console.log(`phantom extension not found at ${phantomExtensionPath}`)
    }
  }

  if (config.solflare == true) {
    const solflareExtensionPath = path.join(extensionsDir, `solflare-chrome.zip`)
    if (fs.existsSync(solflareExtensionPath)) {
      extensions.push(solflareExtensionPath)
    } else {
      console.log(`solflare extension not found at ${solflareExtensionPath}`)
    }
  }

  if (config.adblock == true) {
    const adblockExtensionPath = path.join(extensionsDir,
      `adblock_${ts}.zip`)
    await e.makeAdBlockExtension(adblockExtensionPath)
    extensions.push(adblockExtensionPath)
    cleanupPaths.push(adblockExtensionPath)
  }

  const args = [
    `--user-data-dir=${userDataDir}`,
    // '--disable-plugins-discovery',
    '--start-maximized',
    '--lang=en-US,en',
    // '--accept-lang=en-US',
    '--disable-blink-features=AutomationControlled',
  ]

  const userAgentFile = path.join(process.cwd(), 'webdriver', 'user-agent.txt')
  if (!fs.existsSync(userAgentFile)) {
      throw `${userAgentFile} not found`
  }
  let userAgent = fs.readFileSync(userAgentFile).toString().trim()
  args.push(`--user-agent=${userAgent}`)

  const options = new ch.Options()

  options
    // .windowSize(randomWindowSize())
    .addArguments(...args)
    .excludeSwitches('enable-automation')
    .set('useAutomationExtension', false)

  if (extensions.length > 0) {
    options.addExtensions(...extensions)
  }

  if (config.headless == true) {
    options.headless()
  }

  const capabilities = Capabilities.chrome()
  if (config.performanceLogging == true) {
    const loggingPrefs = new logging.Preferences()
    loggingPrefs.setLevel(logging.Type.PERFORMANCE, logging.Level.ALL)
    capabilities.setLoggingPrefs(loggingPrefs)
  }

  const webDriver = new Builder()
    .forBrowser('chrome')
    .setChromeService(new ch.ServiceBuilder(chromeDriverExe))
    .setChromeOptions(options)
    .withCapabilities(capabilities)
    .build()

  return {
    webDriver,
    webDriverCleanup: () => {
      for (const p of cleanupPaths) {
        if (fs.existsSync(p)) {
          const stat = fs.statSync(p)
          if (stat.isDirectory()) {
            fs.rmSync(p, { recursive: true })
          } else if (stat.isFile()) {
            fs.rmSync(p)
          }
        }
      }
    }
  }
}

export async function makeChromeDriver(
  anticaptchaApiKey: string,
  proxyHost: string,
  proxyPort: string,
  proxyUser: string,
  proxyPassword: string,
  userAgent: string,
  userDataDir: string = '',
  enableProxyExtension: boolean = true,
  enableAnticaptchaExtension: boolean = true,
  enableMetamaskExtension: boolean = false
): Promise<{ webDriver: WebDriver, webDriverCleanup: () => void }> {
  const proxy: e.ProxyConfig = {
    host: proxyHost,
    port: proxyPort,
    user: proxyUser,
    password: proxyPassword
  }
  return makeChromeDriverWithConfig({
    proxy: enableProxyExtension ? proxy : undefined,
    userAgent,
    userDataDirName: path.parse(userDataDir).name,
    metamask: enableMetamaskExtension,
    rucaptcha: enableAnticaptchaExtension  // rucaptcha by default
      ? {apiKey: anticaptchaApiKey, proxy: enableProxyExtension ? proxy : undefined}
      : undefined
  })
}

type WindowSize = { width: number, height: number }
const windowSizes: WindowSize[] = [
  {width: 1920, height: 1080},
  {width: 1920, height: 1080},
  {width: 1920, height: 1080},
  {width: 1920, height: 1080},
  {width: 1440, height: 1080},
  {width: 1440, height: 1080},
  {width: 1200, height: 1100}
]

function randomWindowSize(): WindowSize {
  return windowSizes[Math.floor(Math.random() * windowSizes.length)]
}
