const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

const session = require('express-session');
app.set('trust proxy', 1) 
app.use(session({
  secret: 'skol',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}))

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/loginReg');

var UserSchema = new mongoose.Schema({
    first_name: {type: String, required: true, minlength: 3},
    last_name: {type: String, required: true, minlength: 3},
    email: {type: String, required: true, minlength: 3},
    password: {type: String, required: true, minlength: 3},
    birthday: {type: Date, required: true},
}, {timestamps: true})

var User = mongoose.model('User', UserSchema);
mongoose.Promise = global.Promise;

//----------------------------------------------------------------------------

app.get('/', function(req, res){
    res.render('index')
})

app.get('/success', function(req, res){
    if(req.session.loggedin == true){
        res.render('success');
    }
    else{
        console.log('you are not logged in');
        res.redirect('/')
    }
})

app.post('/login', function(req, res){
    User.findOne({email:req.body.email}, function(err, user){
        if (err) {
            console.log('something went wrong');
            res.redirect('/');
        }
        else {
            if(user){
                console.log("hashed pass is: " + user.password);
                const typedPass = req.body.password;
                const hashPass = user.password;
                bcrypt.compare(typedPass, hashPass, function(err, pass){
                    if(pass){
                        console.log("phew, we got in");
                        req.session.id = user._id;
                        req.session.email = user.email;
                        req.session.loggedin = true;
                        res.redirect('/success')
                    }
                    else{
                        console.log("incorrect password");
                        res.redirect('/');
                    }
                });
            }
        }
    })
})

app.post('/register', function(req, res){
    console.log("POST DATA", req.body);
    bcrypt.hash(req.body.password, 10, function(err, passHash) {
        if(err){
            console.log(err);
        }
        else{
            var user = new User({
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                email: req.body.email,
                password: passHash,
                birthday: req.body.DOB
            });
            user.save(function(err){
                if(err){
                    console.log('something went wrong');
                    res.redirect('/')
                }else{
                    console.log('sucessfully added a user!');
                    res.redirect('success')
                }
            })
        }
    });
})

app.listen(8000, function() {
    console.log("listening on port 8000");
})
