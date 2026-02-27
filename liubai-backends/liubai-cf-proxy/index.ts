/**
 * Cloudflare Worker for Web Push Proxy
 * This worker forwards Web Push requests to fcm.googleapis.com
 * to bypass network restrictions.
 */

export default {
    async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // We expect the request to be sent to this worker with the original path
        // Example: https://proxy-worker.subdomain.workers.dev/wp/v1/sub-id
        // We need to forward it to: https://fcm.googleapis.com/wp/v1/sub-id

        const targetHost = 'fcm.googleapis.com';
        const newUrl = new URL(url.pathname + url.search, `https://${targetHost}`);

        console.log(`[Proxy] Incoming request: ${request.method} ${url.pathname}`);
        console.log(`[Proxy] Forwarding to: ${newUrl.toString()}`);

        // Create a new request based on the original one
        const newRequest = new Request(newUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            redirect: 'manual',
        });

        try {
            const start = Date.now();
            const response = await fetch(newRequest);
            const duration = Date.now() - start;

            console.log(`[Proxy] Response from FCM: ${response.status} ${response.statusText} (${duration}ms)`);

            // Create a response with the same status and body
            // We need to clone headers to avoid immutable header errors
            const newResponse = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: new Headers(response.headers),
            });

            // Add CORS if needed (though not strictly necessary for this backend use case)
            newResponse.headers.set('Access-Control-Allow-Origin', '*');

            return newResponse;
        } catch (err: any) {
            console.error(`[Proxy] Error: ${err.message || err}`);
            return new Response(`Proxy error: ${err.message || err}`, { status: 502 });
        }
    },
};
