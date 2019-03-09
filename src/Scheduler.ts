import logger from "./logger";

export default class Scheduler {
    public static schedule(fn: () => Promise<any>, interval: number) {
        let executor = async function () {
            try {
                await fn();
            } catch (e) {
                logger.error(e.message);
                logger.error(e.stack);
            }

            setTimeout(executor, interval);
        };

        setTimeout(executor, interval);
    }
}
