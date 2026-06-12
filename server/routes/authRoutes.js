const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.delete('/delete', protect, deleteAccount);

module.exports = router;