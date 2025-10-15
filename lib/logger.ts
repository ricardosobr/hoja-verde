/**
 * Production-ready logging utility
 * Replaces console.log statements with structured logging that can be disabled in production
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  component?: string
  userId?: string
  sessionId?: string
  timestamp?: string
  [key: string]: any
}

class Logger {
  private level: LogLevel
  private isProduction: boolean

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
    this.level = this.isProduction ? LogLevel.ERROR : LogLevel.DEBUG
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return

    const timestamp = new Date().toISOString()
    const logEntry = {
      level: LogLevel[level],
      timestamp,
      message,
      ...context,
    }

    // In production, we might send to external logging service
    if (this.isProduction) {
      // For now, only log errors and warnings in production
      if (level >= LogLevel.WARN) {
        console.error(JSON.stringify(logEntry))
      }
    } else {
      // Development logging with colors and better formatting
      const colorMap = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
      }
      const reset = '\x1b[0m'
      const color = colorMap[level] || ''

      console.log(`${color}[${timestamp}] ${LogLevel[level]}: ${message}${reset}`, context || '')
    }
  }

  debug(message: string, context?: LogContext): void {
    this.formatMessage(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: LogContext): void {
    this.formatMessage(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.formatMessage(LogLevel.WARN, message, context)
  }

  error(message: string, context?: LogContext): void {
    this.formatMessage(LogLevel.ERROR, message, context)
  }

  // Specialized logging methods for dashboard
  dashboardUpdate(action: string, payload?: any): void {
    this.debug(`Dashboard update: ${action}`, {
      component: 'dashboard',
      action,
      payloadSize: payload ? JSON.stringify(payload).length : 0,
    })
  }

  realtimeEvent(table: string, event: string, recordId?: string): void {
    this.debug(`Realtime event: ${event} on ${table}`, {
      component: 'realtime',
      table,
      event,
      recordId,
    })
  }

  queryPerformance(query: string, duration: number, recordCount?: number): void {
    if (duration > 1000) { // Log slow queries
      this.warn(`Slow query detected: ${query}`, {
        component: 'database',
        duration,
        recordCount,
      })
    } else {
      this.debug(`Query executed: ${query}`, {
        component: 'database',
        duration,
        recordCount,
      })
    }
  }

  chartRender(chartType: string, dataPoints: number, renderTime?: number): void {
    this.debug(`Chart rendered: ${chartType}`, {
      component: 'chart',
      chartType,
      dataPoints,
      renderTime,
    })
  }
}

// Create singleton instance
export const logger = new Logger()

// Export convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, context?: LogContext) => logger.error(message, context),
  dashboardUpdate: (action: string, payload?: any) => logger.dashboardUpdate(action, payload),
  realtimeEvent: (table: string, event: string, recordId?: string) => logger.realtimeEvent(table, event, recordId),
  queryPerformance: (query: string, duration: number, recordCount?: number) => logger.queryPerformance(query, duration, recordCount),
  chartRender: (chartType: string, dataPoints: number, renderTime?: number) => logger.chartRender(chartType, dataPoints, renderTime),
}