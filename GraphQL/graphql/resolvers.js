const bcrypt = require('bcryptjs')
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user')

module.exports = {
    createUser: async function ({ userInput }, req) {
        const email = userInput.email;
        const name = userInput.name;
        const password = userInput.password;
        const errors = [];

        //validation check
        if (!validator.isEmail(email)) {
            errors.push({ message: 'Email is not valid' })
        }
        if (!validator.isLength(password, { min: 5 })) {
            errors.push({ message: 'password is not valid' })
        }
        if (errors.length > 0) {
            const err = new Error('input invalid')
            err.code = 422
            err.data = errors[0].message
            throw err;
        }


        const isALreadyUser = await User.findOne({ email: email });
        if (isALreadyUser) {
            const err = new Error('input invalid')
            err.code = 422
            err.data = 'email already exists'
            throw err;
        }
        const hashPW = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            name: name,
            password: hashPW
        })
        const createdUSer = await user.save();
        return { ...createdUSer._doc, _id: createdUSer._id.toString() }
    },

    login: async function ({ email, password }, req) {
        const user = await User.findOne({ email: email });
        console.log(user);
        if (!user) {
            const err = new Error('Log-in failed')
            err.code = 401
            err.data = 'No user with this email exists'
            throw err;
        }
        const isAuthenticated = await bcrypt.compare(password, user.password);
        if (!isAuthenticated) {
            const err = new Error('Log-in failed')
            err.code = 401
            err.data = 'password is incorrect'
            throw err;
        }
        const token = jwt.sign({ email: email, userId: user._id.toString() }, 'somesupersecretkey', { expiresIn: '1h' });
        return { token: token, userId: user._id.toString() }
    }
}