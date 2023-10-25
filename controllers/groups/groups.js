const Joi = require('joi')
const {
    Group,
    Group_members,
    User,
    Invitations,
    Notifications,
    Discussions,
    Comments,
    Replies
} = require('../../models');

// Create a group
const createGroup = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(3).max(40).required(),
            description: Joi.string().min(10).required()
        })

        const { error } = schema.validate(req.body)
        if (error) {
            return res.status(400).json({
                error: error.details[0].message
            })
        }
        const userId = parseInt(req.user.id)
        const { name, description } = req.body

        // Check if the group exists
        const existingGroup = await Group.findOne({ where: { name } })
        if (existingGroup) {
            return res.status(409).json({
                error: "Group already exists"
            })
        }

        // Create a group
        const group = await Group.create({
            name,
            description,
            creator_id: userId
        })

        // Make the creator a member of the group by updating the groups_members table
        if (group) {
            await Group_members.create({
                group_id: group.id,
                user_id: group.creator_id
            })
            res.status(201).json({
                message: `Group with name ${group.name} created successfully`,
                group
            })
        }
    } catch (error) {
        console.error("Error occured while creating the group:", error)
        res.status(500).json({
            error: 'Error occured while creating the group'
        })
    }
}

// Get all groups and their creators
const getAllGroups = async (req, res) => {
    try {
        const groups = await Group.findAll()
        const allGroups = await Promise.all(groups.map(async (group) => {
            const creator = await User.findOne({ where: { id: group.creator_id } });
            const { id, name, description, creator_id, createdAt } = group;
            // Get members belongin to this group
            const members = await Group_members.findAll({
                where: {
                    group_id: id
                }
            })
            let allUsers = []
            for (let member of members) {
                const userId = member.user_id
                const user = await User.findByPk(userId)
                allUsers.push(user.username)
            }
            // Get the discussions belonging to this group
            const allDiscussions = await Discussions.findAll({
                where: {
                    group_id: id
                }
            })
            const details = {
                id,
                name,
                description,
                creator_id,
                creatorName: creator.name,
                username: creator.username,
                profile_picture: creator.profile_picture,
                createdAt,
                allUsers,
                allDiscussions
            };
            return details;
        }));
        if (!allGroups) {
            return res.status(400).json({
                error: "No Group found"
            })
        }
        res.status(200).json({
            allGroups
        })
    } catch (error) {
        console.error("Error fetching all groups:", error)
        res.status(500).json({
            error: 'Error fetching all groups'
        })
    }
}

// Get a group and its members 
const getAGroup = async (req, res) => {
    try {
        const userId = parseInt(req.user.id)
        const groupID = parseInt(req.params.groupId)
        // Check if the user is a group member by querying the group-members table
        const isMemmber = await Group_members.findOne({ where: { user_id: userId, group_id: groupID } })

        //Get all the group information including its member details
        const groupDetails = await Group.findOne({
            where: {
                id: groupID
            },
            attributes: ['name', 'description', 'creator_id'],
            include: [
                {
                    model: Group_members,
                    attributes: ['user_id'],
                    include: [
                        {
                            model: User,
                            attributes: ['name', 'email', 'username', 'profile_picture', 'country', 'sex', 'hobbies']
                        }
                    ]
                }
            ]
        })

        if (!groupDetails) {
            return res.status(400).json({
                error: `No group with id ${groupID}`
            })
        }

        res.status(200).json({
            message: "Group details returned successfully",
            groupDetails
        })
    } catch (error) {
        console.error("Error occured while returning group details:", error)
        res.status(500).json({
            error: 'Error occured while returning group details'
        })
    }
}

// Send Invitation to join a group
const sendInviteToJoinAGroup = async (req, res) => {
    const userId = parseInt(req.user.id)
    const groupID = parseInt(req.params.groupId)

    const schema = Joi.object({
        username: Joi.string().min(3).max(200).required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        })
    }
    const { username } = req.body
    // Get the group 
    const group = await Group.findByPk(groupID)
    // Get the user
    const user = await User.findByPk(userId)
    if (!group) {
        return res.status(400).json({
            error: `Group with id ${groupID} is not found`
        })
    }
    try {
        // Check if the user is the creator of the group
        if (group.creator_id === user.id) {
            // Get the id of the receiver based on the username
            const receiver = await User.findOne({ where: { username } })
            if (!receiver) {
                return res.status(400).json({
                    error: `User with username ${username} does not exist`
                })
            }
            // Check if the receiver is already a member of the group
            const isMember = await Group_members.findOne({
                where: {
                    group_id: groupID,
                    user_id: receiver.id
                }
            })
            if (isMember) {
                return res.status(400).json({
                    error: `User with name ${receiver.name} and id ${receiver.id} is already a member of ${group.name} group`
                })
            }
            // Check if the receiver has already been sent an invite
            const inviteAlreadySent = await Invitations.findOne({
                where: {
                    sender_id: user.id,
                    receiver_id: receiver.id,
                    group_id: group.id
                }
            })
            if (inviteAlreadySent) {
                return res.status(400).json({
                    error: `User with name ${receiver.name} has already received an invite to join ${group.name} group`
                })
            }
            // Send the invitation to the receiver
            const invitation = await Invitations.create({
                sender_id: user.id,
                receiver_id: receiver.id,
                group_id: group.id
            })
            if (!invitation) {
                return res.status(400).json({
                    error: "Error occured and could not send the invitation"
                })
            }
            // Send notification to the receiver
            const notification = await Notifications.create({
                sender_id: user.id,
                receiver_id: receiver.id,
                group_id: group.id,
                content: "You have an invitation waiting for your action",
                status: "unread"
            })
            if (!notification) {
                return res.status(400).json({
                    error: "Error occured and could not send the notification"
                })
            }
            res.status(201).json({
                message: `Invitation has been sent to the user with username ${username}`
            })
        } else {
            return res.status(400).json({
                error: `User with name ${user.name} is not the creator of the group with name ${group.name}`
            })
        }
    } catch (error) {
        console.error("Error occured while sending the invitation:", error)
        res.status(500).json({
            error: 'Error occured while sending the invitation'
        })
    }
}

