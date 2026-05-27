
export function getPublicApiBaseUrl(req) {
    const strip = (s) => (s || '').trim().replace(/\/+$/, '');
    const isLocalHost = (urlOrHost) => /localhost|127\.0\.0\.1/i.test(urlOrHost || '');

    const envUrls = [
        process.env.PUBLIC_API_URL,
        process.env.BASE_URL,
        process.env.RENDER_EXTERNAL_URL,
    ]
        .map(strip)
        .filter(Boolean);

    for (const url of envUrls) {
        if (!isLocalHost(url)) return url;
    }

    if (req) {
        const rawProto =
            req.get('x-forwarded-proto') ||
            (req.secure ? 'https' : req.protocol) ||
            'https';
        const proto = rawProto.split(',')[0].trim();
        const host = (req.get('x-forwarded-host') || req.get('host') || '')
            .split(',')[0]
            .trim();
        if (host && !isLocalHost(host)) {
            return `${proto}://${host}`;
        }
    }

    if (envUrls.length) return envUrls[0];
    return 'http://localhost:5000';
}
