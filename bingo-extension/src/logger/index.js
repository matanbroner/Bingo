const config = require("../assets/config");
const util = require('util');

class Logger {
    constructor(options) {
        this.level = options.level || 'info';
    }

    _colorLevel(level) {
        switch (level) {
            case 'info':
                return '\x1b[36m'; // cyan
            case 'warn':
                return '\x1b[33m'; // yellow
            case 'debug':
                return '\x1b[32m'; // green
            case 'error':
                return '\x1b[31m'; // red
            default:
                return '';
        }
    }

    _log(level, message) {
        if(level === 'debug' && this.level !== 'debug') {
            return;
        }

        var coloredLevel = util.format('%s[%s]\x1b[0m', this._colorLevel(level), level);
        var output = util.format('[%s] %s: %s', new Date().toISOString(), coloredLevel, message);

        console.log(output)
    }

    info(message) {
        this._log('info', message);
    }

    warn(message) {
        this._log('warn', message);
    }

    error(message) {
        this._log('error', message);
    }

    debug(message) {
        this._log('debug', message);
    }

    log(message) {
        this._log(this.level, message);
    }
}

export default new Logger({ level: 'debug' });