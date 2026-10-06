/**
 * Executes an API playground request over raw HTTP.
 *
 * The playground must send arbitrary user-configurable endpoints, so it owns
 * a transport helper here (outside the UI layer) instead of calling fetch
 * directly from a component.
 */
function unknownToErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'Request failed';
}
export async function sendPlaygroundRequest(url, requestInit) {
    const startTime = Date.now();
    try {
        const res = await fetch(url, requestInit);
        const endTime = Date.now();
        const contentType = res.headers.get('content-type');
        const text = await res.text();
        const size = new Blob([text]).size;
        let data;
        if (contentType && contentType.includes('application/json')) {
            try {
                data = JSON.parse(text);
            }
            catch {
                data = text;
            }
        }
        else {
            data = text;
        }
        const responseHeaders = [];
        res.headers.forEach((value, key) => {
            responseHeaders.push([key, value]);
        });
        return {
            status: res.status,
            statusText: res.statusText,
            time: endTime - startTime,
            size,
            headers: responseHeaders,
            data,
        };
    }
    catch (error) {
        const endTime = Date.now();
        return {
            status: 0,
            statusText: 'Network Error',
            time: endTime - startTime,
            size: 0,
            headers: [],
            data: {
                error: unknownToErrorMessage(error),
                hint: 'This might be a CORS issue, or the server is unreachable. Check your network console for details.',
            },
        };
    }
}
//# sourceMappingURL=playgroundSender.js.map