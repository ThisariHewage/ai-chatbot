const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, editMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/send', sendMessage);
router.get('/:chatId', getMessages);
router.put('/:id', editMessage);

module.exports = router;