const joinAgroup = async (req, res) => {
    const userId = parseInt(req.user.id)
    const groupID = parseInt(req.params.groupId)
    const user = await User.findByPk(userId)
    const group = await Group.findByPk(groupID)
    try {
        // Check if the user is already a member of the group
        const isMember = await Group_members.findOne({
            where: {
                group_id: groupID,
                user_id: user.id
            }
        })
        if (isMember) {
            return res.status(400).json({
                error: `User with name ${user.name} and id ${user.id} is already a member of ${group.name} group`
            })
        }
        const member = await Group_members.create({
            group_id: group.id,
            user_id: user.id
        })
        if (member) {
            res.status(200).json({
                message: `User with name ${user.name} and id ${user.id} has joined ${group.name} group`
            })
        } else {
            return res.status(400).json({
                error: "Error occured while joining the group"
            })
        }
    } catch (error) {
        console.error("Error occured while joining the group:", error)
        res.status(500).json({
            error: 'Error occured while joining the group'
        })
    }
}

const updateAGroup = async (req, res) => {
    const userId = parseInt(req.user.id)
    const groupID = parseInt(req.params.groupId)

    const user = await User.findByPk(userId)
    const group = await Group.findByPk(groupID)
    if (!group) {
        return res.status(404).json({
            error: `Group with id ${groupID} does not exist`
        })
    }
    const schema = Joi.object({
        name: Joi.string().min(3).max(40).required(),
        description: Joi.string().min(10).required()
    })

    const { error } = schema.validate(req.body)
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        })
    }

    const { name, description } = req.body
    try {
        if (user.id === group.creator_id) {
            group.name = name
            group.description = description

            await group.save()
            res.status(200).json({
                message: "Group updated successfully",
                group
            })
        } else {
            return res.status(400).json({
                error: "you cannot update this group as you are not the creator"
            })
        }
    } catch (error) {
        console.error("Error occured while updating the group:", error)
        res.status(500).json({
            error: 'Error occured while updating the group'
        })
    }
}

const handleInvitationNotification = async (req, res) => {
    const userId = parseInt(req.user.id)
    const schema = Joi.object({
        status: Joi.string().required(),
        groupId: Joi.number().required()
    })
    const { error } = schema.validate(req.body)
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        })
    }
    const { status, groupId } = req.body

    try {
        // Get the receiver id, sender id and group id from notifications table where status is unread
        const notification = await Notifications.findOne({
            where: {
                receiver_id: userId,
                group_id: groupId,
                status: 'unread'
            }
        })
        if (notification) {
            notification.status = "read"
            await notification.save()
            const { sender_id, receiver_id, group_id } = notification
            // Select from invitations table based on sender_id, receiver_id, group_id and status as pending
            const invitation = await Invitations.findOne({
                where: {
                    sender_id,
                    receiver_id,
                    group_id,
                    status: 'pending'
                }
            })
            if (invitation) {
                const { receiver_id, group_id } = invitation
                if (status === "accepted") {
                    invitation.status = "accepted"
                    await invitation.save()
                    // Make the receiver a member of the group
                    const member = await Group_members.create({
                        group_id,
                        user_id: receiver_id
                    })
                    if (member) {
                        res.status(200).json({
                            message: `User with id ${receiver_id} is now a member of group with id ${group_id}`
                        })
                    }
                }
                if (status === "declined") {
                    invitation.status = "declined"
                    await invitation.save()
                    res.status(200).json({
                        message: "We respect your decision to decline the invitation. Feel free to join whenever you like!"
                    })
                }
            }
        }
    } catch (error) {
        console.error("Error occured while responding to notification:", error)
        res.status(500).json({
            error: 'Error occured while responding to notification'
        })
    }
}

