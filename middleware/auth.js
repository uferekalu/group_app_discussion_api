const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
    const token = req.header('x-auth-token')
    if (!token) {
        return res.status(401).json({
            message: 'Access denied. Not authenticated...'
        })
    }
    try {
        const jwtSecretKey = process.env.JWT_SECRET_KEY
        const decoded = jwt.verify(token, jwtSecretKey)

        req.user = decoded
        next()
    } catch (error) {
        res.status(400).json({
            message: 'Invalid auth token...'
        })
    }
}

// For User Profile
const isUser = (req, res, next) => {
    auth(req, res, () => {
        if (req.user.id) {
            next()
        } else {
            res.status(403).json({
                message: 'Access denied. Not authorized...'
            })
        }
    })
}

// For Admin
const isAdmin = (req, res, next) => {
    auth(req, res, () => {
        if (req.user.isAdmin) {
            next()
        } else {
            res.status(403).json({
                message: "Access denied. Not authorized..."
            })
        }
    })
}

module.exports = {
    auth,
    isUser,
    isAdmin
}