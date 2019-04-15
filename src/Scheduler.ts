import logger from "./logger"

export default class Scheduler {
    /**
     * @param {Promise<any>} fn
     * @param {Number} interval
     */
    static schedule(fn: () => Promise<any>, interval: number) {
        let executor = async function () {
            try {
                await fn();
            } catch (e) {
                logger.error(e);
            }

            setTimeout(executor, interval);
        };

        setTimeout(executor, interval);
    }
}
