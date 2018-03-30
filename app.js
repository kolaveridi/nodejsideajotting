const express=require('express');
const app=express();
const  bodyParser = require('body-parser');
const methodOverride = require('method-override')
const  exphbs  = require('express-handlebars');
const mongoose=require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const bcrypt=require('bcryptjs');
const passport=require('passport');
require('./models/User.js');
const User=mongoose.model('users');
require('./config/passport')(passport);

// body parser middleware and just use it
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
// method override middleware
app.use(methodOverride('_method'))
// authentication ensureAuthenticated
const ensureAuthenticated=require('./helpers/auth');
//expressjs session middleware copied from https://github.com/expressjs/session
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,

}))
//passport middleware copied
app.use(passport.initialize());
app.use(passport.session());

//using flash
app.use(flash());
app.use(function(req,res,next){
    res.locals.success_msg=req.flash('success_msg');
    res.locals.error_msg=req.flash('error_msg');
    res.locals.user=req.user || null;
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
app.get('/ideas/add',ensureAuthenticated,function(req,res){
  res.render('ideas/add');
})
//edit idea form
app.get('/ideas/edit/:id',ensureAuthenticated,function(req,res){
  Idea.findOne({
    _id:req.params.id
  })
  .then(idea=>{
    if(idea.user!=req.user.id){
      req.flash('error_msg','Not authorized');
      res.redirect('/ideas');

    }
   else{
     res.render('ideas/edit',{
       idea:idea
     });
   }
  });
});
// idea page
app.get('/ideas',ensureAuthenticated,function(req,res){
  //here user with a specific id can only see his ideas so that's why have user :req.user.id
  Idea.find({user:req.user.id})
  .sort({date:'desc'})
  .then(ideas=>{
    res.render('ideas/index',{
      ideas:ideas
    });
  })
});
// process form
app.post('/ideas',ensureAuthenticated,function(req,res){
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
      details:req.body.details,
      user:req.user.id
    }
    new Idea(newUser)
    .save().
    then(idea=>{res.redirect('/ideas');
     })
  }
});
//https://github.com/expressjs/method-override
app.put('/ideas/:id',ensureAuthenticated,function(req,res){
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
app.delete('/ideas/:id',ensureAuthenticated,function(req,res){
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
// user Logout route
app.get('/users/logout',function(req,res){
  req.logout();
  req.flash('success_msg','You are logged out');
  res.redirect('/users/login');
})

// users login post
app.post('/users/login',function(req,res,next){
 passport.authenticate('local', {
  successRedirect:'/ideas',
  failureRedirect:'/users/login',
  fialureFlash:true
})(req,res,next);
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
    errors.push({text:'Passswords donot match'});
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
  else{
    // check first if user with this name already exists
    User.findOne({email:req.body.email})
    .then(user=>{
       if(user){
         req.flash('error_msg','Email already exist');
         res.redirect('/users/regsiter');
       }
     else{
       const newUser =new User({
         name:req.body.name,
         email:req.body.email,
         password:req.body.password
       });
       bcrypt.genSalt(10,(err,salt)=>{
         bcrypt.hash(newUser.password,salt,(err,hash)=>{
           if(err) throw err;
           newUser.password=hash;
           newUser.save()
           .then(()=>{
                  res.redirect('/users/login');
           });
         });
       });
     }}
   )}
 });
app.listen(3000,()=>console.log(`Server started on ${port}`));
