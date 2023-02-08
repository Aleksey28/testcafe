
import http from 'http';
import getValidPort from '../utils/get-valid-port';

type ServerCallBack = (req: http.IncomingMessage, res: http.ServerResponse) => void;

class Server {
    private readonly server: http.Server;
    private readonly port: number;
    private readonly host: string;

    constructor (port: number, host: string, cb: ServerCallBack) {
        this.port   = port;
        this.host   = host;
        this.server = http.createServer(cb);
    }

    static async createServer (cb: ServerCallBack): Promise<Server> {
        const port = await getValidPort();
        const host = 'localhost';

        return new Server(port, host, cb);
    }

    async open (): Promise<void> {
        return new Promise<void>(resolve => {
            this.server.listen(this.port, this.host, resolve);
        });
    }

    close (): void {
        this.server.close();
    }

    getUrl (path: string): string {
        return `http://${this.host}:${this.port}/${path}`;
    }
}

export default Server;
