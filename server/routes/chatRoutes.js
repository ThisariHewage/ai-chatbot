const express = require('express');
const router = express.Router();
const {
    createChat,
    getAllChats,
    getChatById,
    updateChat,
    deleteChat,
    deleteAllChats,
    shareChat,
    getSharedChat,
    continueSharedChat,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/share/:token', getSharedChat);

// All chat routes are protected
router.use(protect);

router.post('/create', createChat);
router.get('/all', getAllChats);
router.delete('/clear', deleteAllChats); // Must be before /:id routes
router.post('/share/:token/continue', continueSharedChat);
router.get('/:id', getChatById);
router.put('/:id', updateChat);
router.delete('/:id', deleteChat);
router.post('/:id/share', shareChat);

module.exports = router;
