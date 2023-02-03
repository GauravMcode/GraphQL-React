const bcrypt = require('bcryptjs')

const User = require('../models/user')

module.exports = {
    async createUser({ userInput }, req) {
        const email = userInput.email;
        const name = userInput.name;
        const password = userInput.password;
        const isALreadyUser = await User.findOne({ email: email });
        if (isALreadyUser) {
            throw Error('User ALready exists')
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