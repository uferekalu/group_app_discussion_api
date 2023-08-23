const Joi = require("joi")
const { User } = require('../models');
const bcrypt = require('bcrypt')
const generateAuthToken = require('../utils/generatedAuthToken');
const { Op } = require("sequelize");

const uploadPicture = async (req, res) => {
    const userId = req.user.id // Get the authenticated user's ID
    const filePath = req.file.path // Get the file path where the profile picture is saved
    // Save the filePath to the profile_picture field in the users table
    try {
        await User.update({
            profile_picture: filePath
        }, {
            where: {
                id: userId
            }
        })

        res.status(200).json({
            message: "Profile picture uploaded successfully"
        })
    } catch (error) {
        console.error("Error updating profile picture:", error)
        res.status(500).json({
            error: 'An error occured while updating the profile picture'
        })
    }
}

const createUser = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(3).max(40).required(),
            email: Joi.string().required().email(),
            username: Joi.string().min(3).max(200).required(),
            password: Joi.string().min(6).max(200).required(),
            country: Joi.string(),
            sex: Joi.string(),
            hobbies: Joi.string()
        })

        const { error } = schema.validate(req.body)
        if (error) {
            return res.status(400).json({
                error: error.details[0].message
            })
        }
        const { name, email, username, password, country, sex, hobbies } = req.body

        const existingUser = await User.findOne({ where: { email } })
        if (existingUser) {
            return res.status(409).json({
                error: "Email already exists"
            })
        }

        const existingUsername = await User.findOne({ where: { username } })
        if (existingUsername) {
            return res.status(409).json({
                error: `${username} is already taken`
            })
        }

        const moderatedSex = sex.slice(0, 1).toUpperCase() + sex.slice(1).toLowerCase()
        const user = await User.create({
            name,
            email,
            username,
            password,
            country,
            sex: moderatedSex,
            hobbies
        })
        res.status(201).json({
            message: 'User created successfully!',
            user
        })
    } catch (error) {
        console.error("Error occured while registering the user", error)
        res.status(500).json({
            message: 'An error occured', error
        })
    }
}

const loginUser = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().min(3).max(200).required().email(),
            password: Joi.string().min(6).max(200).required()
        })
        const { error } = schema.validate(req.body)
        if (error) {
            return res.status(400).json({
                error: error.details[0].message
            })
        }
        const { email, password } = req.body
        const user = await User.findOne({ where: { email } })

        if (!user) {
            return res.status(400).json({
                error: "Invalid credentials"
            })
        }
        const passwordMatch = bcrypt.compareSync(password, user.password)

        if (!passwordMatch) {
            return res.status(400).json({ error: 'Invalid credentials' })
        }
        const token = generateAuthToken(user);

        res.status(200).json({
            message: "Login successfull",
            token
        })
    } catch (error) {
        console.error("Error loggin in", error)
        res.status(500).json({
            message: 'An error occured', error
        })
    }
}

const suggestedUsernames = async (req, res) => {
    const { partialUsername } = req.query
    try {
        // Fetch existing usernames that start with the partialUsername
        const existingUsers = await User.findAll({
            attributes: ['username'],
            where: {
                username: {
                    [Op.like]: `${partialUsername}%`,
                },
            },
        })

        // Extractthe usernames from the fetched existing users 
        const existingUsernames = existingUsers.map((user) => user.username)

        // Generate suggested usernames that do not exist in the database
        const suggestedUsernames = []
        let counter = 1

        while (suggestedUsernames.length < 5) {
            const suggestedUsername = `${partialUsername}${counter}`

            if (!existingUsernames.includes(suggestedUsername)) {
                suggestedUsernames.push(suggestedUsername)
            }

            counter++
        }
        res.status(200).json(suggestedUsernames)
    } catch (error) {
        console.error('Error fetching suggested usernames:', error);
        res.status(500).json({ error: 'An error occurred while fetching suggested usernames' });
    }
}

module.exports = {
    createUser,
    uploadPicture,
    loginUser,
    suggestedUsernames
}