const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered. Please log in.',
            });
        }

        // Create new user (password hashed via pre-save hook)
        const user = await User.create({ name, email, password });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log(`User not found: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'No account found with this email address.',
            });
        }

        // Compare passwords
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password. Please double-check and try again.',
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Logged in successfully!',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get logged-in user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete user account and all data
 * @route   DELETE /api/auth/delete
 * @access  Private
 */
const deleteAccount = async (req, res, next) => {
    try {
        const Chat = require('../models/Chat');
        const Message = require('../models/Message');

        // Delete all chats and messages for this user
        const chats = await Chat.find({ userId: req.user._id });
        const chatIds = chats.map((c) => c._id);
        await Message.deleteMany({ chatId: { $in: chatIds } });
        await Chat.deleteMany({ userId: req.user._id });
        await User.findByIdAndDelete(req.user._id);

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getProfile, deleteAccount };