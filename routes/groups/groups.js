const { Router } = require('express');
const groupControllers = require('../../controllers/groups/groups');
const router = Router();
const { isUser } = require('../../middleware/auth')

router.post('/create-group', isUser, groupControllers.createGroup)

module.exports = router