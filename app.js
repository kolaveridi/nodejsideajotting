const express=require('express');
const app=express();
const  bodyParser = require('body-parser');


const  exphbs  = require('express-handlebars');
const mongoose=require('mongoose');
// body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

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
app.listen(3000,()=>console.log(`Server started on ${port}`));
