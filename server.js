const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()
const dbConnect = require('./config/dbConnect')
const initRoutes = require('./routes')
const cookieParser = require('cookie-parser')

const app = express()
const port = process.env.PORT || 8888


app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
dbConnect()
initRoutes(app)
app.use('/', (req, res) => {
    res.send('SERVER ON')
})

app.listen(port, () => {
    console.log('Server running on the port: ' + port)
})