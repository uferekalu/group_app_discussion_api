const app = require('../../../server.js')
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
chai.use(chaiHttp);

describe('Create Group API', () => {
    it('it should return an unauthorized error when name is missing and user is unauthenticated', async () => {
        const newGroup = {
            description: 'This is the description of the group'
        }

        // Make a POST request to create a group
        const res = await chai.request(app)
            .post('/api/groups/create-group')
            .send(newGroup)

        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Access denied. Not authenticated...`)
    })

    it('it should return an unauthorized error when description is missing and user is unauthenticated', async () => {
        const newGroup = {
            name: 'JavaScript Programming'
        }

        // Make a POST request to create a group
        const res = await chai.request(app)
            .post('/api/groups/create-group')
            .send(newGroup)

        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Access denied. Not authenticated...`)
    })

    it('it should return an unauthorized error when name is invalid and user is unauthenticated', async () => {
        const newGroup = {
            name: 'Ja',
            description: 'This is the description of the group'
        }

        // Make a POST request to create a group
        const res = await chai.request(app)
            .post('/api/groups/create-group')
            .send(newGroup)

        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Access denied. Not authenticated...`)
    })

    it('it should return an unauthorized error when description is invalid and user is unauthenticated', async () => {
        const newGroup = {
            name: 'JavaScript Programming',
            description: 'This'
        }

        // Make a POST request to create a group
        const res = await chai.request(app)
            .post('/api/groups/create-group')
            .send(newGroup)

        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Access denied. Not authenticated...`)
    })

    it('it should return an error when name is missing and user is authenticated', async () => {
        const newUser = {
            name: 'John Clement',
            email: 'johnclement@example.com',
            username: 'johnclement',
            password: 'johnclement123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to register a user
        await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const newGroup = {
            description: 'This is the description of the group'
        }

        // Make a POST request to create a group with authentication
        const res = await chai.request(app)
            .post('/api/groups/create-group')
            .set('x-auth-token', data.body.token)
            .send(newGroup)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"name" is required`)
    })

    it('it should return an error when description is missing and user is authenticated', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const newGroup = {
            name: 'JavaScript Programming',
        }

        // Make a POST request to create a group with authentication
        const res = await chai.request(app)
            .post('/api/groups/create-group')
            .set('x-auth-token', data.body.token)
            .send(newGroup)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"description" is required`)
    })

    it('should return an error when name is invalid and user is authenticated', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const newGroup = {
            name: 'Ja',
            description: 'This is the description of the group'
        }

        // Make a POST request to create a group with authentication
        const res = await chai.request(app)
            .post('/api/groups/create-group')
            .set('x-auth-token', data.body.token)
            .send(newGroup)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"name" length must be at least 3 characters long`)
    })
    
    it('should return an error when description is invalid and user is authenticated', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const newGroup = {
            name: 'JavaScript Programming',
            description: 'This is'
        }

        // Make a POST request to create a group with authentication
        const res = await chai.request(app)
            .post('/api/groups/create-group')
            .set('x-auth-token', data.body.token)
            .send(newGroup)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"description" length must be at least 10 characters long`)
    })

    it('it should create a group when all required fields are provided and user authenticated', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const newGroup = {
            name: 'JavaScript Programming',
            description: 'This is the description of the group'
        }

        // Make a POST request to create a group with authentication
        const res = await chai.request(app)
            .post('/api/groups/create-group')
            .set('x-auth-token', data.body.token)
            .send(newGroup)

        // console.log(res)
        expect(res).to.have.status(201)
        expect(res.body).to.have.property('message')
        expect(res.body).to.have.property('group')
        expect(res.body.message).to.equal(`Group with name ${newGroup.name} created successfully`)
        expect(res.body.group).to.equal(res.body.group)
    })

    it('it should return an error if the group already exists', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const newGroup = {
            name: 'JavaScript Programming',
            description: 'This is the description of the group'
        }

        // Make a POST request to create a group with authentication
        const res = await chai.request(app)
            .post('/api/groups/create-group')
            .set('x-auth-token', data.body.token)
            .send(newGroup)

        expect(res).to.have.status(409)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal('Group already exists')
    })
})