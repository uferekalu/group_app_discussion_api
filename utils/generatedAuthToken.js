const jwt = require('jsonwebtoken')

const generateAuthToken = (user) => {
    const jwtSecretKey = process.env.JWT_SECRET_KEY
    const token = jwt.sign(
        {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            profile_picture: user.profile_picture,
            country: user.country,
            sex: user.sex,
            hobbies: user.hobbies,
        },
        jwtSecretKey,
        {
            expiresIn: '7d'
        }
    )

    return token
}

module.exports = generateAuthToken