require('dotenv').config()
const express = require('express')
const app = express()
const logger = require('morgan');
const cors = require('cors')
const userRoutes = require('./routes/users/users')
const groupRoutes = require('./routes/groups/groups')

app.use(express.json())
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}))
app.use("/uploads", express.static('uploads'))
app.use(cors())
app.use(logger('dev'))

app.use("/api/users", userRoutes)
app.use('/api/groups', groupRoutes)

const port = process.env.PORT || 4000
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})

module.exports = app
