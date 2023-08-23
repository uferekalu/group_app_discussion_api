const request = require('supertest')
const app = require('../../server.js')
const bcrypt = require('bcrypt')
const { User } = require('../../models/index.js');
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
chai.use(chaiHttp);

describe('Register User API', () => {
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
        const user = await User.findOne({ where: { email: newUser.email } })
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

    it('should return an error when name is invalid', async () => {
        const newUser = {
            name: 'jo',
            email: 'john@example.com',
            username: 'lushak',
            password: 'password123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to create a user
        const res = await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')

        // Check if the error message includes specific validation error messages
        expect(res.body.error).to.contain(`"name" length must be at least 3 characters long`)
    })

    it('should return an error when username is invalid', async () => {
        const newUser = {
            name: 'john Doe',
            email: 'john@example.com',
            username: 'lu',
            password: 'password123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to create a user
        const res = await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')

        // Check if the error message includes specific validation error messages
        expect(res.body.error).to.contain(`"username" length must be at least 3 characters long`)
    })
    
    it('should return an error when email is invalid', async () => {
        const newUser = {
            name: 'john Doe',
            email: 'joh',
            username: 'lushak',
            password: 'password123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to create a user
        const res = await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')

        // Check if the error message includes specific validation error messages
        expect(res.body.error).to.contain(`"email" must be a valid email`)
    })

    it('should return an error when password is invalid', async () => {
        const newUser = {
            name: 'john Doe',
            email: 'john@example.com',
            username: 'lushak',
            password: 'pa',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to create a user
        const res = await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')

        // Check if the error message includes specific validation error messages
        expect(res.body.error).to.contain('"password" length must be at least 6 characters long')
    })

    it('should return an error when email already exists', async () => {
        const existingUser = {
            name: 'John Luke',
            email: 'john@example.com',
            username: 'lushak',
            password: 'password123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to create a user
        await chai.request(app)
            .post('/api/users/register')
            .send(existingUser)

        // Attempt to create a new user with the same email
        const newUser = {
            name: 'John Clement',
            email: 'john@example.com',
            username: 'lushak',
            password: 'password123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to create a user
        const res = await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        expect(res).to.have.status(409)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal('Email already exists')
    })

    it('should return an error when username already exists', async () => {
        const existingUser = {
            name: 'John Luke',
            email: 'john@example.com',
            username: 'lushak',
            password: 'password123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to create a user
        await chai.request(app)
            .post('/api/users/register')
            .send(existingUser)

        // Attempt to create a new user with the same username
        const newUser = {
            name: 'John Clement',
            email: 'johndds@example.com',
            username: 'lushak',
            password: 'password123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to create a user
        const res = await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        expect(res).to.have.status(409)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`${newUser.username} is already taken`)
    })

    it('should return an error when name is missing', async () => {
        const newUser = {
            email: 'john@example.com',
            username: 'lushak',
            password: 'password123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to create a user
        const res = await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"name" is required`)
    })
    
    it('should return an error when email is missing', async () => {
        const newUser = {
            name: 'John Clement',
            username: 'lushak',
            password: 'password123',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to create a user
        const res = await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"email" is required`)
    })
    
    it('should return an error when password is missing', async () => {
        const newUser = {
            name: 'John Clement',
            email: 'john@example.com',
            username: 'lushak',
            country: 'Nigeria',
            sex: 'Male',
            hobbies: 'football'
        }

        // Make a POST request to create a user
        const res = await chai.request(app)
            .post('/api/users/register')
            .send(newUser)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal(`"password" is required`)
    })
})