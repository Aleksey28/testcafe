type TemplateArguments = any[];

interface ScreenshotOptionValue {
    path: string;
    takeOnFails?: boolean;
    pathPattern?: string;
    fullPage?: boolean;
}

interface QuarantineOptionValue {
    attemptLimit?: number;
    successThreshold?: number;
}

interface Hook {
    before?: Function;
    after?: Function;
}

interface HooksValue {
    testRun?: Hook;
    fixture?: Hook;
    test?: Hook;
}

type OptionValue = undefined | null | string | boolean | number | string[] | Function | { [key: string]: any } | ScreenshotOptionValue | QuarantineOptionValue | CompilerOptions | HooksValue;
