import http from 'http';
import path from 'path';
import open from 'open';
import { createHash } from 'crypto';
import Server from './server';
import { readFile } from '../utils/promisified-functions';
import Mustache from 'mustache';
import AuthorizationStorage from './storage';


const AUTH_URL              = 'https://www.devexpress.com/MyAccount/LogIn/';
const AUTH_RETURN_URL       = 'returnUrl';
const REQUEST_ACCESS_PARAM  = 'testcafeAccess';
const RESPONSE_FILE_RESOLVE = 'resolve-response.html.mustache';
const RESPONSE_FILE_REJECT  = 'reject-response.html.mustache';

const authorizationStorage  = new AuthorizationStorage();

class Authorization {
    private _expectedHash: string;
    private _hash: string;
    private loginResolver?: Function;

    constructor () {
        this._expectedHash = '';
        this._hash = '';
    }

    get hash (): string {
        return this._hash;
    }

    async isAuthorized (): Promise<boolean> {
        const storageExists = await authorizationStorage.load();

        return storageExists && !!authorizationStorage.options.authorizationHash;
    }

    async skip (): Promise<void> {
        authorizationStorage.options.skipAuthorization = true;

        await authorizationStorage.save();
    }

    async login (): Promise<void> {
        this._expectedHash = this.createHash();

        const server      = await Server.createServer(this.handleServerRequest.bind(this));
        const loginWaiter = new Promise<string>(resolve => {
            this.loginResolver = resolve;
        });

        await server.open();
        open(this.getAuthPageUrl(server));

        await loginWaiter;

        await this.authorize();
        server.close();
    }

    private createHash (): string {
        return createHash('sha256').digest('hex').toString();
    }

    private getAuthPageUrl (server: Server): string {
        const returnUrl = server.getUrl(`?${REQUEST_ACCESS_PARAM}=${this._expectedHash}`);

        return `${AUTH_URL}?${AUTH_RETURN_URL}=${returnUrl}`;
    }

    private async handleServerRequest (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        if (!req.url)
            return;

        if (this.isAccess(req.url, req.headers.host)) {
            this._hash = this.getAccessParam(req.url, req.headers.host);
            await this.setResponse(res, 200, RESPONSE_FILE_RESOLVE);
        }
        else
            await this.setResponse(res, 403, RESPONSE_FILE_REJECT);

        this.loginResolver?.();
    }

    private isAccess (url: string, base?: string): boolean {
        const access = this.getAccessParam(url, base);

        return access === this._expectedHash;
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

        return Mustache.render(pageTemplate.toString(), {}) as string;
    }

    private async authorize (): Promise<void> {
        authorizationStorage.options.authorizationHash = this.hash;

        await authorizationStorage.save();
    }
}

export default new Authorization();
