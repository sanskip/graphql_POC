const express = require('express');
const { buildSchema } = require('graphql');
const graphqlHTTP = require('express-graphql');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('database connected!')
});
var userSchema = mongoose.Schema({
    name: {
        firstName: String,
    lastName: String
    },
    password:String,
    created: {
        type: Date,
        default: Date.now
    }
});
let User = mongoose.model('Users', userSchema);
let _user = new User {
    _id: new mongoose.Types.ObjectId(),
    name: {
        firstName: 'Jamie',
        lastName: 'Munro'
    },
    password: 'admin'
};
_user.save(function(err) {
       if (err) throw err;

       console.log('User successfully saved.');
   });
let port = 3000;

/* Here a simple schema is constructed using the GraphQL schema language (buildSchema).
   More information can be found in the GraphQL spec release */

let schema = buildSchema(`
  type Query {
    postTitle: String,
    blogTitle: String
  }
`);

// Root provides a resolver function for each API endpoint
let root = {
  postTitle: () => {
    return 'Build a Simple GraphQL Server With Express and NodeJS';
  },
  blogTitle: () => {
    return 'scotch.io';
  }
};

const app = express();
app.use('/', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true //Set to false if you don't want graphiql enabled
}));

app.listen(port);
console.log('GraphQL API server running at localhost:'+ port);
