class AsyncUtils {

    public static async timeOut(delay: number, callback?: () => void): Promise<void> {
        return new Promise<void>(
            resolve => {
                setTimeout(() => {
                    if (callback) {
                        callback();
                    }
                    resolve();
                }, delay);
            }
        );
    }
}