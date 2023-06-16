/* eslint-disable */
const { exec } = require('child_process');
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
        this.childProcess = exec(`open -a /Applications/Safari.app ${url}`, (...args) => DEBUG(args));

        this.childProcess.addListener('close', () => {
          console.log('Safari closed');
        })
        this.childProcess.addListener('error', () => {
          console.log('Safari errored');
        })
        this.childProcess.addListener('disconnect', () => {
          console.log('Safari disconnected');
        })
        this.childProcess.addListener('exit', () => {
          console.log('Safari exit');
        })

        return Promise.resolve();
    }

    stopBrowser (browser) {
        console.log(`${new Date()} -> file: safari-connector.js:24 -> SafariConnector -> stopBrowser -> browser:`, browser);
        console.log(`${new Date()} -> file: safari-connector.js:26 -> SafariConnector -> stopBrowser -> this.childProcess.connected:`, this.childProcess.connected);
        this.childProcess.kill('SIGINT');
        return Promise.resolve();
    }

    disconnect () {
        return Promise.resolve();
    }
};
