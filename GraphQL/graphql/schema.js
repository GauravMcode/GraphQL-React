const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Post {
        _id : ID!
        title : String!
        imageUrl : String!
        content : String!
        creator : String!
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

    input InputData {
        name : String!
        email : String!
        password : String!
    }

    type RootMutation {
        createUser(userInput : InputData) : User!
    }

    type RootQuery {
        login(email: String!, password : String!) : AuthData!
    }

    schema {
        query : RootQuery
        mutation : RootMutation
    }
`)
/*A helper function to build a GraphQLSchema*/
