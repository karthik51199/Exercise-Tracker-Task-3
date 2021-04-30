require('dotenv').config();

const express = require('express');
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));

const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://admin-karthik:admin-password@cluster0.nymri.mongodb.net/userExerciseDb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});

const exerciseSchema = {
  description: String,
	duration: String,
	date: String
};

const userSchema = new mongoose.Schema({
  username:{
		type:String,
		unique:true,
    required:true
	},
  exercises:[exerciseSchema]
});

const User = new mongoose.model("User",userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users",function(req,res){
  const username = req.body.username;
  User.findOne({username:username},function(err,user){
    if(err) console.log(err);
    if(user){
      res.send("Username already taken");
    }
    else{
      const newUser = new User({
        username:username,
        exercises:[]
      });
      newUser.save(function(err){
        if(err) console.log(err);
        else{
            res.json({username:newUser.username,_id:newUser._id});
        }
      });
    }
  });
});

app.post("/api/users/:_id/exercises",function(req,res){
  const _id = req.body._id;
  const description=req.body.description;
	const duration=req.body.duration;
	const date=req.body.date;
  User.findById(_id,function(err,user){
    if(err) console.log(err);
    if(user){
      const newExercise = {
        description: description,
        duration: duration,
        date: (new Date(date)).toDateString()
      };
      user.exercises.push(newExercise);
      user.save();
      res.json({
        _id: user._id,
        username: user.username,
        date: newExercise.date,
        duration: newExercise.duration,
        description: newExercise.description
      });
    }
    else{
      res.send("User doesn't exist");
    }
  });
});

app.get("/api/users/:_id/logs",function(req,res){
  const _id = req.params._id;
  let from = new Date("1000-01-01");
  if(req.query.from)
  from = new Date(req.query.from);
  let to = new Date("9999-12-30");
  if(req.query.to)
  to = new Date(req.query.to);
  let limit;
  User.findById(_id,function(err,user){
    if(err) console.log(err);
    if(user){
      if(req.query.limit) limit = req.query.limit;
      else limit = user.exercises.length;
      let myExercises = user.exercises.filter(exercise => (
        new Date(exercise.date) >= from && new Date(exercise.date) <= to
      ));
      myExercises = myExercises.slice(0,limit);
      res.json({
        _id: user._id,
        username: user.username,
        count: myExercises.length,
        log: myExercises
      });
    }
    else{
      res.send("User doesn't exist");
    }
  });
});

app.get("/api/users",function(req,res){
  User.find({},"_id username",function(er,users){
    res.send(users);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
