const app = require('../../../server.js')
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai
chai.use(chaiHttp)

describe('Create A Discussion API', () => {
    it('should return an error if an unauthenticated user tries to create a discussion', async () => {
        const data = {
            title: "Discussion",
            content: "This is the discussion",
            groupId: 1
        }

        const res = await chai.request(app)
            .post('/api/groups/create-a-discussion')
            .send(data)

        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Access denied. Not authenticated...`)
    })

    it("should return an error if an authenticated user tries to create a group without a title or content or groupId", async () => {
        const newUser = {
            name: 'James Rodriguez',
            email: 'jamesrodriguez@example.com',
            username: 'jamesrodriguez',
            password: 'jamesrodriguez123',
            country: 'Columbia',
            sex: 'Male',
            hobbies: 'football, Tennis'
        }

        // Make a POST request to register a user
        await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        const existingUser = {
            email: 'jamesrodriguez@example.com',
            password: 'jamesrodriguez123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const dataVal = {
            title: "Discussion",
            content: "This is the discussion",
            groupId: 1
        }

        const res = await chai.request(app)
            .post('/api/groups/create-a-discussion')
            .set('x-auth-token', data.body.token)
            .send(dataVal)

        if (!dataVal.title) {
            expect(res).to.have.status(400)
            expect(res.body).to.have.property('error')
            expect(res.body.error).to.equal(`"title" is required`)
        }
        if (!dataVal.content) {
            expect(res).to.have.status(400)
            expect(res.body).to.have.property('error')
            expect(res.body.error).to.equal(`"content" is required`)
        }
        if (!dataVal.groupId) {
            expect(res).to.have.status(400)
            expect(res.body).to.have.property('error')
            expect(res.body.error).to.equal(`"groupId" is required`)
        }
    })

    it('should return an error if the group with groupId does not exists', async () => {
        const existingUser = {
            email: 'jamesrodriguez@example.com',
            password: 'jamesrodriguez123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const dataVal = {
            title: "Discussion",
            content: "This is the discussion",
            groupId: 20
        }

        const res = await chai.request(app)
            .post('/api/groups/create-a-discussion')
            .set('x-auth-token', data.body.token)
            .send(dataVal)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal("Group with id 20 does not exist, specify the right group to start discussion on")
    })
})