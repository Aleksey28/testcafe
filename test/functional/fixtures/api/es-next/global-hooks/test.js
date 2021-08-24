const path           = require('path');
const createTestCafe = require('../../../../../../lib');
const config         = require('../../../../config');
const { expect }     = require('chai');

let testCafe = null;

const runTests = (testName) => {
    if (!testCafe)
        throw new Error('"testCafe" isn\'t defined');

    const runner = testCafe.createRunner();

    return runner
        .filter(test => {
            return testName ? test === testName : true;
        })
        .run();
};

describe('[API] fixture global before/after hooks', () => {
    before(async () => {
        testCafe = await createTestCafe({ configFile: path.resolve('./test/functional/fixtures/api/es-next/global-hooks/data/fixture-config.js') });
    });

    after(function () {
        testCafe.close();
    });

    beforeEach(() => {
        global.fixtureBefore = 0;
        global.fixtureAfter  = 0;
    });

    afterEach(() => {
        delete global.fixtureBefore;
        delete global.fixtureAfter;
    });

    it('Should run hooks for all fixture', async () => {
        return runTests('Test1');
    });

    it('Should run all hooks for fixture', async () => {
        return runTests('Test2');
    });

    it('Should run hooks in the right order', async () => {
        return runTests('Test3');
    });
});

describe('[API] test global before/after hooks', () => {
    beforeEach(async () => {
        testCafe = await createTestCafe({ configFile: path.resolve('./test/functional/fixtures/api/es-next/global-hooks/data/test-config.js') });
    });

    afterEach(function () {
        testCafe.close();
    });

    it('Should run global hooks for all tests', () => {
        return runTests('Test1');
    });

    it('Should run all hooks in the right order', () => {
        return runTests('Test2');
    });
});

describe('[API] testRun global before/after hooks', () => {

    afterEach(function () {
        testCafe.close();
    });

    it('Should run hooks for all tests', async () => {
        testCafe = await createTestCafe({ configFile: path.resolve('./test/functional/fixtures/api/es-next/global-hooks/data/test-run-config.js') });
        await runTests('');
    });

    it('Should fail all tests in fixture if testRun.before hooks fails', async () => {
        return global.runTests('./testcafe-fixtures/test-run-test.js', null, {
            shouldFail: true,
            only:       'chrome, firefox',
            hooks:      {
                testRun: {
                    before: async () => {
                        throw new Error('$$before$$');
                    },
                },
            },
        }).catch(errs => {
            const allErrors = config.currentEnvironment.browsers.length ===
            1 ? errs : errs['chrome'].concat(errs['firefox']);

            expect(allErrors.length).eql(config.currentEnvironment.browsers.length * 3);

            allErrors.forEach(err => {
                expect(err).contains('Error in testRun.before hook');
                expect(err).contains('$$before$$');
            });
        });
    });
});
