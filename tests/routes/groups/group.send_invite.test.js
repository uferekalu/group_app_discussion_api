const app = require('../../../server.js')
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
chai.use(chaiHttp);

describe('Send Invite API', () => {
    it('it should return an unauthorized error if an unauthenticated user tries to send an invitation', async () => {
        const username = "uferepeace"

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .post('/api/groups/send-invitation/1')
            .send(username)

        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Access denied. Not authenticated...`)
    })

    it('it should return an error when an authenticated user tries to send an invitation without username', async () => {
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
            .post('/api/groups/send-invitation/1')
            .set('x-auth-token', data.body.token)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"username" is required`)
    })

    it('should return an error when an authenticated user tries to send an invitation with invalid username', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }
        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const user = {
            username: "uf"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .post('/api/groups/send-invitation/1')
            .set('x-auth-token', data.body.token)
            .send(user)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"username" length must be at least 3 characters long`)
    })

    it('it should return an error when the group does not exist', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }
        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const newUser = {
            name: 'Goodnews Emeka',
            email: 'goodnewsemeka@example.com',
            username: 'goodnewsemeka',
            password: 'goodnewsemeka123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        const user = {
            username: "goodnewsemeka"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .post('/api/groups/send-invitation/4')
            .set('x-auth-token', data.body.token)
            .send(user)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`Group with id 4 is not found`)
    })

    it('should return an error when the user is not the creator of the group', async () => {
        const existingUser = {
            email: 'goodnewsemeka@example.com',
            password: 'goodnewsemeka123'
        }
        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const user = {
            username: "lushak"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .post('/api/groups/send-invitation/1')
            .set('x-auth-token', data.body.token)
            .send(user)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`User with name Goodnews Emeka is not the creator of the group with name JavaScript Programming`)
    })

    it('should return an error when the username does not exist', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const user = {
            username: "clementina"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .post('/api/groups/send-invitation/1')
            .set('x-auth-token', data.body.token)
            .send(user)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`User with username ${user.username} does not exist`)
    })

    it('should return an error when the user is already a member of the group', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const user = {
            username: "johnclement"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .post('/api/groups/send-invitation/1')
            .set('x-auth-token', data.body.token)
            .send(user)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`User with name John Clement and id 2 is already a member of JavaScript Programming group`)
    })

    it('should send an invitation to join the group when all required data are provided', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const user = {
            username: "goodnewsemeka"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .post('/api/groups/send-invitation/1')
            .set('x-auth-token', data.body.token)
            .send(user)

        expect(res).to.have.status(201)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(res.body.message)
    })
})