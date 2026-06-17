/**
 * Global error handling middleware
 * Catches all errors passed via next(error)
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (err.name === 'MulterError') {
        statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        message = err.code === 'LIMIT_FILE_SIZE'
            ? 'File is too large. Maximum upload size is 10 MB per file.'
            : err.message;
    }

    // Mongoose duplicate key error (e.g. duplicate email)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
        statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        message = Object.values(err.errors)
            .map((e) => e.message)
            .join(', ');
        statusCode = 400;
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        message = 'Resource not found. Invalid ID.';
        statusCode = 404;
    }

    console.error(`[Error] ${statusCode} - ${message}`);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = { errorHandler };