const createDiscussion = async (req, res) => {
    const userId = parseInt(req.user.id)
    const schema = Joi.object({
        title: Joi.string().required(),
        content: Joi.string().required(),
        groupId: Joi.number().required()
    })
    const { error } = schema.validate(req.body)
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        })
    }
    const { title, content, groupId } = req.body

    try {
        const author = await User.findOne({ where: { id: userId } })
        if (!author) {
            return res.status(400).json({
                error: `User with id ${userId} does not exist`
            })
        }
        // Make sure group exists
        const group = await Group.findOne({ where: { id: groupId } })
        if (!group) {
            return res.status(400).json({
                error: `Group with id ${groupId} does not exist, specify the right group to start discussion on`
            })
        }
        // Check if the user is a member of the group
        const member = await Group_members.findOne({ where: { group_id: groupId, user_id: userId } })
        if (!member) {
            return res.status(400).json({
                error: `User with id ${userId} is not a member of the group with id ${groupId}. Join the group to start a discussion`
            })
        }
        // Create a discussion
        const discussion = await Discussions.create({
            title,
            content,
            author_id: userId,
            group_id: groupId
        })
        if (discussion) {
            // Get all the members in this group and send them notifications
            const members = await Group_members.findAll({ where: { group_id: discussion.group_id } })
            await Promise.all(members.map(async (member) => {
                const user = member.user_id
                await Notifications.create({
                    sender_id: discussion.author_id,
                    receiver_id: user,
                    group_id: discussion.group_id,
                    discussion_id: discussion.id,
                    content: `${author.username} has started a discussion with title ${discussion.title}`,
                    status: 'unread'
                })
            }))
            res.status(201).json({
                message: `Discussion with title ${discussion.title} has been created and notifications sent to all group members`
            })
        }
    } catch (error) {
        console.error("Error occured while creating the discussion:", error)
        res.status(500).json({
            error: 'Error occured while creating the discussion'
        })
    }
}

const getAllDiscussionsInAGroup = async (req, res) => {
    const userId = parseInt(req.user.id)
    const groupId = parseInt(req.params.groupId)
    // Make sure group exists
    const group = await Group.findOne({ where: { id: groupId } })
    if (!group) {
        return res.status(400).json({
            error: `Group with id ${groupId} does not exist`
        })
    }
    // Check if the user is a member of the group
    const member = await Group_members.findOne({ where: { group_id: groupId, user_id: userId } })
    if (!member) {
        return res.status(400).json({
            error: `User is not a member`
        })
    }

    try {
        // Get all discussions
        const discussions = await Discussions.findAll({
            where: {
                group_id: groupId
            },
            attributes: ['id', 'title', 'content', 'author_id'],
            include: [
                {
                    model: Comments,
                    attributes: ['content', 'author_id', 'discussion_id', 'likes', 'dislikes'],
                    include: [
                        {
                            model: User,
                            attributes: ['name', 'email', 'username', 'profile_picture', 'country', 'sex', 'hobbies']
                        }
                    ]
                }
            ]
        })

        if (!discussions) {
            return res.status(400).json({
                error: "No Discussions found in this group"
            })
        }

        res.status(200).json({
            message: "Discussion details returned successfully",
            discussions
        })
    } catch (error) {
        console.error("Error occured while getting all discussions:", error)
        res.status(500).json({
            error: 'Error occured while getting all discussions'
        })
    }
}

const getAllCommentsFromADiscussion = async (req, res) => {
    const userId = parseInt(req.user.id)
    const groupId = parseInt(req.params.groupId)
    const discussionId = parseInt(req.params.discussionId)
    // Make sure group exists
    const group = await Group.findOne({ where: { id: groupId } })
    if (!group) {
        return res.status(400).json({
            error: `Group with id ${groupId} does not exist`
        })
    }
    // Check if the user is a member of the group
    const member = await Group_members.findOne({ where: { group_id: groupId, user_id: userId } })
    if (!member) {
        return res.status(400).json({
            error: `User with id ${userId} is not a member of the group with id ${groupId}. Join the group to see discussions`
        })
    }
    // Check if discussion exists
    const discussion = await Discussions.findByPk(discussionId)
    if (!discussion) {
        return res.status(400).json({
            error: `Discussion with id ${discussionId} does not exist`
        })
    }

    try {
        // Get the discussion with discussionId and its comments
        const discussion = await Discussions.findOne({
            where: {
                id: discussionId
            },
            attributes: ['id', 'title', 'content', 'author_id', 'group_id', 'createdAt'],
            include: [
                {
                    model: Comments,
                    attributes: ['id', 'content', 'author_id', 'discussion_id', 'likes', 'dislikes', 'createdAt'],
                    include: [
                        {
                            model: User,
                            attributes: ['name', 'email', 'username', 'profile_picture', 'country', 'sex', 'hobbies']
                        },
                        {
                            model: Replies,
                            attributes: ['id', 'content', 'author_id', 'comment_id', 'likes', 'dislikes', 'createdAt'],
                            include: [
                                {
                                    model: User,
                                    attributes: ['name', 'email', 'username', 'profile_picture', 'country', 'sex', 'hobbies']
                                }
                            ]
                        }
                    ]
                },
            ]
        })
        const discussionCreator = await User.findByPk(discussion.author_id)
        const { id, name, email, username, sex, profile_picture, hobbies, country } = discussionCreator
        const creator = {
            id,
            name,
            email,
            username,
            sex,
            profile_picture,
            hobbies,
            country
        }
        const data = {
            discussion,
            creator
        }
        res.status(200).json({
            message: "Discussion details returned successfully",
            data
        })
    } catch (error) {
        console.error("Error occured while getting the discussion:", error)
        res.status(500).json({
            error: 'Error occured while getting the discussion'
        })
    }
}

