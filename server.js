require('dotenv').config()
const express = require('express')
const app = express()
const logger = require('morgan');
const cors = require('cors')
const userRoutes = require('./routes/users')

app.use(express.json())
app.use(cors())
app.use(logger('dev'))

app.use("/api/users", userRoutes)

const port = process.env.PORT || 4000
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})

module.exports = app
