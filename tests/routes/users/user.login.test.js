const app = require('../../../server.js')
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
chai.use(chaiHttp);

describe('Login User API', () => {
    it('it should return an error when email is missing', async () => {
        const existingUser = {
            password: 'password123'
        }

        // Make a POST request to login a user
        const res = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"email" is required`)
    })

    it('it should return an error when password is missing', async () => {
        const existingUser = {
            email: 'john@example.com',
        }

        // Make a POST request to login a user
        const res = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"password" is required`)
    })

    it('should return an error when email is invalid', async () => {
        const existingUser = {
            email: 'joh',
            password: 'password123'
        }

        // Make a POST request to login a user
        const res = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"email" must be a valid email`)
    })

    it('should return an error when password is invalid', async () => {
        const existingUser = {
            email: 'john@example.com',
            password: 'pa'
        }

        // Make a POST request to login a user
        const res = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"password" length must be at least 6 characters long`)
    })

    it('should return an error when a user is not found', async () => {
        const existingUser = {
            email: 'jon@example.com',
            password: 'password123'
        }

        // Make a POST request to login a user
        const res = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`Invalid credentials`)
    })

    it('should return an error when password does not match', async () => {
        const newUser = {
            name: 'John Doe',
            email: 'johnnny@example.com',
            username: 'lushak12',
            password: 'password123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to register a user
        await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        const existingUser = {
            email: 'johnnny@example.com',
            password: 'password1'
        }

        // Make a POST request to login a user
        const res = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`Invalid credentials`)
    })
    
    it('should return a token upon successful login', async () => {
        const existingUser = {
            email: 'johnnny@example.com',
            password: 'password123'
        }

        // Make a POST request to login a user
        const res = await chai.request(app)
            .post('/api/users/login')
            .send(existingUser)

        expect(res).to.have.status(200)
        expect(res.body).to.have.property('message')
        expect(res.body).to.have.property('token')
        expect(res.body.message).to.equal(`Login successfull`)
        expect(res.body.token).to.equal(`${res.body.token}`)
    })
})