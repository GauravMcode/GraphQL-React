const bcrypt = require('bcryptjs')
const validator = require('validator');

const User = require('../models/user')

module.exports = {
    async createUser({ userInput }, req) {
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
    }
}