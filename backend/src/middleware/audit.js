const { prisma } = require('../context');

const auditLog = (action) => async (req, res, next) => {
    // Capture the original response.json to log after success
    const originalJson = res.json;

    res.json = function (data) {
        res.locals.responseBody = data;
        originalJson.call(this, data);
    };

    res.on('finish', async () => {
        // Only log successful modifications (200, 201)
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
            try {
                await prisma.auditLog.create({
                    data: {
                        action,
                        details: JSON.stringify({
                            method: req.method,
                            url: req.originalUrl,
                            body: { ...req.body, password: req.body?.password ? '***' : undefined },
                            responseId: res.locals.responseBody?.id
                        }),
                        ip: req.ip || req.connection.remoteAddress,
                        userId: req.user.id
                    }
                });
            } catch (error) {
                console.error('Audit Log Error:', error);
            }
        }
    });

    next();
};

module.exports = { auditLog };
