const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;

        // Extract token from Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. No token provided.',
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Attach user to request (exclude password)
        try {
            req.user = await User.findById(decoded.id).select('-password');
        } catch (dbError) {
            console.error('Database error in authMiddleware:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authentication.',
            });
        }

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists. Please log in again.',
            });
        }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Your session has expired. Please log in again.',
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid session. Please log in again.',
            });
        }

        console.error('Unexpected auth error:', error);
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred during authentication.',
        });
    }
};

module.exports = { protect };