const { expect }           = require('chai');
const sinon                = require('sinon');
const request              = require('request');
const { SafeStorage }      = require('testcafe-safe-storage');


const REQUEST_ACCESS_PARAM = 'testcafeAccess';
const DEFAULT_HASH_VALUE   = 'hash';

let savedOptions = null;

const createAuthorizationMock = (hash = DEFAULT_HASH_VALUE) => {
    const path = '../../lib/authorization';

    delete require.cache[require.resolve(path)];

    const authorization = require(path);

    sinon.stub(authorization, 'openLoginPage').callsFake(() => {
        return request(authorization.server.getUrl(`?${REQUEST_ACCESS_PARAM}=${hash}`));
    });

    sinon.stub(authorization, 'createHash').callsFake(() => {
        return DEFAULT_HASH_VALUE;
    });

    return authorization;
};

function stubSafeStorage () {
    sinon.stub(SafeStorage.prototype, 'tryLoad').callsFake(() => {
        return savedOptions;
    });

    sinon.stub(SafeStorage.prototype, 'save').callsFake((options) => {
        savedOptions = options;
    });
}

describe('Authorization', function () {
    let mockedAuthorization = null;

    beforeEach(() => {
        stubSafeStorage();
        mockedAuthorization = createAuthorizationMock();
    });

    afterEach(() => {
        savedOptions = null;

        sinon.restore();
    });

    describe('Storage', function () {
        it('Should save authorization hash to storage', async () => {
            await mockedAuthorization.login();

            expect(savedOptions.authorizationHash).equal(DEFAULT_HASH_VALUE);
        });

        it('Should save skip authorization flag to storage', async () => {
            await mockedAuthorization.skip();

            expect(savedOptions.skipAuthorization).ok;
        });
    });

    describe('Login', function () {
        it('Should be authorized if access param is correct', async function () {
            await mockedAuthorization.login();

            expect(await mockedAuthorization.isAuthorized()).ok;
        });

        it('Should set hash if authorization was success', async function () {
            await mockedAuthorization.login();

            expect(mockedAuthorization.hash).equal(DEFAULT_HASH_VALUE);
        });

        it('Should not be authorized if access param is not correct', async function () {
            mockedAuthorization = createAuthorizationMock('incorrectHash');

            await mockedAuthorization.login();

            expect(await mockedAuthorization.isAuthorized()).not.ok;
        });

        it('Should be skipped if authorization was skipped before', async function () {
            await mockedAuthorization.skip();

            expect(await mockedAuthorization.isSkipped()).ok;
        });

        it('Should check if need authorize', async function () {
            expect(await mockedAuthorization.needAuthorize()).ok;
        });

        it('Should check if need authorize if skipped before', async function () {
            await mockedAuthorization.skip();

            expect(await mockedAuthorization.needAuthorize()).ok;
        });
    });
});
