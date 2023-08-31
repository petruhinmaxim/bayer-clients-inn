import * as path from 'path'
import * as fs from 'fs'
import pinoLogger, { Logger as PinoLogger } from 'pino'
import pinoPretty from 'pino-pretty'

const logDir = path.join(process.cwd(), 'log')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}
const logFileName = `${new Date().toISOString().split(':').join("-").split('.')[0]}.log`
const logFile = path.join(logDir, logFileName)

const logger =
  (config: LoggerConfig) =>
    pinoLogger(
      {
        ...config,
        level: config.level ?? 'debug',
        formatters: {
          level: (label) => {
            return { level: label };
          }
        },
        timestamp: pinoLogger.stdTimeFunctions.isoTime
      },
      pinoLogger.multistream([
        { level: 'debug', stream: pinoLogger.destination({ dest: logFile, append: true, sync: true}) },
        { level: 'debug', stream: pinoPretty({ sync: true }) }
      ])
    )

export type LoggerConfig = {
  name: string,
  level?: LoggerLevel
}

export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error'

export { logger as default, logger };
export type Logger = PinoLogger

// back compatibility

export function consoleLogger(): Logger {
  return logger({ name: 'main', level: 'debug'})
}

export function consoleAndFileLogger(name: string = 'main'): Logger {
  return logger({ name, level: 'debug'})
}
