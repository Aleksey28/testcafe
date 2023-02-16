import http from 'http';
import path from 'path';
import open from 'open';
import { createHash } from 'crypto';
import Server from './server';
import { readFile } from '../utils/promisified-functions';
import Mustache from 'mustache';
import AuthorizationStorage from './storage';
import log from '../cli/log';
import isCI from 'is-ci';
import isDocker from 'is-docker';
import isPodman from 'is-podman';
import {
    AUTHORIZATION_COMPLETED,
    AUTHORIZATION_DENIED,
    AUTHORIZATION_REQUEST,
} from './messages';


const LOGIN_URL                 = 'https://www.devexpress.com/MyAccount/LogIn/';
const AUTH_RETURN_URL           = 'returnUrl';
const REQUEST_ACCESS_PARAM      = 'testcafeAccess';
const RESPONSE_FILE_RESOLVE     = 'resolve-response.html.mustache';
const RESPONSE_FILE_REJECT      = 'reject-response.html.mustache';
const RESULT_PAGE_CLOSE_TIMEOUT = 1000;

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

    private async authorize (): Promise<void> {
        if (!this.isAccessed()) {
            log.write(AUTHORIZATION_DENIED);
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
            await this.setResponse(res, 200, RESPONSE_FILE_RESOLVE);
        else
            await this.setResponse(res, 403, RESPONSE_FILE_REJECT);

        this.loginResolver?.();
    }

    private isAccessed (): boolean {
        return this._hash === this._expectedHash;
    }

    private getAccessParam (url: string, base?: string): string {
        const requestedUrl = new URL(url, base ? `http://${base}` : '');

        return requestedUrl.searchParams.get(REQUEST_ACCESS_PARAM) || '';
    }

    private async setResponse (res: http.ServerResponse, statusCode: number, pageFileName: string): Promise<void> {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'text/html');
        res.write(await this.getResponseBody(pageFileName));
        res.end();
    }

    private async getResponseBody (pageFileName: string): Promise<string> {
        const pagePath     = path.resolve(__dirname, pageFileName);
        const pageTemplate = await readFile(pagePath);

        return Mustache.render(pageTemplate.toString(), {
            closeTimeout: RESULT_PAGE_CLOSE_TIMEOUT,
        }) as string;
    }

    async needAuthorize (): Promise<boolean> {
        const isAuthorized = await this.isAuthorized();

        return !isAuthorized && !isCI && !isDocker() && !isPodman();
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
