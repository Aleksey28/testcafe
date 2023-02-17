import tty from 'tty';
import elegantSpinner from 'elegant-spinner';
import logUpdate from 'log-update-async-hook';
import chalk from 'chalk';
import isCI from 'is-ci';
import prompts from 'prompts';

// NOTE: To support piping, we use stderr as the log output
// stream, while stdout is used for the report output.
export default {
    animation:  null,
    isAnimated: tty.isatty(1) && !isCI,

    showSpinner () {
        // NOTE: we can use the spinner only if stdout is a TTY and we are not in CI environment (e.g. TravisCI),
        // otherwise we can't repaint animation frames. Thanks https://github.com/sindresorhus/ora for insight.
        if (this.isAnimated) {
            const spinnerFrame = elegantSpinner();

            this.animation = setInterval(() => {
                const frame = chalk.cyan(spinnerFrame());

                logUpdate(frame);
            }, 50);
        }
    },

    hideSpinner (isExit) {
        if (this.animation) {
            clearInterval(this.animation);
            logUpdate.clear();

            if (isExit)
                logUpdate.done();

            this.animation = null;
        }
    },

    showSpinnerIfNeeded (wasAnimated) {
        if (wasAnimated)
            this.showSpinner();
    },

    hideSpinnerIfNeeded (wasAnimated) {
        if (wasAnimated)
            this.hideSpinner();
    },

    write (text) {
        const wasAnimated = !!this.animation;

        this.hideSpinnerIfNeeded(wasAnimated);

        console.log(text);

        this.showSpinnerIfNeeded(wasAnimated);
    },

    async prompt (options) {
        const wasAnimated = !!this.animation;

        this.hideSpinnerIfNeeded(wasAnimated);

        const res = await prompts(options);

        this.showSpinnerIfNeeded(wasAnimated);

        return res;
    },
};

