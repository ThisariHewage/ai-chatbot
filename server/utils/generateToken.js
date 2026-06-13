const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for a user
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

/**
 * Verify a JWT token and return its payload
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };