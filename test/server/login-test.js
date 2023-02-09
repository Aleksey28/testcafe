const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon      = require('sinon');
const request    = require('request');


const REQUEST_ACCESS_PARAM = 'testcafeAccess';
const DEFAULT_HASH_VALUE   = 'hash';

let savedOptions = null;

const createAuthorizationMock = (hash = DEFAULT_HASH_VALUE) => {
    const configStorageMock = {
        options: {},
        load:    () => savedOptions,

        save: () => {
            savedOptions = configStorageMock.options;
        },
    };

    const authorization = proxyquire('../../lib/authorization', {
        '../authorization/storage': function () {
            return configStorageMock;
        },
    });

    sinon.stub(authorization, 'openAuthPage').callsFake(() => {
        return request(authorization.server.getUrl(`?${REQUEST_ACCESS_PARAM}=${hash}`));
    });

    sinon.stub(authorization, 'createHash').callsFake(() => {
        return DEFAULT_HASH_VALUE;
    });

    return authorization;
};


describe('Authorization', function () {
    let authorization = null;

    beforeEach(() => {
        authorization = createAuthorizationMock();
    });

    afterEach(() => {
        savedOptions = null;

        sinon.restore();
    });

    describe('Storage', function () {
        it('Should save authorization hash to storage', async () => {
            await authorization.login();

            expect(savedOptions.authorizationHash).equal(DEFAULT_HASH_VALUE);
        });

        it('Should save skip authorization flag to storage', async () => {
            await authorization.skip();

            expect(savedOptions.skipAuthorization).ok;
        });
    });

    describe('Login', function () {
        it('Should be authorized if access param is correct', async function () {
            await authorization.login();

            expect(await authorization.isAuthorized()).ok;
        });

        it('Should set hash if authorization was success', async function () {
            await authorization.login();

            expect(authorization.hash).equal(DEFAULT_HASH_VALUE);
        });

        it('Should not be authorized if access param is not correct', async function () {
            authorization = createAuthorizationMock('incorrectHash');

            await authorization.login();

            expect(await authorization.isAuthorized()).not.ok;
        });

        it('Should be authorized if authorization was skipped before', async function () {
            await authorization.skip();

            expect(await authorization.isAuthorized()).ok;
        });
    });
});
