const app = require('../../../server.js')
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
chai.use(chaiHttp);

describe('/Get A Single Group API', () => {
    it('it should return an unauthorized error if the user is not authenticated', async () => {
        const res = await chai.request(app)
            .get('/api/groups/single-group/1')

        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Access denied. Not authenticated...`)
    })

    it('it should return an error if the user is not a member of the group', async () => {
        const newUser = {
            name: 'Cristiano Ronaldo',
            email: 'cristiano@example.com',
            username: 'cristiano',
            password: 'cristiano123',
            country: 'Portugal',
            sex: 'Male',
            hobbies: 'football, Tennis'
        }

        // Make a POST request to register a user
        await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        const existingUser = {
            email: 'cristiano@example.com',
            password: 'cristiano123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        // Make a GET request to get a group and its members
        const res = await chai.request(app)
            .get('/api/groups/single-group/4')
            .set('x-auth-token', data.body.token)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`User with id 3 is not a member of Group with id 4`)
    })

    it('it should return the group and its members if the user is authenticated', async () => {
        const existingUser = {
            email: 'johnclement@example.com',
            password: 'johnclement123'
        }

        // Make a POST request to login a user
        const data = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        // Make a GET request to get a group and its members
        const res = await chai.request(app)
            .get('/api/groups/single-group/1')
            .set('x-auth-token', data.body.token)

        expect(res).to.have.status(200)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Group details returned successfully`)
        expect(res.body.groupDetails).to.equal(res.body.groupDetails)
    })
})