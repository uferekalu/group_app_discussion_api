const request = require('supertest')
const app = require('../../server.js')
const bcrypt = require('bcrypt')
const { User } = require('../../models');
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
chai.use(chaiHttp);

describe('User API', () => {
    it('should create a new user with hashed password', async () => {
        const newUser = {
            name: 'John Doe',
            email: 'john@example.com',
            username: 'lushak',
            password: 'password123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(newUser.password, 10)

        // Make a POST request to create a user
        const res = await request(app)
            .post('/api/users/register')
            .send({ ...newUser, password: hashedPassword })

        expect(res).to.have.status(201)
        expect(res.body).to.have.property('message')
        expect(res.body).to.have.property('user')
        expect(res.body.user.name).to.equal(newUser.name)
        expect(res.body.user.email).to.equal(newUser.email)
        expect(res.body.user.username).to.equal(newUser.username)
        expect(res.body.user.country).to.equal(newUser.country)
        expect(res.body.user.sex).to.equal(newUser.sex)
        expect(res.body.user.hobbies).to.equal(newUser.hobbies)

        // Check if user was saved in the database
        const user = await User.findOne({ where: { email: newUser.email }})
        expect(user).to.exist
        expect(user.name).to.equal(newUser.name)
        expect(user.email).to.equal(newUser.email)
        expect(user.username).to.equal(newUser.username)
        expect(user.country).to.equal(newUser.country)
        expect(user.sex).to.equal(newUser.sex)
        expect(user.hobbies).to.equal(newUser.hobbies)

        // Verify the hashed password
        const isPasswordValid = await bcrypt.compare(newUser.password, hashedPassword)
        expect(isPasswordValid).to.be.true
    })
})