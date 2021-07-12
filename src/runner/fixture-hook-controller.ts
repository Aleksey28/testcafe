import TEST_RUN_PHASE from '../test-run/phase';
import processTestFnError from '../errors/process-test-fn-error';
import Test from '../api/structure/test';
import Fixture from '../api/structure/fixture';
import TestRun from '../test-run';

interface FixtureState {
    started: boolean;
    runningFixtureBeforeHook: boolean;
    fixtureBeforeHookErr: null | Error;
    pendingTestRunCount: number;
    fixtureCtx: object;
}

export default class FixtureHookController {
    private readonly _fixtureMap: Map<Fixture, FixtureState>;

    public constructor (tests: Test[], browserConnectionCount: number) {
        this._fixtureMap = FixtureHookController._createFixtureMap(tests, browserConnectionCount);
    }

    private static _ensureFixtureMapItem (fixtureMap: Map<Fixture, FixtureState>, fixture: Fixture): void {
        if (!fixtureMap.has(fixture)) {
            const item = {
                started:                  false,
                runningFixtureBeforeHook: false,
                fixtureBeforeHookErr:     null,
                pendingTestRunCount:      0,
                fixtureCtx:               Object.create(null),
            };

            fixtureMap.set(fixture, item);
        }
    }

    private static _createFixtureMap (tests: Test[], browserConnectionCount: number): Map<Fixture, FixtureState> {
        return tests.reduce((fixtureMap, test) => {
            const fixture = test.fixture;

            if (!test.skip) {
                FixtureHookController._ensureFixtureMapItem(fixtureMap, fixture);

                const item = fixtureMap.get(fixture);

                item.pendingTestRunCount += browserConnectionCount;
            }

            return fixtureMap;
        }, new Map());
    }

    private _getFixtureMapItem (test: Test): null | FixtureState | undefined {
        return test.skip ? null : this._fixtureMap.get(test.fixture);
    }

    public isTestBlocked (test: Test): boolean {
        const item = this._getFixtureMapItem(test);

        return !!item && item.runningFixtureBeforeHook;
    }

    private async _runFixtureBeforeHook (item: FixtureState, fn: Function): Promise<boolean> {
        const shouldRunBeforeHook = !item.started && fn;

        if (!shouldRunBeforeHook)
            return !item.fixtureBeforeHookErr;

        item.runningFixtureBeforeHook = true;

        try {
            await fn(item.fixtureCtx);
        }
        catch (err) {
            item.fixtureBeforeHookErr = processTestFnError(err);
        }

        item.runningFixtureBeforeHook = false;

        return !item.fixtureBeforeHookErr;
    }

    private async _runFixtureAfterHook (item: FixtureState, fn: Function | null, testRun: TestRun): Promise<void> {
        if (!fn)
            return;

        testRun.phase = TEST_RUN_PHASE.inFixtureAfterHook;

        try {
            await fn(item.fixtureCtx);
        }
        catch (err) {
            testRun.addError(processTestFnError(err));
        }
    }

    public async runFixtureBeforeHookIfNecessary (testRun: TestRun): Promise<boolean> {
        const fixture = testRun.test.fixture;
        const item    = this._getFixtureMapItem(testRun.test);

        if (item) {
            const success = await this._runFixtureBeforeHook(item, fixture.globalBeforeFn as Function)
                            && await this._runFixtureBeforeHook(item, fixture.beforeFn as Function);

            item.started = true;

            // NOTE: fail all tests in fixture if fixture.before hook has error
            if (!success && item.fixtureBeforeHookErr) {
                testRun.phase = TEST_RUN_PHASE.inFixtureBeforeHook;

                testRun.addError(item.fixtureBeforeHookErr);

                return false;
            }

            testRun.fixtureCtx = item.fixtureCtx;
        }

        return true;
    }

    public async runFixtureAfterHookIfNecessary (testRun: TestRun): Promise<void> {
        const fixture = testRun.test.fixture;
        const item    = this._getFixtureMapItem(testRun.test);

        if (item) {
            item.pendingTestRunCount--;

            if (item.pendingTestRunCount === 0) {
                await this._runFixtureAfterHook(item, fixture.globalAfterFn, testRun);
                await this._runFixtureAfterHook(item, fixture.afterFn, testRun);
            }
        }
    }
}
