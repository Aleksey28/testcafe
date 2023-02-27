import { GeneralError } from '../errors/runtime';
import { RUNTIME_ERRORS } from '../errors/types';

const lazyRequire      = require('import-lazy')(require);
const endpointUtils    = lazyRequire('endpoint-utils');

async function getValidPort (port?: number): Promise<number> {
    if (port) {
        const isFree = await endpointUtils.isFreePort(port);

        if (!isFree)
            throw new GeneralError(RUNTIME_ERRORS.portIsNotFree, port);
    }
    else
        port = await endpointUtils.getFreePort() as number;

    return port;
}

export default getValidPort;
