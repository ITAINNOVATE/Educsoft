const config = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : '/api',
    getAssetUrl: (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const base = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000'
            : '';
        return `${base}${url}`;
    }
};

export default config;
