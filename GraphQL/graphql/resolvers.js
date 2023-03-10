const path = require('path');
const fs = require('fs');

const bcrypt = require('bcryptjs')
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user')
const Post = require('../models/post');


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
    },

    createPost: async function ({ postInput }, req) {
        if (!req.isAuth) {
            const err = new Error('Not Authenticated');
            err.code = 401
            err.data = "User is not logged-in"
            throw err;
        }
        const title = postInput.title;
        const imageUrl = postInput.imageUrl;
        const content = postInput.content;

        //validation check
        const errors = [];
        if (!validator.isLength(title, { min: 5 })) {
            errors.push({ message: 'title is not valid' })
        }
        if (!validator.isLength(content, { min: 5 })) {
            errors.push({ message: 'content is not valid' })
        }
        if (errors.length > 0) {
            const err = new Error('input invalid')
            err.code = 422
            err.data = errors[0].message
            throw err;
        }

        const user = await User.findById(req.userId);
        if (!user) {
            const err = new Error('User not found')
            err.code = 422
            err.data = 'user doesn\'t exists'
            throw err;
        }
        const post = new Post({ title: title, imageUrl: imageUrl, content: content, creator: user });
        const createdPost = await post.save();
        await user.posts.push(createdPost);
        await user.save();
        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            updatedAt: createdPost.updatedAt.toISOString(),
            createdAt: createdPost.createdAt.toISOString()
        }
    },

    getPosts: async function ({ page }, req) {
        if (!req.isAuth) {
            const err = new Error('Not Authenticated');
            err.code = 401
            err.data = "User is not logged-in"
            throw err;
        }
        const currentPage = page || 1;
        const posts_per_page = 2;
        let totalItems;
        // const userId = mongoose.Types.ObjectId(req.userId)
        totalItems = await Post.find().countDocuments()
        const posts = await Post.find()
            .skip((currentPage - 1) * posts_per_page)
            .limit(posts_per_page)
            .sort({ createdAt: -1 })
            .populate('creator')
        return {
            posts: posts.map(post => {
                return {
                    ...post._doc,
                    _id: post._id.toString(),
                    createdAt: post.createdAt.toISOString(),
                    updatedAt: post.updatedAt.toISOString()
                }
            }),
            totalItems: totalItems
        }
    },

    getPost: async function ({ postId }, req) {
        if (!req.isAuth) {
            const err = new Error('Not Authenticated');
            err.code = 401
            err.data = "User is not logged-in"
            throw err;
        }
        const post = await Post.findById(postId).populate('creator');
        if (!post) {
            const err = new Error('Post not found')
            err.code = 404
            err.data = 'Post doesn\'t exists'
            throw err;
        }
        return { ...post._doc, _id: post._id.toString(), createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString() }
    },

    updatePost: async function ({ postId, postInput }, req) {
        //Authentication check
        if (!req.isAuth) {
            const err = new Error('Not Authenticated');
            err.code = 401
            err.data = "User is not logged-in"
            throw err;
        }
        const post = await Post.findById(postId).populate('creator');
        if (!post) {
            const err = new Error('Post not found')
            err.code = 404
            err.data = 'Post doesn\'t exists'
            throw err;
        }
        //Authorization check
        if (post.creator._id.toString() !== req.userId.toString()) {
            const err = new Error('Not Authorized')
            err.code = 403
            err.data = 'Post doesn\'t exists'
            throw err;
        }
        //validation check
        const errors = [];
        if (!validator.isLength(postInput.title, { min: 5 })) {
            errors.push({ message: 'title is not valid' })
        }
        if (!validator.isLength(postInput.content, { min: 5 })) {
            errors.push({ message: 'content is not valid' })
        }
        if (errors.length > 0) {
            const err = new Error('input invalid')
            err.code = 422
            err.data = errors[0].message
            throw err;
        }

        post.title = postInput.title;
        post.content = postInput.content;
        if (postInput.imageUrl !== 'undefined') {
            post.imageUrl = postInput.imageUrl;
        }
        const updatedPost = await post.save();
        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        }
    },

    deletePost: async function ({ postId }, req) {
        //Authentication check
        if (!req.isAuth) {
            const err = new Error('Not Authenticated');
            err.code = 401
            err.data = "User is not logged-in"
            throw err;
        }
        const post = await Post.findById(postId);
        if (!post) {
            const err = new Error('Post not found')
            err.code = 404
            err.data = 'Post doesn\'t exists'
            throw err;
        }
        //Authorization check
        if (post.creator.toString() !== req.userId.toString()) {
            const err = new Error('Not Authorized')
            err.code = 403
            err.data = 'Post doesn\'t exists'
            throw err;
        }
        console.log(post.imageUrl);
        clearImage(post.imageUrl);
        await post.delete();
        const user = await User.findById(req.userId);
        await user.posts.pull(postId)
        await user.save()
        return { message: "Deleted Post Succesfully" }
    },

    getStatus: async function (args, req) {
        const user = await User.findById(req.userId);
        if (!user) {
            const err = new Error('User not found')
            err.code = 404
            err.data = 'User doesn\'t exists'
            throw err;
        }
        return user.status;
    },

    updateStatus: async function ({ status }, req) {
        console.log(status);
        const user = await User.findById(req.userId);
        if (!user) {
            const err = new Error('User not found')
            err.code = 404
            err.data = 'User doesn\'t exists'
            throw err;
        }
        user.status = status;
        const updatedUser = await user.save();
        return updatedUser.status;
    }
}


clearImage = imagePath => {
    const filePath = path.join(__dirname, '..', 'images', imagePath);
    console.log(filePath);
    fs.unlink(filePath, err => console.log(err));
}