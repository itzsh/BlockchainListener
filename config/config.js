var config = {
    appConfig: {
        appenders: [{
                type: 'console',
                category: 'console'
            },
            {
                type: 'file',
                filename: './log/app.log',
                category: 'appLogs'
            }
        ],
        "replaceConsole": true,
        "levels": {
            "appLogs": "error",
            "console": "debug"
        }
    },
    apiConfig: {
        appenders: [{
                type: 'console',
                category: 'console'
            },
            {
                type: 'file',
                filename: './log/callapi.log',
                category: 'apiLogs'
            }
        ],
        "replaceConsole": true,
        "levels": {
            "apiLogs": "error",
            "console": "debug"
        }
    },
    wsConfig: {
        port: 8080
    }
}

module.exports = config;