const getACommentByUserInADiscussion = async (req, res) => {
    const userId = parseInt(req.user.id)
    const groupId = parseInt(req.params.groupId)
    const discussionId = parseInt(req.params.discussionId)
    const commentId = parseInt(req.params.commentId)
    // Make sure group exists
    const group = await Group.findOne({ where: { id: groupId } })
    if (!group) {
        return res.status(400).json({
            error: `Group with id ${groupId} does not exist`
        })
    }
    // Check if the user is a member of the group
    const member = await Group_members.findOne({ where: { group_id: groupId, user_id: userId } })
    if (!member) {
        return res.status(400).json({
            error: `User with id ${userId} is not a member of the group with id ${groupId}. Join the group to see discussions`
        })
    }
    // Check if discussion exists
    const discussion = await Discussions.findByPk(discussionId)
    if (!discussion) {
        return res.status(400).json({
            error: `Discussion with id ${discussionId} does not exist`
        })
    }

    // Check if comment exists
    const comment = await Comments.findByPk(commentId)
    if (!comment) {
        return res.status(400).json({
            error: `Comment with id ${commentId} does not exist`
        })
    }
    try {
        const result = await Discussions.findOne({
            where: {
                id: discussionId
            },
            include: {
                model: Comments,
                attributes: ['id', 'content', 'author_id', 'discussion_id', 'likes', 'dislikes'],
                where: {
                    id: commentId
                }
            }
        })
        res.status(200).json({
            message: "Discussion with a particular comment returned successfully",
            result
        })
    } catch (error) {
        console.error("Error occured while getting the discussion:", error)
        res.status(500).json({
            error: 'Error occured while getting the discussion'
        })
    }
}

const makeACommentOnADiscussion = async (req, res) => {
    const userId = parseInt(req.user.id)
    const schema = Joi.object({
        content: Joi.string(),
        discussion_id: Joi.number().required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        })
    }

    // Get the user
    const user = await User.findByPk(userId)

    const { content, discussion_id } = req.body
    // Check if discussion exists
    const discussion = await Discussions.findByPk(discussion_id)
    if (!discussion) {
        return res.status(400).json({
            error: `Discussion with id ${discussion_id} does not exist`
        })
    }
    // Check if the user is a member of the group that the disucssion belongs to
    const member = await Group_members.findOne({ where: { group_id: discussion.group_id, user_id: userId } })
    if (!member) {
        return res.status(400).json({
            error: `User with id ${userId} is not a member of the group with id ${discussion.group_id}`
        })
    }
    try {
        const comment = await Comments.create({
            content,
            author_id: userId,
            discussion_id
        })
        // Notify the author that someone has reacted to the discussion he created
        if (comment) {
            await Notifications.create({
                sender_id: userId,
                receiver_id: discussion.author_id,
                group_id: discussion.group_id,
                discussion_id: discussion.id,
                content: `${user.username} has reacted to ${discussion.title} you created`,
                status: 'unread'
            })
            res.status(200).json(comment)
        }
    } catch (error) {
        console.error("Error occured while making comment:", error)
        res.status(500).json({
            error: 'Error occured while making comment'
        })
    }
}

const likeADiscussion = async (req, res) => {
    const userId = parseInt(req.user.id)
    const schema = Joi.object({
        discussion_id: Joi.number().required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        })
    }

    // Get the user
    const user = await User.findByPk(userId)

    const { discussion_id } = req.body

    // Check if discussion exists
    const discussion = await Discussions.findByPk(discussion_id)
    if (!discussion) {
        return res.status(400).json({
            error: `Discussion with id ${discussion_id} does not exist`
        })
    }

    // Check if the user is a member of the group that the disucssion belongs to
    const member = await Group_members.findOne({ where: { group_id: discussion.group_id, user_id: userId } })
    if (!member) {
        return res.status(400).json({
            error: `User with id ${userId} is not a member of the group with id ${discussion.group_id}`
        })
    }
    try {
        const comments = await Comments.findAll({
            where: {
                discussion_id: discussion_id,
                author_id: userId
            }
        })
        let totalLikes = 0
        let totalDisLikes = 0
        await Promise.all(comments.map(async (comment) => {
            const { likes, dislikes } = comment
            totalLikes += likes
            totalDisLikes += dislikes
        }))

        if (totalDisLikes > 0) {
            return res.status(400).json({
                error: "You cannot like this discussion since you have already disliked it. Remove the dislike in order to like this discussion"
            })
        }

        if (totalLikes < 1) {
            await Comments.create({
                author_id: userId,
                discussion_id,
                likes: 1
            })
            await Notifications.create({
                sender_id: userId,
                receiver_id: discussion.author_id,
                group_id: discussion.group_id,
                discussion_id: discussion.id,
                content: `${user.username} likes ${discussion.title} you created`,
                status: 'unread'
            })
            res.status(200).json({
                message: "You have liked the discussion"
            })
        } else {
            const destroyedComment = await Comments.destroy({
                where: {
                    author_id: userId,
                    discussion_id: discussion_id,
                    likes: 1
                }
            })
            if (destroyedComment === 1) {
                res.status(200).json({
                    message: "Your like for the discussion has been removed"
                })
            }
        }
    } catch (error) {
        console.error("Error occured while liking the discussion:", error)
        res.status(500).json({
            error: 'Error occured while liking the discussion'
        })
    }
}

const dislikeADiscussion = async (req, res) => {
    const userId = parseInt(req.user.id)
    const schema = Joi.object({
        discussion_id: Joi.number().required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        })
    }

    // Get the user
    const user = await User.findByPk(userId)

    const { discussion_id } = req.body

    // Check if discussion exists
    const discussion = await Discussions.findByPk(discussion_id)
    if (!discussion) {
        return res.status(400).json({
            error: `Discussion with id ${discussion_id} does not exist`
        })
    }

    // Check if the user is a member of the group that the disucssion belongs to
    const member = await Group_members.findOne({ where: { group_id: discussion.group_id, user_id: userId } })
    if (!member) {
        return res.status(400).json({
            error: `User with id ${userId} is not a member of the group with id ${discussion.group_id}`
        })
    }
    try {
        const comments = await Comments.findAll({
            where: {
                discussion_id: discussion_id,
                author_id: userId
            }
        })
        let totalDisLikes = 0
        let totalLikes = 0
        await Promise.all(comments.map(async (comment) => {
            const { dislikes, likes } = comment
            totalDisLikes += dislikes
            totalLikes += likes
        }))

        if (totalLikes > 0) {
            return res.status(400).json({
                error: "You cannot dislike this discussion since you have already liked it. Remove the like in order to dislike this discussion"
            })
        }

        if (totalDisLikes < 1) {
            await Comments.create({
                author_id: userId,
                discussion_id,
                dislikes: 1
            })
            res.status(200).json({
                message: "You have disliked the discussion"
            })
        } else {
            const destroyedComment = await Comments.destroy({
                where: {
                    author_id: userId,
                    discussion_id: discussion_id,
                    dislikes: 1
                }
            })
            if (destroyedComment === 1) {
                res.status(200).json({
                    message: "Your dislike for the discussion has been removed"
                })
            }
        }
    } catch (error) {
        console.error("Error occured while disliking the discussion:", error)
        res.status(500).json({
            error: 'Error occured while disliking the discussion'
        })
    }
}

const replyAComment = async (req, res) => {
    const userId = parseInt(req.user.id)
    const schema = Joi.object({
        content: Joi.string(),
        comment_id: Joi.number().required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        })
    }

    // Get the user
    const user = await User.findByPk(userId)

    const { content, comment_id } = req.body
    // Check if discussion exists
    const comment = await Comments.findByPk(comment_id)
    if (!comment) {
        return res.status(400).json({
            error: `Comment with id ${comment_id} does not exist`
        })
    }

    const discussionId = comment.discussion_id
    // Get the discussion
    const discussion = await Discussions.findByPk(discussionId)
    const groupId = discussion.group_id

    // Check if the user is a member of the group that the disucssion belongs to
    const member = await Group_members.findOne({ where: { group_id: groupId, user_id: userId } })
    if (!member) {
        return res.status(400).json({
            error: `User with id ${userId} is not a member of the group with id ${groupId}`
        })
    }
    try {
        const reply = await Replies.create({
            content,
            author_id: userId,
            comment_id
        })
        // Notify the author that someone has reacted to the comment he made
        if (reply) {
            await Notifications.create({
                sender_id: userId,
                receiver_id: comment.author_id,
                group_id: groupId,
                discussion_id: discussion.id,
                content: `${user.username} has reacted to comment you made`,
                status: 'unread'
            })
            res.status(200).json(reply)
        }
    } catch (error) {
        console.error("Error occured while making a reply:", error)
        res.status(500).json({
            error: 'Error occured while making a reply'
        })
    }
}

const likeAComment = async (req, res) => {
    const userId = parseInt(req.user.id)
    const schema = Joi.object({
        comment_id: Joi.number().required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        })
    }

    // Get the user
    const user = await User.findByPk(userId)

    const { comment_id } = req.body

    // Check if discussion exists
    const comment = await Comments.findByPk(comment_id)
    if (!comment) {
        return res.status(400).json({
            error: `Comment with id ${comment_id} does not exist`
        })
    }

    const discussionId = comment.discussion_id
    // Get the discussion
    const discussion = await Discussions.findByPk(discussionId)
    const groupId = discussion.group_id
    // Check if the user is a member of the group that the disucssion belongs to
    const member = await Group_members.findOne({ where: { group_id: groupId, user_id: userId } })
    if (!member) {
        return res.status(400).json({
            error: `User with id ${userId} is not a member of the group with id ${groupId}`
        })
    }
    try {
        const replies = await Replies.findAll({
            where: {
                comment_id: comment_id,
                author_id: userId
            }
        })
        let totalLikes = 0
        let totalDisLikes = 0
        await Promise.all(replies.map(async (reply) => {
            const { likes, dislikes } = reply
            totalLikes += likes
            totalDisLikes += dislikes
        }))

        if (totalDisLikes > 0) {
            return res.status(400).json({
                error: "You cannot like this comment since you have already disliked it. Remove the dislike in order to like this comment"
            })
        }

        if (totalLikes < 1) {
            await Replies.create({
                author_id: userId,
                comment_id,
                likes: 1
            })
            await Notifications.create({
                sender_id: userId,
                receiver_id: discussion.author_id,
                group_id: groupId,
                discussion_id: discussion.id,
                content: `${user.username} likes your comment`,
                status: 'unread'
            })
            res.status(200).json({
                message: "You have liked the comment"
            })
        } else {
            const destroyedReply = await Replies.destroy({
                where: {
                    author_id: userId,
                    comment_id: comment_id,
                    likes: 1
                }
            })
            if (destroyedReply === 1) {
                res.status(200).json({
                    message: "Your like for the comment has been removed"
                })
            }
        }
    } catch (error) {
        console.error("Error occured while liking the comment:", error)
        res.status(500).json({
            error: 'Error occured while liking the comment'
        })
    }
}

const dislikeAComment = async (req, res) => {
    const userId = parseInt(req.user.id)
    const schema = Joi.object({
        comment_id: Joi.number().required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        })
    }

    // Get the user
    const user = await User.findByPk(userId)

    const { comment_id } = req.body

    // Check if discussion exists
    const comment = await Comments.findByPk(comment_id)
    if (!comment) {
        return res.status(400).json({
            error: `Comment with id ${comment_id} does not exist`
        })
    }

    const discussionId = comment.discussion_id
    // Get the discussion
    const discussion = await Discussions.findByPk(discussionId)
    const groupId = discussion.group_id
    // Check if the user is a member of the group that the disucssion belongs to
    const member = await Group_members.findOne({ where: { group_id: groupId, user_id: userId } })
    if (!member) {
        return res.status(400).json({
            error: `User with id ${userId} is not a member of the group with id ${groupId}`
        })
    }
    try {
        const replies = await Replies.findAll({
            where: {
                comment_id: comment_id,
                author_id: userId
            }
        })
        let totalDisLikes = 0
        let totalLikes = 0
        await Promise.all(replies.map(async (reply) => {
            const { likes, dislikes } = reply
            totalDisLikes += dislikes
            totalLikes += likes
        }))

        if (totalLikes > 0) {
            return res.status(400).json({
                error: "You cannot dislike this comment since you have already liked it. Remove the like in order to dislike this comment"
            })
        }

        if (totalDisLikes < 1) {
            await Replies.create({
                author_id: userId,
                comment_id,
                dislikes: 1
            })
            res.status(200).json({
                message: "You have disliked the comment"
            })
        } else {
            const destroyedReply = await Replies.destroy({
                where: {
                    author_id: userId,
                    comment_id: comment_id,
                    dislikes: 1
                }
            })
            if (destroyedReply === 1) {
                res.status(200).json({
                    message: "Your dislike for the comment has been removed"
                })
            }
        }
    } catch (error) {
        console.error("Error occured while disliking the comment:", error)
        res.status(500).json({
            error: 'Error occured while disliking the comment'
        })
    }
}

const getTotalLikesAndDisLikesForADiscussion = async (req, res) => {
    const userId = parseInt(req.user.id)
    const discussionId = parseInt(req.params.discussionId)

    const discussion = await Discussions.findByPk(discussionId)
    const groupId = discussion.group_id

    // Check if the user is a member of the group
    const member = await Group_members.findOne({
        where: {
            user_id: userId,
            group_id: groupId
        }
    })

    if (!member) {
        return res.status(400).json({
            error: "User is not a member of the group"
        })
    }
    try {
        const allComments = await Comments.findAll({
            where: {
                discussion_id: discussionId
            }
        })
        let totalLikes = 0
        let totalDislikes = 0
        await Promise.all(allComments.map(async (comment) => {
            const likes = comment.likes
            const dislikes = comment.dislikes
            totalLikes += likes
            totalDislikes += dislikes
        }))

        res.status(200).json({
            message: `Total likes and dislikes ${discussion.title}`,
            likes: totalLikes,
            dislikes: totalDislikes
        })

    } catch (error) {
        console.error("Error occured getting the likes and dislikes:", error)
        res.status(500).json({
            error: 'Error occured getting the likes and dislikes'
        })
    }
}

