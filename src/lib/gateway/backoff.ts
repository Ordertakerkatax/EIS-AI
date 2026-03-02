// Exponential backoff configuration for interacting with unreliable third-party APIs
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

/**
 * Executes a fetch request with exponential backoff.
 * Helpful for government APIs that might experience temporary downtime.
 */
export async function fetchWithExponentialBackoff(
    url: string,
    options: RequestInit,
    retries: number = MAX_RETRIES,
    delay: number = BASE_DELAY_MS
): Promise<Response> {
    try {
        const response = await fetch(url, options);

        // If the response is successful, or it's a client error (4xx) that shouldn't be retried
        if (response.ok || (response.status >= 400 && response.status < 500)) {
            return response;
        }

        // 5xx Server Errors — Candidate for retry
        throw new Error(`Server responded with status ${response.status}`);
    } catch (error) {
        if (retries === 0) {
            console.error(`Fetch failed after ${MAX_RETRIES} retries.`, error);
            throw error;
        }

        console.warn(`Fetch to ${url} failed. Retrying in ${delay}ms...`);

        // Wait for the specified delay
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Exponentially increase the delay for the next iteration (e.g. 1s, 2s, 4s, 8s...)
        return fetchWithExponentialBackoff(url, options, retries - 1, delay * 2);
    }
}
