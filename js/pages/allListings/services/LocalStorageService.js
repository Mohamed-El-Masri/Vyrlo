export class LocalStorageService {
    static setItem(key, value, expiresIn = 900000) { // 15 minutes default
        const item = {
            value,
            timestamp: Date.now(),
            expiresIn
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    static getItem(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const { value, timestamp, expiresIn } = JSON.parse(item);
        if (Date.now() - timestamp > expiresIn) {
            localStorage.removeItem(key);
            return null;
        }

        return value;
    }

    static removeItem(key) {
        localStorage.removeItem(key);
    }
}
