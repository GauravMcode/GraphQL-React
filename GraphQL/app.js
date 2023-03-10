const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');  //Create a GraphQL HTTP server

const graphqlSchema = require('./graphql/schema')
const graphqlResolver = require('./graphql/resolvers')
const auth = require('./middleware/auth');

const app = express();

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.cwp7tik.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getTime() + '-' + file.originalname);
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}


// app.use(bodyParser.urlencoded()); // parses req with content-type: x-ww-form-urlencoded
app.use(bodyParser.json());//parses req with content-type: application/json
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));


app.use(express.static(path.join(__dirname, 'images')))


//add headers to every response to config if we allow CORS, methods that can access and header requirements
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*') // '*' means all domains are allowed
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization') //allow only these headers
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
})

app.use(auth);

app.put('/put-image', (req, res, next) => {  //using REST-API to  store image in the images folder
    if (!req.isAuth) {
        throw new Error('Not Authenticated');
    }
    if (!req.file) {
        return res.status(200).json({ message: 'No file provided' })
    }
    if (req.file.oldPath) {
        console.log('deleting old image...');
        clearImage(req.body.oldPath);
    }
    return res.status(201).json({ message: 'file stored', filePath: req.file.filename })
})

app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn: err => {
        if (!err.originalError) {
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const code = err.originalError.code || 500;
        return { message: message, status: code, data: data };
    }
}))

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const data = error.data;
    res.status(status).json({ data: data })
})

mongoose.connect(MONGODB_URI)
    .then(result => {
        const server = app.listen(process.env.PORT || 8080);
    })
    .catch(err => console.log(err))


clearImage = imagePath => {
    const filePath = path.join(__dirname, 'images', imagePath);
    fs.unlink(filePath, err => console.log(err));
}