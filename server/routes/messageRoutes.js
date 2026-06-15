const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, editMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.use(protect);

router.post('/send', upload.array('files', 5), sendMessage);
router.get('/:chatId', getMessages);
router.put('/:id', editMessage);

module.exports = router;