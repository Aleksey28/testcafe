import { GeneralError } from '../errors/runtime';
import { RUNTIME_ERRORS } from '../errors/types';

const lazyRequire      = require('import-lazy')(require);
const endpointUtils    = lazyRequire('endpoint-utils');

async function getValidHostname (hostname?: string): Promise<string> {
    if (hostname) {
        const valid = await endpointUtils.isMyHostname(hostname);

        if (!valid)
            throw new GeneralError(RUNTIME_ERRORS.invalidHostname, hostname);
    }
    else
        hostname = endpointUtils.getIPAddress() as string;

    return hostname;
}

export default getValidHostname;