const userNotificationsInGroup = async (req, res) => {
    const userId = parseInt(req.user.id)
    const groupId = parseInt(req.params.groupId)
    // Make sure group exists
    const group = await Group.findOne({ where: { id: groupId } })
    if (!group) {
        return res.status(400).json({
            error: `Group with id ${groupId} does not exist`
        })
    }
    // Check if the user is a member of the group
    const member = await Group_members.findOne({ where: { group_id: groupId, user_id: userId } })
    if (!member) {
        return res.status(400).json({
            error: `User with id ${userId} is not a member of the group with id ${groupId}.`
        })
    }

    try {
        const notifications = await Notifications.findAll({
            where: {
                receiver_id: userId,
                group_id: groupId
            }
        })
        // Get the username of the sender
        let result = []
        await Promise.all(notifications.map(async (notification) => {
            const { id, content, sender_id, receiver_id, status, group_id, discussion_id, timestamp } = notification
            const user = await User.findByPk(notification.sender_id)
            const data = {
                id,
                content,
                sender_id,
                receiver_id,
                status,
                group_id,
                discussion_id,
                timestamp,
                sender: user.username
            }
            result.push(data)
        }))
        res.status(200).json({
            message: `All your notification in ${group.name} group`,
            notifications: result
        })
    } catch (error) {
        console.error("Error occured while getting all your notifications:", error)
        res.status(500).json({
            error: 'Error occured while getting all your notifications'
        })
    }
}

const getInviteNotifications = async (req, res) => {
    const userId = parseInt(req.user.id)
    try {
        const allInviteNotifications = await Notifications.findAll({
            where: {
                receiver_id: userId
            }
        })

        let inviteNotifications = []
        await Promise.all(allInviteNotifications.map(async (notification) => {
            if (notification.content === "You have an invitation waiting for your action") {
                const { sender_id, group_id, content, status, createdAt } = notification
                const sender = await User.findByPk(sender_id)
                const group = await Group.findByPk(group_id)
                const data = {
                    sender: sender.name,
                    group: group.name,
                    content,
                    status,
                    createdAt
                }
                inviteNotifications.push(data)
            }
        }))

        res.status(200).json(inviteNotifications)
    } catch (error) {
        console.error("Error occured while getting all invitation notifications:", error)
        res.status(500).json({
            error: 'Error occured while getting all invitation notifications'
        })
    }
}

const getAllNotificationsForAUser = async (req, res) => {
    const userId = parseInt(req.user.id)
    const user = await User.findByPk(userId)
    try {
        const notifications = await Notifications.findAll({
            where: {
                receiver_id: userId
            }
        })

        const allNotifications = await Promise.all(notifications.map(async (notification) => {
            const senderId = notification.sender_id
            const groupId = notification.group_id
            const discussionId = notification.discussion_id && notification.discussion_id
            const sender = await User.findByPk(senderId)
            const group = await Group.findByPk(groupId)
            const discussion = await Discussions.findByPk(discussionId)
            const { id, content, status, createdAt } = notification

            const data = {
                id,
                sender: sender.name,
                group: group.name,
                discussion: discussion && discussion.title,
                content,
                message: content === "You have an invitation waiting for your action" ? `${sender.name} sent you an invitation to join ${group.name} group` : content,
                status,
                createdAt
            }
            return data
        }))

        res.status(200).json({
            message: "All your notifications",
            allNotifications
        })

    } catch (error) {
        console.error("Error occured occured while getting all notifications:", error)
        res.status(500).json({
            error: 'Error occured occured while getting all notifications'
        })
    }
}

const handleDiscussionNotifications = async (req, res) => {
    const userId = parseInt(req.user.id)
    const groupId = parseInt(req.params.groupId)
    const discussionId = parseInt(req.params.discussionId)
    // Make sure group exists
    const group = await Group.findOne({ where: { id: groupId } })
    if (!group) {
        return res.status(400).json({
            error: `Group with id ${groupId} does not exist`
        })
    }
    // Check if the user is a member of the group
    const member = await Group_members.findOne({ where: { group_id: groupId, user_id: userId } })
    if (!member) {
        return res.status(400).json({
            error: `User with id ${userId} is not a member of the group with id ${groupId}. Join the group to see discussions`
        })
    }
    // Check if discussion exists
    const discussion = await Discussions.findByPk(discussionId)
    if (!discussion) {
        return res.status(400).json({
            error: `Discussion with id ${discussionId} does not exist`
        })
    }

    try {
        // Change the status of the notifcation to 'read'
        const notifications = await Notifications.findAll({
            where: {
                receiver_id: userId,
                group_id: groupId,
                discussion_id: discussionId
            }
        })
        let result = []

        await Promise.all(notifications.map(async (notification) => {
            notification.status = 'read'
            await notification.save()

            // Get the discussion with discussionId and its comments
            const discussion = await Discussions.findOne({
                where: {
                    id: discussionId
                },
                attributes: ['id', 'title', 'content', 'author_id'],
                include: [
                    {
                        model: Comments,
                        attributes: ['id', 'content', 'author_id', 'discussion_id', 'likes', 'dislikes'],
                        include: [
                            {
                                model: User,
                                attributes: ['name', 'email', 'username', 'profile_picture', 'country', 'sex', 'hobbies']
                            }
                        ]
                    }
                ]
            })
            let data = {
                status: notification.status,
                discussion
            }
            result.push(data)
        }))
        res.status(200).json(result)
    } catch (error) {
        console.error("Error occured while handling discussion notification:", error)
        res.status(500).json({
            error: 'Error occured while handling discussion notification'
        })
    }
}

