const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');

const mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost/graphqlpoc',{ useNewUrlParser: true });
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   // we're connected!
//   console.log('database connected!')
// });


//Set up default mongoose connection
const mongoDB = 'mongodb://localhost/graphqlpoc';
mongoose.connect(mongoDB,{ useNewUrlParser: true });
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
const userSchema = mongoose.Schema({
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
const User = mongoose.model('Users', userSchema);

// Construct a schema, using GraphQL schema language

var schema = buildSchema(`
    enum Episode {
      NEWHOPE
      EMPIRE
      JEDI
   }

  interface password {
      password:String
  }
  input UserInput {
    firstName: String
    lastName: String
    password:String
  }

  input MessageInput {
    content: String
    author: String
  }
  type name{
    firstName: String
    lastName: String
  }
  type User implements password{
    id:ID
    name:name
    password:String
    appearsIn: [Episode!]
  }

  type Message {
    id: ID!
    content: String
    author: String
  }

  type Query {
    getMessage(id: ID!): Message,
    getUserById(id:String):User
  }

  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
    addUser(input: UserInput): String
  }
`);

// If Message had any complex fields, we'd put them on this object.
class Message {
  constructor(id, {content, author}) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}

// Maps username to content
var fakeDatabase = {};

var root = {
  getMessage: function ({id}) {
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }
    return new Message(id, fakeDatabase[id]);
  },
  getUserById:async function ({id}) {
    try{
  //  let userArr=await User.find({password:'admin'});
    // let userArr=await User.find({"name.firstName": 'Jamie'});
    //console.log(userArr);
    let resp=await User.findById(id);
    resp.appearsIn=["NEWHOPE","EMPIRE",'JEDI'];

    //return {_id:resp['_id'].toString(),firstName:resp.name.firstName,lastName:resp.name.lastName,password:resp.password};
    return resp;
  }catch(err){
    console.log(err.stack)
  }
  },
  getUserByName:async function ({name}) {
    let resp=await User.findById(name);
    console.log(resp)
    //return {_id:resp['_id'].toString(),firstName:resp.name.firstName,lastName:resp.name.lastName,password:resp.password};
    return resp;
  },
  createMessage: function ({input}) {
    // Create a random id for our "database".
    var id = require('crypto').randomBytes(10).toString('hex');

    fakeDatabase[id] = input;
    return new Message(id, input);
  },
  updateMessage: function ({id, input}) {
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }
    // This replaces all old data, but some apps might want partial update.
    fakeDatabase[id] = input;
    return new Message(id, input);
  },
  addUser:async function({input}){
    const _user = new User({
        _id: new mongoose.Types.ObjectId(),
        name: {
            firstName: input.firstName,
            lastName: input.lastName
        },
        password: input.password
    });

    try{
      let resp=await _user.save();
      return resp['_id'].toString();
    }catch(err){
      console.log(err.stack)
      return err.name;
    }

    // _user.save(function(err,result) {
    //        if (err) throw err;
    //
    //        console.log('User successfully saved.',result);
    //        //return result._id;
    //    });

  }
};

var app = express();
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));
app.listen(4000, () => {
  console.log('Running a GraphQL API server at localhost:4000/graphql');
});


// client Query for get message
// 1.query {
//   getMessage( id:"18d686b8d0662f741c9a") {
//     id,
//     author,
//     content
//   }
// }
// 2.var id = "18d686b8d0662f741c9a";
// var query = `query   GetMessage($id: ID!) {
//     getMessage(id: $id),
// 	{author}
// }`;
//
// fetch('/graphql', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   },
//   body: JSON.stringify({
//     query,
//     variables: { id }
//   })
// })
//   .then(r => r.json())
//   .then(data => console.log('data returned:', data));

// client Query for create Message
// mutation {
//   createMessage(input: {
//     author: "andy",
//     content: "hope is a good thing",
//   }) {
//     id
//   }
// }

//  client Query for update Message
//  mutation {
//   updateMessage(id:"18d686b8d0662f741c9a",
//     input: {
//     author: "andy",
//     content: "hope",
//   }) {
//     id,
//     author,
//     content
//   }
// }
//Aliases query
// query {
//   firstresponse:getUserById( id:"5c10e90858a1694834cbfe81") {
//     _id,
//    firstName,
//    password
//   }
//   secondresponse:getUserById( id:"5c10e90858a1694834cbfe81") {
//     _id,
//    firstName,
//    password
//   }
// query {
//   getUserById( id:"5c10e90858a1694834cbfe81") {
//     id,
//     name{
//       firstName,
//       lastName
//     },
//    password
//   }
// }
query {
  getUserById( id:"5c10e90858a1694834cbfe81") {

    name{
      firstName,
      lastName
    },
   password,
   appearsIn,
   ...on User{
    id
  }
  }
}
