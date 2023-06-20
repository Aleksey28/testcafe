const { spawn } = require('child_process');
const debug    = require('debug');


const DEBUG = debug('testcafe:test:functional:safari-connector');

module.exports = class SafariConnector {
    connect () {
        return Promise.resolve();
    }

    waitForFreeMachines () {
        return Promise.resolve();
    }

    startBrowser (settings, url) {
        const lsProcess = spawn(`open -a /Applications/Safari.app ${url}`);

        /* eslint-disable */
        lsProcess.stdout.on('data', data => {
            console.log(`stdout:\n${data}`);
        });
        lsProcess.stderr.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        lsProcess.on('exit', code => {
            DEBUG(code);
            console.log(`Process ended with ${code}`);
        });

        return Promise.resolve();
    }

    stopBrowser () {
        return Promise.resolve();
    }

    disconnect () {
        return Promise.resolve();
    }
};
