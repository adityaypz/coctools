/**
 * Simple logger for scraper operations
 */

export enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    SUCCESS = "SUCCESS",
}

export class Logger {
    private logs: Array<{ level: LogLevel; message: string; timestamp: Date }> = [];

    log(level: LogLevel, message: string) {
        const entry = {
            level,
            message,
            timestamp: new Date(),
        };
        this.logs.push(entry);

        const emoji = {
            [LogLevel.INFO]: "ℹ️",
            [LogLevel.WARN]: "⚠️",
            [LogLevel.ERROR]: "❌",
            [LogLevel.SUCCESS]: "✅",
        };

        console.log(`${emoji[level]} [${level}] ${message}`);
    }

    info(message: string) {
        this.log(LogLevel.INFO, message);
    }

    warn(message: string) {
        this.log(LogLevel.WARN, message);
    }

    error(message: string) {
        this.log(LogLevel.ERROR, message);
    }

    success(message: string) {
        this.log(LogLevel.SUCCESS, message);
    }

    getLogs() {
        return this.logs;
    }

    getSummary() {
        return {
            total: this.logs.length,
            errors: this.logs.filter(l => l.level === LogLevel.ERROR).length,
            warnings: this.logs.filter(l => l.level === LogLevel.WARN).length,
            successes: this.logs.filter(l => l.level === LogLevel.SUCCESS).length,
        };
    }
}