const replyComment = async (req, res) => {
    const userId = parseInt(req.user.id)
    const commentId = parseInt(req.params.commentId)
    try {
        // Get the author of the reply
        const author = await User.findByPk(userId)
        // Get the comment 
        const comment = await Comments.findByPk(commentId)
        if (!comment) {
            return res.status(400).json({
                error: `Comment with id ${commentId} does not exists`
            })
        }
        const discussionId = comment.discussion_id
        // Get the discussion
        const discussion = await Discussions.findByPk(discussionId)
        const groupId = discussion.group_id

        // Check if the user is a member of the group
        const member = await Group_members.findOne({ where: { group_id: groupId, user_id: userId } })
        if (!member) {
            return res.status(400).json({
                error: `User with id ${userId} is not a member of the group with id ${groupId} and cannot reply comments under this group`
            })
        }

        const { content, likes, dislikes } = req.body
        // Create a reply 
        const reply = await Replies.create({
            content,
            author_id: userId,
            comment_id: commentId,
            likes
        })
        comment.likes += 1
        await comment.save()
        // Notify the creator of the comment
        await Notifications.create({
            sender_id: userId,
            receiver_id: comment.author_id,
            group_id: discussion.group_id,
            discussion_id: comment.discussion_id,
            content: `${author.username} has reacted to your comment`,
            status: 'unread'
        })
        res.status(201).json(reply)

        if (dislikes) {
            // Check if the user has earlier liked the comment
            const reply = await Replies.create({
                content,
                author_id: userId,
                comment_id: commentId,
                dislikes
            })
            comment.dislikes += 1
            await comment.save()
            // Notify the creator of the comment
            await Notifications.create({
                sender_id: userId,
                receiver_id: comment.author_id,
                group_id: discussion.group_id,
                discussion_id: comment.discussion_id,
                content: `${author.username} has disliked your comment`,
                status: 'unread'
            })
            res.status(201).json(reply)
        }

    } catch (error) {
        console.error("Error occured while replying the comment:", error)
        res.status(500).json({
            error: 'Error occured while replying the comment'
        })
    }
}

const getADiscussion = async (req, res) => {
    const discussionId = parseInt(req.params.discussionId)

    try {
        const disucssion = await Discussions.findByPk(discussionId)
        res.status(200).json(disucssion)
    } catch (error) {
        console.error("Error occured getting a discussion:", error)
        res.status(500).json({
            error: 'Error occured getting a discussion'
        })
    }
}

const deleteNotification = async (req, res) => {
    const userId = parseInt(req.user.id)
    const notificationId = parseInt(req.params.notificationId)
    try {
        const deletedNotification = await Notifications.destroy({
            where: {
                id: notificationId
            }
        })
        if (deletedNotification === 1) {
            res.status(200).json({
                message: "Notification deleted successfully!"
            })
        }
    } catch (error) {
        console.error("Error occured while deleting notification:", error)
        res.status(500).json({
            error: 'Error occured while deleting notification'
        })
    }
}

const deleteAGroup = async (req, res) => {
    const userId = parseInt(req.user.id)
    const groupID = parseInt(req.params.groupId)
    const user = await User.findByPk(userId)
    const group = await Group.findByPk(groupID)
    const groupMembers = await Group_members.findOne({ where: { group_id: groupID } })
    try {
        // Check if the user is the creator of the group
        if (user.id === group.creator_id) {
            // First of all delete the members associated with the group
            if (groupMembers.group_id != null) {
                const deletedMembers = await Group_members.destroy({ where: { group_id: groupID } })
                if (deletedMembers) {
                    // Delete the group
                    const deletedGroup = await Group.destroy({ where: { id: groupID } })
                    if (deletedGroup === 1) {
                        res.status(200).json({
                            message: `Group with id ${groupID} and its members have been deleted`
                        })
                    }
                } else {
                    return res.status(400).json({
                        error: `Error deleting the group`
                    })
                }
            }
        } else {
            return res.status(400).json({
                error: `User with id ${user.id} is not the creator of the group ${groupID}`
            })
        }
    } catch (error) {
        console.error("Error occured while deleting the group:", error)
        res.status(500).json({
            error: 'Error occured while deleting the group'
        })
    }
}

module.exports = {
    createGroup,
    getAllGroups,
    getAGroup,
    sendInviteToJoinAGroup,
    joinAgroup,
    updateAGroup,
    handleInvitationNotification,
    createDiscussion,
    getAllDiscussionsInAGroup,
    getAllCommentsFromADiscussion,
    getACommentByUserInADiscussion,
    makeACommentOnADiscussion,
    getTotalLikesAndDisLikesForADiscussion,
    userNotificationsInGroup,
    getInviteNotifications,
    handleDiscussionNotifications,
    deleteAGroup,
    getAllNotificationsForAUser,
    deleteNotification,
    likeADiscussion,
    dislikeADiscussion,
    replyAComment,
    likeAComment,
    dislikeAComment,
    getADiscussion
}
