import { SafeStorage } from 'testcafe-safe-storage';

interface AuthorizationOptions {
    authorizationHash?: string;
    skipAuthorization?: boolean;
}

const DEFAULT_AUTHORIZATION_OPTIONS: AuthorizationOptions = {
    authorizationHash: '',
    skipAuthorization: false,
};

export default class AuthorizationStorage {
    public options: AuthorizationOptions;
    private isLoaded: boolean;
    private _storage: SafeStorage<AuthorizationOptions>;

    public constructor () {
        this.options  = {};
        this._storage = new SafeStorage<AuthorizationOptions>();
        this.isLoaded = false;
    }

    public async load (): Promise<boolean> {
        const result        = await this._storage.tryLoad<AuthorizationOptions>();
        const storageExists = result !== void 0;

        this.options = Object.assign(result || { ...DEFAULT_AUTHORIZATION_OPTIONS }, this.options);

        this.isLoaded = true;

        return storageExists;
    }

    public async save (): Promise<void> {
        if (!this.isLoaded)
            await this.load();

        await this._storage.save(this.options);
    }
}
