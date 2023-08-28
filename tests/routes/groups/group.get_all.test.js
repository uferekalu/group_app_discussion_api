const app = require('../../../server.js')
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
chai.use(chaiHttp);

describe('Get All Groups API', () => {
    it('it should return an unauthorized error if the user is not authenticated', async () => {
        const res = await chai.request(app)
            .get('/api/groups/all-groups')

        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.equal(`Access denied. Not authenticated...`)
    })

    it('it should return all groups if the user is authenticated', async () => {
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

        // Make a GET request to get all groups
        const res = await chai.request(app)
            .get('/api/groups/all-groups')
            .set('x-auth-token', data.body.token)

        expect(res).to.have.status(200)
        expect(res.body).to.have.property('allGroups')
        expect(res.body.allGroups).to.equal(res.body.allGroups)

    })
})