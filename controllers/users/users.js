const Joi = require("joi")
const { User } = require('../../models');
const bcrypt = require('bcrypt')
const generateAuthToken = require('../../utils/generatedAuthToken');
const { Op } = require("sequelize");

const uploadPicture = async (req, res) => {
    console.log(req.body)
    const userId = req.user.id // Get the authenticated user's ID
    const filePath = req.file?.path // Get the file path where the profile picture is saved
    // Save the filePath to the profile_picture field in the users table

    if (!filePath) {
        return res.status(400).json({
            error: "Path not found!"
        })
    }
    try {
        await User.update({
            profile_picture: filePath
        }, {
            where: {
                id: userId
            }
        })
        const user = await User.findByPk(userId)

        res.status(200).json({
            message: "Profile picture uploaded successfully",
            uploadPath: user.profile_picture
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

        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            profile_picture: user.profile_picture,
            country: user.country,
            sex: user.sex,
            hobbies: user.hobbies
        }

        if (!user) {
            return res.status(400).json({
                error: "Invalid credentials"
            })
        }
        const passwordMatch = bcrypt.compareSync(password, user.password)

        if (!passwordMatch) {
            return res.status(400).json({ error: 'Invalid credentials' })
        }
        const token = generateAuthToken(userData);

        const data = {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            profile_picture: user.profile_picture,
            country: user.country,
            sex: user.sex,
            hobbies: user.hobbies
        }

        res.status(200).json({
            message: "Login successfull",
            data,
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

const getUserDetails = async (req, res) => {
    const userId = parseInt(req.params.id)
    try {
        const userDetails = await User.findByPk(userId)
        if (!userDetails) {
            return res.status(400).json({
                error: "User not found"
            })
        }

        const { id, name, username, email, profile_picture, country, sex, hobbies } = userDetails
        const userData = {
            id,
            name,
            username,
            email,
            profile_picture,
            country,
            sex,
            hobbies
        }
        res.status(200).json({
            message: "User retrieved successfully",
            userDetails: userData
        })
    } catch (error) {
        console.error('Error getting user details:', error);
        res.status(500).json({ error: 'An error occurred while getting user details' });
    }
}

const getAllUsers = async (req, res) => {
    try {
        const allUsers = await User.findAll()
        if (!allUsers) {
            return res.status(400).json({
                error: "Error getting all users"
            })
        }
        const users = allUsers.map((user) => {
            const { id, name, username, email, profile_picture, country, sex, hobbies } = user
            const data = {
                id,
                name,
                username,
                email,
                profile_picture,
                country,
                sex,
                hobbies
            }
            return data
        })
        res.status(200).json({
            message: "Users retrieved successfully",
            users
        })
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).json({ error: 'An error occurred while retrieving users' });
    }
}

const updateUser = async (req, res) => {
    const userId = parseInt(req.params.id)
    const schema = Joi.object({
        name: Joi.string().min(3).max(40).required(),
        email: Joi.string().required().email(),
        username: Joi.string().min(3).max(200).required(),
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

    try {
        const { name, email, username, country, sex, hobbies } = req.body
        const user = await User.findByPk(userId)
        user.name = name
        user.email = email
        user.username = username
        if (country) {
            user.country = country
        }
        if (sex) {
            user.sex = sex
        }
        if (hobbies) {
            user.hobbies = hobbies
        }
        await user.save()
        const userData = {
            name: user.name,
            username: user.username,
            email: user.email,
            profile_picture: user.profile_picture,
            country: user.country,
            sex: user.sex,
            hobbies: user.hobbies
        }
        res.status(200).json({
            message: "User updated successfully!",
            userData
        })
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'An error occurred while updating user' });
    }
}

module.exports = {
    createUser,
    uploadPicture,
    loginUser,
    suggestedUsernames,
    getUserDetails,
    updateUser,
    getAllUsers
}