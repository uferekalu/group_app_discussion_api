const { Router } = require('express');
const userControllers = require('../../controllers/users/users');
const router = Router();
const { isUser } = require('../../middleware/auth')
const multer = require("multer");
const path = require('path')

// Configure Multer to save uploaded files to a designated folder
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profile-pictures') // Specify the folder where you want to save the profile pictures
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now().toString() + '-' + Math.floor(Math.random() * 1e9)
        const fileExtension = path.extname(file.originalname)
        const filename = uniqueSuffix + fileExtension
        cb(null, filename) // Use a unique filename to avoid conflicts
    }
})

const upload = multer({ storage })

router.get('/', (req, res) => res.send('Welcome to the group app!'))
router.post('/register', userControllers.createUser)
router.post('/login', userControllers.loginUser)
router.post('/upload-profile-picture', isUser, upload.single('profilePicture'), userControllers.uploadPicture)
router.get('/suggested-usernames', userControllers.suggestedUsernames)

module.exports = router