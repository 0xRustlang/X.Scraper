import { logger } from "./logger";

class Scheduler {
    public static schedule(fn : () => Promise<any>, interval : number) {
        let executor = async function () {
            try {
                await fn();
            } catch (e) {
                logger.error(e.message);
            }

            setTimeout(executor, interval);
        };

        setTimeout(executor, interval);
    }
}

export { Scheduler }
