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

    input InputData {
        name : String!
        email : String!
        password : String!
    }

    type RootMutation {
        createUser(userInput : InputData) : User!
    }

    type RootQuery {
        text : String
    }

    schema {
        query : RootQuery
        mutation : RootMutation
    }
`)
/*A helper function to build a GraphQLSchema*/
