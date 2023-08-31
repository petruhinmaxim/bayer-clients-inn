import * as fs from 'fs'
import * as path from 'path'
import JSZip from 'jszip'

function visitFile(basePath: string, filePath: string, fn: (fp: string) => void) {
  const absFilePath = filePath == '' ? basePath : `${basePath}${path.sep}${filePath}`
  if (fs.lstatSync(absFilePath).isDirectory()) {
    fs.readdirSync(absFilePath).forEach(f => {
      const nextFP = filePath == '' ? f : `${filePath}${path.sep}${f}`
      visitFile(basePath, nextFP, fn)
    })
  } else if (fs.lstatSync(absFilePath).isFile()) {
    fn(filePath)
  }
}

// Proxy

export type ProxyConfig = {
  host: string,
  port: string,
  user: string,
  password: string
}

export async function makeProxyExtension(
  config: ProxyConfig,
  destinationPath: string
) {
  const zip = new JSZip()

  const proxySrcPath = `${__dirname}${path.sep}proxy`
  visitFile(proxySrcPath, '', (filePath) => {
    if (filePath.indexOf('background.js') != -1) {
      let backgroundJsContents = fs
        .readFileSync(`${proxySrcPath}${path.sep}${filePath}`)
        .toString()
      backgroundJsContents = backgroundJsContents
        .replace(/VTFARMER_CHROME_PROXY_HOST/g, config.host)
        .replace(/VTFARMER_CHROME_PROXY_PORT/g, config.port)
        .replace(/VTFARMER_CHROME_PROXY_USER/g, config.user)
        .replace(/VTFARMER_CHROME_PROXY_PASSWORD/g, config.password)
      zipFile(zip, filePath, backgroundJsContents)
    } else {
      let contents = fs
        .readFileSync(`${proxySrcPath}${path.sep}${filePath}`)
        .toString()
      zipFile(zip, filePath, contents)
    }
  })

  if (fs.existsSync(destinationPath)) {
   fs.unlinkSync(destinationPath)
  }
  const proxyZipPromise = new Promise<void>((resolve, reject) => {
   zip.generateNodeStream({type:'nodebuffer',streamFiles:true})
     .pipe(fs.createWriteStream(destinationPath))
     .on('error', reject)
     .on('finish', resolve)
  })
  await proxyZipPromise
}

// Anticaptcha

export type AnticaptchaConfig = {
  apiKey: string
  proxy?: ProxyConfig
}

export async function makeAnticaptchaExtension(
  config: AnticaptchaConfig,
  destinationPath: string
) {

  let proxyEnabled = false
  let proxyHost = ''
  let proxyPort = ''
  let proxyUser = ''
  let proxyPassword = ''

  if (config.proxy != null) {
    proxyEnabled = true
    proxyHost = config.proxy.host
    proxyPort = config.proxy.port
    proxyUser = config.proxy.user
    proxyPassword = config.proxy.password
  }

  const zip = new JSZip()

  const acSrcPath = `${__dirname}${path.sep}anticaptcha`
  visitFile(acSrcPath, '', (filePath) => {
    if (filePath.indexOf('config_ac_api_key.js') != -1) {
      let contents = fs
        .readFileSync(`${acSrcPath}${path.sep}${filePath}`)
        .toString()
      contents = contents
        .replace(/VTFARMER_ANTICAPTCHA_API_KEY/g, config.apiKey)
        .replace(/VTFARMER_ANDICAPTCHA_PROXY_ENABLED/g, `${proxyEnabled}`)
        .replace(/VTFARMER_ANDICAPTCHA_PROXY_HOST/g, proxyHost)
        .replace(/VTFARMER_ANDICAPTCHA_PROXY_PORT/g, proxyPort)
        .replace(/VTFARMER_ANDICAPTCHA_PROXY_USER/g, proxyUser)
        .replace(/VTFARMER_ANDICAPTCHA_PROXY_PASSWORD/g, proxyPassword)
      zipFile(zip, filePath, contents)
    } else {
      const contents = fs
        .readFileSync(`${acSrcPath}${path.sep}${filePath}`)
        .toString()
      zipFile(zip, filePath, contents)
    }
  })

  if (fs.existsSync(destinationPath)) {
    fs.rmSync(destinationPath)
  }
  const extensionZipPromise = new Promise<void>((resolve, reject) => {
    zip.generateNodeStream({type:'nodebuffer',streamFiles:true})
      .pipe(fs.createWriteStream(destinationPath))
      .on('error', reject)
      .on('finish', resolve)
  })
  await extensionZipPromise
}

// Rucaptcha

export type RucaptchaConfig = {
  apiKey: string
  proxy?: ProxyConfig
}

export async function makeRucaptchaExtension(
  config: RucaptchaConfig,
  destinationPath: string
) {

  let proxyEnabled = false
  let proxyHost = ''
  let proxyPort = ''
  let proxyUser = ''
  let proxyPassword = ''

  if (config.proxy != null) {
    proxyEnabled = true
    proxyHost = config.proxy.host
    proxyPort = config.proxy.port
    proxyUser = config.proxy.user
    proxyPassword = config.proxy.password
  }

  const zip = new JSZip()

  const acSrcPath = `${__dirname}${path.sep}rucaptcha`
  visitFile(acSrcPath, '', (filePath) => {
    if (filePath.indexOf('config.js') != -1) {
      let contents = fs
        .readFileSync(`${acSrcPath}${path.sep}${filePath}`)
        .toString()

      const proxy = proxyEnabled
        ? `${proxyUser}:${proxyPassword}@${proxyHost}:${proxyPort}`
        : ''

      contents = contents
        .replace(/VTFARMER_RUCAPTCHA_API_KEY/g, config.apiKey)
        .replace(/VTFARMER_RUCAPTCHA_PROXY_ENABLED/g, `${proxyEnabled}`)
        .replace(/VTFARMER_RUCAPTCHA_PROXY/g, proxy)
      zipFile(zip, filePath, contents)
    } else {
      const contents = fs
        .readFileSync(`${acSrcPath}${path.sep}${filePath}`)
        .toString()
      zipFile(zip, filePath, contents)
    }
  })

  if (fs.existsSync(destinationPath)) {
    fs.unlinkSync(destinationPath)
  }
  const extensionZipPromise = new Promise<void>((resolve, reject) => {
    zip.generateNodeStream({type:'nodebuffer',streamFiles:true})
      .pipe(fs.createWriteStream(destinationPath))
      .on('error', reject)
      .on('finish', resolve)
  })
  await extensionZipPromise
}

export async function makeAdBlockExtension(
  destinationPath: string
) {
  fs.copyFileSync(
    path.join(__dirname, 'extensions', 'adblock.zip'),
    destinationPath
  )
}


function zipFile(zip: JSZip, filePath: string, contents: string) {
  zip.file(filePath.replace(/\\/g, '/'), contents)
}