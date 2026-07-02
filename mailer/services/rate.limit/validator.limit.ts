let currentMinute = Math.floor(Date.now() / 60000);
let callsThisMinute = 0;

export async function validateRateLimit() {
    const now = Math.floor(Date.now() / 60000);
    if (now !== currentMinute) {
        currentMinute = now;
        callsThisMinute = 0;
    }

    if (callsThisMinute >= 20) {
        const waitMs = 60000 - (Date.now() % 60000);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        currentMinute = Math.floor(Date.now() / 60000);
        callsThisMinute = 0;
    }
    callsThisMinute++;
}