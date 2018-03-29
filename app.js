const express=require('express');
const app=express();
const  bodyParser = require('body-parser');
const methodOverride = require('method-override')
const  exphbs  = require('express-handlebars');
const mongoose=require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');


// body parser middleware and just use it
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
// method override middleware
app.use(methodOverride('_method'))
//expressjs session middleware copied from https://github.com/expressjs/session
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,

}))
//using flash
app.use(flash());
app.use(function(req,res,next){
    res.locals.success_msg=req.flash('success_msg');
    res.locals.error_msg=req.flash('error_msg');
    next();

});
// note that Vidjot-dev is there in mongodb now
mongoose.connect('mongodb://localhost/VidJot-dev',{
   useMongoClient:true
}).then(()=> console.log('Mongodb connected............................................'));

// load idea model
require('./models/Idea');
const Idea=mongoose.model('ideas');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(function(req,res,next){
console.log(Date.now());
next();
});

var port=3000;
app.get('/',function(req,res){
  const title='Welcome to Yo';
  console.log(req);
  res.render('index',{
    title:title
  });
});
app.get('/about',function(req,res){
  res.render('about');
})
app.get('/home',function(req,res){
  res.render('home');
})
//add idea form
app.get('/ideas/add',function(req,res){
  res.render('ideas/add');
})
//edit idea form
app.get('/ideas/edit/:id',function(req,res){
  Idea.findOne({
    _id:req.params.id
  })
  .then(idea=>{
    res.render('ideas/edit',{
      idea:idea
    });
  });
});
// idea page
app.get('/ideas',function(req,res){
  Idea.find({}).sort({date:'desc'}).then(ideas=>{
    res.render('ideas/index',{
      ideas:ideas
    });
  })
});
// process form
app.post('/ideas',function(req,res){
  var  errors=[];
  if(!req.body.title && !req.body.deatils){
    errors.push({text:'Please Add a title'});
  }

  console.log('errors array length is '+errors.length);
  if(errors.length>0){
     res.render('ideas/add',{
      errors:errors,
      title:req.body.title,
      details:req.body.details
    });
  }
  else{
    const newUser={
      title:req.body.title,
      details:req.body.details
    }
    new Idea(newUser)
    .save().
    then(idea=>{res.redirect('/ideas');
     })
  }
});
//https://github.com/expressjs/method-override
app.put('/ideas/:id',function(req,res){
  Idea.findOne({
    _id:req.params.id
  }).
  then(idea =>{
    idea.title=req.body.title;
    idea.details=req.body.details;
    idea.save().then(idea=>{
      res.redirect('/ideas');
    })

  });
});
// delete  ideas
app.delete('/ideas/:id',function(req,res){
  Idea.remove({
  _id:req.params.id
}).then(()=>{

  res.redirect('/ideas');
  });
});
//User login route
app.get('/users/login',function(req,res){
  res.render('users/login');
});
// user register route
app.get('/users/register',function(req,res){
  res.render('users/register');
});
//Register form post
app.post('/users/register',function(req,res){
  console.log(req.body);
  var errors=[];
  if(req.body.password!=req.body.password2){
    errors.push({text:'Passswords donott match'});
  }
  if(req.body.password.length<4){
    errors.push({text:'Password must be atleast 4 letter word'});
}
  //we don't have to clear the form again even there is anything wrong entered so
  if(errors.length>0){
    res.render('users/register',{
      errors:errors,
      name:req.body.name,
      email:req.body.email,
      password:req.body.password,
      password2:req.body.password2
    });
  }
});
app.listen(3000,()=>console.log(`Server started on ${port}`));
