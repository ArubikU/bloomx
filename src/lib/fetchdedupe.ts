
const pendingRequests = new Map<string, Promise<any>>();

export async function fetchDeduped(url: string, options?: RequestInit) {
    const key = url + (options ? JSON.stringify(options) : '');

    if (pendingRequests.has(key)) {
        return pendingRequests.get(key);
    }

    const promise = fetch(url, options)
        .then(async (res) => {
            // We clone the response to allow multiple reads if necessary, 
            // but primarily we return JSON data.
            // If the consumer needs the full response object, this helper needs adjustment.
            // For now, assuming JSON API usage.
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .finally(() => {
            pendingRequests.delete(key);
        });

    pendingRequests.set(key, promise);
    return promise;
}
