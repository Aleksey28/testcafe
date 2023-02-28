import http from 'http';
import open from 'open';
import { createHash } from 'crypto';
import Server from './server';
import AuthorizationStorage from './storage';
import log from '../cli/log';
import isCI from 'is-ci';
import isDocker from 'is-docker';
import isPodman from 'is-podman';
import {
    AUTHORIZATION_COMPLETED,
    AUTHORIZATION_FAILED,
    AUTHORIZATION_REQUEST,
} from './messages';
import checkIsVM from '../utils/check-is-vm';


const LOGIN_URL            = 'https://www.devexpress.com/MyAccount/LogIn/';
const AUTH_RETURN_URL      = 'returnUrl';
const REQUEST_ACCESS_PARAM = 'testcafeAccess';
const RESPONSE_URL_RESOLVE = 'https://alexkamaev.github.io/authorization/complete';
const RESPONSE_URL_REJECT  = 'https://alexkamaev.github.io/authorization/error';

const authorizationStorage  = new AuthorizationStorage();

class Authorization {
    private _expectedHash: string;
    private _hash: string;
    private loginResolver?: Function;
    private server?: Server;
    private _isAuthorized: boolean;
    private _isSkipped: boolean;

    constructor () {
        this._expectedHash = '';
        this._hash = '';
        this._isAuthorized = false;
        this._isSkipped = false;
    }

    get hash (): string {
        return this._hash;
    }

    async isAuthorized (): Promise<boolean> {
        if (this._isAuthorized)
            return true;

        const storageExists = await authorizationStorage.load();

        this._isAuthorized = storageExists && !!authorizationStorage.options.authorizationHash;

        return this._isAuthorized;
    }

    async isSkipped (): Promise<boolean> {
        if (this._isSkipped)
            return true;

        const storageExists = await authorizationStorage.load();

        this._isSkipped = storageExists && !!authorizationStorage.options.skipAuthorization;

        return this._isSkipped;
    }

    async skip (): Promise<void> {
        this._isSkipped = true;

        authorizationStorage.options.skipAuthorization = true;

        await authorizationStorage.save();
    }

    async login (): Promise<void> {
        this._expectedHash = this.createHash();
        this.server        = await Server.createServer(this.handleServerRequest.bind(this));

        const loginWaiter = new Promise<string>(resolve => {
            this.loginResolver = resolve;
        });

        await this.server.open();
        this.openLoginPage();

        await loginWaiter;

        await this.authorize();
        this.server.close();
    }

    async logout (): Promise<void> {
        await authorizationStorage.clear();
    }

    private async authorize (): Promise<void> {
        if (!this.isAccessed()) {
            log.write(AUTHORIZATION_FAILED);
            return;
        }

        this._isAuthorized = true;

        authorizationStorage.options.authorizationHash = this.hash;

        await authorizationStorage.save();

        log.write(AUTHORIZATION_COMPLETED);
    }

    private createHash (): string {
        return createHash('sha256').digest('hex').toString();
    }

    private openLoginPage (): void {
        open(this.getLoginPageUrl());
    }

    private getLoginPageUrl (): string {
        const returnUrl = this.server?.getUrl(`?${REQUEST_ACCESS_PARAM}=${this._expectedHash}`);

        return `${LOGIN_URL}?${AUTH_RETURN_URL}=${returnUrl}`;
    }

    private async handleServerRequest (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        if (!req.url)
            return;

        this._hash = this.getAccessParam(req.url, req.headers.host);

        if (this.isAccessed())
            await this.setResponse(res, RESPONSE_URL_RESOLVE);
        else
            await this.setResponse(res, RESPONSE_URL_REJECT);

        (this.loginResolver as Function)();
    }

    private isAccessed (): boolean {
        return this._hash === this._expectedHash;
    }

    private getAccessParam (url: string, base?: string): string {
        const requestedUrl = new URL(url, base ? `http://${base}` : '');

        return requestedUrl.searchParams.get(REQUEST_ACCESS_PARAM) || '';
    }

    private async setResponse (res: http.ServerResponse, url: string): Promise<void> {
        res.statusCode = 301;
        res.setHeader('Location', url);
        res.end();
    }

    async needAuthorize (): Promise<boolean> {
        const isAuthorized = await this.isAuthorized();

        return !isCI && !checkIsVM() && !isDocker() && !isPodman() && !isAuthorized;
    }

    async askAuthorization (): Promise<{authorize: boolean}> {
        return await log.prompt({
            type:    'confirm',
            name:    'authorize',
            message: AUTHORIZATION_REQUEST,
            initial: true,
        }) as {authorize: boolean};
    }
}

export default new Authorization();
