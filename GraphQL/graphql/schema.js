const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Post {
        _id : ID!
        title : String!
        imageUrl : String!
        content : String!
        creator : User!
        createdAt : String!
        updatedAt : String!
    }

    type User {
        _id : ID!
        name : String!
        email : String!
        password : String!
        status : String!
        posts : [Post!]!
    }

    type AuthData {
        token : String!
        userId : String!
    }

    type PostsData {
        posts : [Post!]!
        totalItems : Int!
    }

    type DeleteData {
        message : String!
    }

    input UserInputData {
        name : String!
        email : String!
        password : String!
    }

    input PostInputData {
        title : String!
        imageUrl : String!
        content : String!
    }

    type RootMutation {
        createUser(userInput : UserInputData) : User!
        createPost(postInput : PostInputData) : Post!
        updatePost(postId : ID, postInput : PostInputData) : Post!
        deletePost(postId : ID) : DeleteData!
        updateStatus(status: String): String
    }

    type RootQuery {
        login(email: String!, password : String!) : AuthData!
        getPosts(page: Int!) : PostsData!
        getPost(postId : ID) : Post!
        getStatus : String
    }

    schema {
        query : RootQuery
        mutation : RootMutation
    }
`)
/*A helper function to build a GraphQLSchema*/
