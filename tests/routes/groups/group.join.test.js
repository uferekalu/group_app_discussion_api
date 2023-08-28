const app = require('../../../server.js')
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai
chai.use(chaiHttp)

describe('Join Group API', () => {
    it('should return an error when an unauthenticated user tries to join a group', async () => {
        const res = await chai.request(app)
            .post('/api/groups/join-a-group/1')

        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Access denied. Not authenticated...`)
    })

    it('should return an error if the an authenticated user is already a member of the group', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const res = await chai.request(app)
            .post('/api/groups/join-a-group/1')
            .set('x-auth-token', data.body.token)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal('User with name John Clement and id 2 is already a member of JavaScript Programming group')
    })

    it('should join the group if the user is authenticated and the group exists', async () => {
        const existingUser = {
            email: 'cristiano@example.com',
            password: 'cristiano123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const res = await chai.request(app)
            .post('/api/groups/join-a-group/1')
            .set('x-auth-token', data.body.token)

        expect(res).to.have.status(200)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal('User with name Cristiano Ronaldo and id 3 has joined JavaScript Programming group')
    })
})