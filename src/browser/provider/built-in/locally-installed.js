import browserTools from 'testcafe-browser-tools';

export default {
    isMultiBrowser: true,

    /* eslint-disable */
    async openBrowser (browserId, pageUrl, browserName) {
        const args  = browserName.split(' ');
        const alias = args.shift();

        console.log(`${new Date()} -> file: locally-installed.js:12 -> openBrowser -> alias:`, alias);
        const browserInfo    = await browserTools.getBrowserInfo(alias);
        console.log(`${new Date()} -> file: locally-installed.js:13 -> openBrowser -> browserInfo:`, browserInfo);
        const openParameters = Object.assign({}, browserInfo);

        if (args.length)
            openParameters.cmd = args.join(' ') + (openParameters.cmd ? ' ' + openParameters.cmd : '');

        console.log(`${new Date()} -> file: locally-installed.js:7 -> openBrowser -> pageUrl:`, pageUrl);
        console.trace();
        await browserTools.open(openParameters, pageUrl);
    },

    async isLocalBrowser () {
        return true;
    },

    async getBrowserList () {
        const installations = await browserTools.getInstallations();

        return Object.keys(installations);
    },

    async isValidBrowserName (browserName) {
        const browserNames = await this.getBrowserList();

        browserName = browserName.toLowerCase().split(' ')[0];

        return browserNames.indexOf(browserName) > -1;
    },
};
