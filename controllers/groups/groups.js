const express = require('express')
const Joi = require('joi')
const { Group, Group_members } = require('../../models');

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

module.exports = {
    createGroup
}