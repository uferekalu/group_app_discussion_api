const app = require('../../../server.js')
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai
chai.use(chaiHttp)

describe('Handle Invite Notification API', () => {
    it('should return an error if an unauthenticated user tries to see the notification', async () => {
        const data = {
            status: "accepted",
            groupId: 1
        }

        const res = await chai.request(app)
            .post('/api/groups/handle-invite-notification')
            .send(data)

        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Access denied. Not authenticated...`)
    })

    it('should return an error if the authenticated user tries to respond to the invite with no status field', async () => {
        const newUser = {
            name: 'Nathaniel Banabas',
            email: 'nathaniel@example.com',
            username: 'nathaniel',
            password: 'nathaniel123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        const existingUser = {
            email: 'nathaniel@example.com',
            password: 'nathaniel123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const dataVal = {
            groupId: 1
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .post('/api/groups/handle-invite-notification')
            .set('x-auth-token', data.body.token)
            .send(dataVal)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"status" is required`)
    })

    it('should return an error if the authenticated user tries to respond to the invite with no groupId field', async () => {
        const newUser = {
            name: 'Nathaniel Banabas',
            email: 'nathaniel@example.com',
            username: 'nathaniel',
            password: 'nathaniel123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        const existingUser = {
            email: 'nathaniel@example.com',
            password: 'nathaniel123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const dataVal = {
            status: "accepted"
        }

        // Make a POST request to send an invite
        const res = await chai.request(app)
            .post('/api/groups/handle-invite-notification')
            .set('x-auth-token', data.body.token)
            .send(dataVal)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"groupId" is required`)
    })

    it('it should make the authenticated user a member of the group when the status="accepted"', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        const user = {
            username: "nathaniel"
        }

        // Make a POST request to send an invite
        await chai.request(app)
            .post('/api/groups/send-invitation/1')
            .set('x-auth-token', data.body.token)
            .send(user)

        const existingUser2 = {
            email: 'nathaniel@example.com',
            password: 'nathaniel123'
        }

        // Make a POST request to login a user
        const data1 = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser2)

        const dataVal = {
            status: "accepted",
            groupId: 1
        }
        if (dataVal.status === "accepted") {
            // Make a POST request to send an invite
            const res = await chai.request(app)
                .post('/api/groups/handle-invite-notification')
                .set('x-auth-token', data1.body.token)
                .send(dataVal)

            expect(res).to.have.status(200)
            expect(res.body).to.have.property('message')
            expect(res.body.message).to.equal(`User with id 4 is now a member of group with id 1`)
        }
        
        if (dataVal.status === "declined") {
            // Make a POST request to send an invite
            const res = await chai.request(app)
                .post('/api/groups/handle-invite-notification')
                .set('x-auth-token', data1.body.token)
                .send(dataVal)

            expect(res).to.have.status(200)
            expect(res.body).to.have.property('message')
            expect(res.body.message).to.equal(`We respect your decision to decline the invitation. Feel free to join whenever you like!`)
        }
    })
})