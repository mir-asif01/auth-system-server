const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000
const bcrypt = require('bcrypt')

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("Server is running")
})

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://student_ms:99nDkwmJyJwvKDl2@cluster0.mtnbd39.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {

    const userCollection = client.db('auth_system').collection('users')

    try {

        app.get('/user', async (req, res) => {
            const query = {}
            const allUsers = await userCollection.find(query).toArray()
            res.send(allUsers)
        })
        app.get("/user/:name", async (req, res) => {
            const name = req.params.name
            const query = { name: name }
            const user = await userCollection.findOne(query)
            res.send(user)
        })

        // signUp a new user 
        app.post('/signUp', async (req, res) => {
            const user = req.body

            // const result = await userCollection.insertOne(user)
            // res.send(result)

            const { email, name, password } = user
            const existedUser = await userCollection.findOne({ name: name })

            // console.log(typeof (existedUser));
            if (!existedUser) {
                const hashedPassword = await bcrypt.hash(password, 10)
                const result = await userCollection.insertOne({ email, name, hashedPassword })
                res.send(result)
                return
            }
            else if (email === existedUser.email || name === existedUser.name) {
                const responseMesssage = {
                    message: 'Duplicate username/email'
                }
                res.send(responseMesssage)
                return
            }
        })

        // login via email and password
        app.post('/login', async (req, res) => {
            const user = req.body
            let { email, password } = user
            let existedUser = await userCollection.findOne({ email: email })

            //setting the response message for login request
            let responseMesssage = {
                message: 'Login Failed'
            }
            if (!existedUser) {
                responseMesssage.message = "No user found on DB"
                res.send(responseMesssage)
                return
            }
            if (existedUser) {
                const isPasswordmatched = await bcrypt.compare(password, existedUser.hashedPassword).then(result => {
                    if (result) {
                        responseMesssage.message = "Login Successful"
                        res.send(responseMesssage)
                    }
                    else {
                        responseMesssage.message = "Incorrect Password"
                        res.send(responseMesssage)
                    }
                })
            }
        })
    } finally {

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`The app is running on http://localhost:${port}`);
})