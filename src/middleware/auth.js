const jwt = require('jsonwebtoken');
const { prisma } = require('../context');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (token) {
        try {
            // Ensure token is trimmed and clean
            const cleanToken = token.trim();
            const JWT_SECRET = process.env.JWT_SECRET || 'EduSoft_Internal_Fallback_Secret_2026';
            const decoded = jwt.verify(cleanToken, JWT_SECRET);

            req.user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, email: true, role: true, firstName: true, lastName: true, establishmentId: true },
            });

            // If Super Admin, use the establishmentId from token (context switching)
            if (req.user && req.user.role === 'SUPER_ADMIN') {
                req.user.establishmentId = decoded.establishmentId;
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
