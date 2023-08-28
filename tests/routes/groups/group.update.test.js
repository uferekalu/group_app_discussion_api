const app = require('../../../server.js')
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai
chai.use(chaiHttp)

describe('Update Group API', () => {
    it('should return an error if the user tries to update without being authenticated', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        const res = await chai.request(app)
            .patch('/api/groups/update-group/1')
            .send(existingUser)

        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Access denied. Not authenticated...`)
    })

    it('should return an error if the authenticated user tries to update a group that does not exist', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .patch('/api/groups/update-group/4')
            .set('x-auth-token', data.body.token)
        
        expect(res).to.have.status(404)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal('Group with id 4 does not exist')
    })
    
    it('should return an error if the authenticated user tries to update a group without name field', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)
        
        const dataVal = {
            description: "This is the updated description"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .patch('/api/groups/update-group/1')
            .set('x-auth-token', data.body.token)
            .send(dataVal)
        
        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"name" is required`)
    })
    
    it('should return an error if the authenticated user tries to update a group without description field', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)
        
        const dataVal = {
            name: "Updated name"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .patch('/api/groups/update-group/1')
            .set('x-auth-token', data.body.token)
            .send(dataVal)
        
        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"description" is required`)
    })
    
    it('should return an error if the authenticated user tries to update a group invalid name', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)
        
        const dataVal = {
            name: "Up",
            description: "This is the updated description"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .patch('/api/groups/update-group/1')
            .set('x-auth-token', data.body.token)
            .send(dataVal)
        
        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"name" length must be at least 3 characters long`)
    })
    
    it('should return an error if the authenticated user tries to update a group invalid description', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)
        
        const dataVal = {
            name: "Updated name",
            description: "This is"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .patch('/api/groups/update-group/1')
            .set('x-auth-token', data.body.token)
            .send(dataVal)
        
        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"description" length must be at least 10 characters long`)
    })
    
    it('should return an error if the authenticated user is not the creator of the group', async () => {
        const existingUser = {
            email: 'cristiano@example.com',
            password: 'cristiano123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)
        
        const dataVal = {
            name: "Updated name",
            description: "This is the updated description"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .patch('/api/groups/update-group/1')
            .set('x-auth-token', data.body.token)
            .send(dataVal)
        
        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`you cannot update this group as you are not the creator`)
    })
    
    it('should update the group when all required fields are provided and authenticated user being the creator of the group', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)
        
        const dataVal = {
            name: "Updated name",
            description: "This is the updated description"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .patch('/api/groups/update-group/1')
            .set('x-auth-token', data.body.token)
            .send(dataVal)
        
        expect(res).to.have.status(200)
        expect(res.body).to.have.property('message')
        expect(res.body).to.have.property('group')
        expect(res.body.message).to.equal(`Group updated successfully`)
        expect(res.body.group).to.equal(res.body.group)
        
    })
})