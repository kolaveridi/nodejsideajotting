
var ensureAuthenticated=function(req,res,next){
    if(req.isAuthenticated()){
      return next();
    }
    else{
      req.flash('error_msg','Not autherized');
      res.redirect('/users/login');
    }
  }
  module.exports =ensureAuthenticated;
