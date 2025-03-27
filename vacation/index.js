// IMPORT
const path = require('path');
const express = require('express');
const {check, validationResult, body} = require('express-validator');
const session = require('express-session');
const mongoose = require('mongoose');
const expressApp = express();

// PORT NUMBER
const port = 4003;

let userLoggedIn = false;

// SET
expressApp.set('views', path.join(__dirname, "views"));
expressApp.set("view engine", "ejs");

// USE
expressApp.use(express.urlencoded({extended: false}));
expressApp.use(express.static("public"));
expressApp.use(session({
    secret: 'testSecret',
    resave: false,
    saveUninitialized: true
}));

// CONNECT TO MONGOOSE
mongoose.connect("mongodb://localhost:27017/reservation_station").then( () => {
    console.log("Connected to Mongoose");
}).catch((error) => {
    console.log("Error connecting to Mongoose:" + error);
});

// MONGOOSE MODEL
const reservationDetail = mongoose.model("reservation", {
    fullName: String,
    phone: Number,
    province: String,
    nightNumber: Number,
    vacationSpot: String
});
const signupDetail = mongoose.model("user", {
    email: String,
    password: String
});

// GET EJS PAGES
expressApp.get("/", (req, res) => {
    res.render("main", {userLoggedIn: userLoggedIn});
});
expressApp.get("/about", (req, res) => {
    res.render("about", {userLoggedIn: userLoggedIn});
});
expressApp.get("/signup", (req, res) => {
    res.render("signup", {userLoggedIn: userLoggedIn});
});
expressApp.get("/login", (req, res) => {
    res.render("login", {userLoggedIn: userLoggedIn});
});
expressApp.get("/logout", (req, res) => {
    req.session.destroy();
    userLoggedIn = false;
    res.redirect("/login");
});
expressApp.get("/reservation", (req, res) => {
    res.render("reservation", {userLoggedIn: userLoggedIn});
});
expressApp.get("/allReservations", async (req, res) => {
    let reservations = await reservationDetail.find({}).exec().then().catch();
    console.log(reservations);
    res.render("allReservations", {reservations: reservations, userLoggedIn: userLoggedIn}); 
});
expressApp.get("/allUsers", async (req,res) => {
    let users = await signupDetail.find({}).exec().then().catch();
        console.log(users);
        res.render("allUsers", {users: users,userLoggedIn: userLoggedIn});
});
// Update or Delete users
expressApp.get("/edituser/:id", (req,res) => {
    console.log(req.params.id);

    signupDetail.findByIdAndUpdate({_id: req.params.id}).exec().then( signup => {
        if (signup){
            signup.email = "exampleemail@example.com"
            signup.save();
            res.redirect("/allUsers");
        }
    }).catch((error) => {
        console.log("Error: " + error);
    })
});
expressApp.get("/deleteuser/:id", (req,res) => {
    console.log(req.params.id);

    signupDetail.findByIdAndDelete({_id: req.params.id}).exec().then(() => {
        res.redirect("/allUsers");
    }).catch((error) => {
        console.log("Error: " + error);
    })
});
// Update or Delete reservations
expressApp.get("/editreservation/:id", (req,res) => {
    console.log(req.params.id);

    reservationDetail.findByIdAndUpdate({_id: req.params.id}).exec().then( reservation => {
        if (reservation){
            reservation.nightNumber = 5;
            reservation.save();
            res.redirect("/allReservations");
        }
    }).catch((error) => {
        console.log("Error: " + error);
    })
});
expressApp.get("/deletereservation/:id", (req, res) => {
    console.log(req.params.id);

    reservationDetail.findByIdAndDelete({_id: req.params.id}).exec().then(() => {
        res.redirect("/allReservations");
    }).catch((error) => {
        console.log("Error: " + error);
    });
});

// POST FORMS
expressApp.post("/signupForm", async (req, res) => {
    const signup = await signupDetail.findOne({email: req.body.email}).exec();
    if (signup){
        let errors = "Account already exists";
        userLoggedIn = false;
        res.render("signup", {userLoggedIn: userLoggedIn, errors: errors});
    }
    else{
        let signupObj = new signupDetail({
            email: req.body.email,
            password: req.body.password
        });
    
        signupObj.save().then( () => {
            console.log("Signup data is stored");
        });
    
        userLoggedIn = true;
        res.render("thanks", {userLoggedIn: userLoggedIn});
    }
});
expressApp.post("/loginForm", async (req, res) => {
    const user = await signupDetail.findOne({email: req.body.email}).exec();

    if(user && user.password === req.body.password){
        req.session.email = user.email;
        req.session.userLoggedIn = true;
        userLoggedIn = true;
        console.log("Login successful");
        res.render("thanks", {userLoggedIn: userLoggedIn});
    }
    else{
        userLoggedIn = false;
        let errors = "Email or password is invalid.";
        console.log("Login unsuccessful");
        res.render("login", {errors: errors, userLoggedIn: userLoggedIn})
    }
});
expressApp.post("/reservationForm", [
    check("fullName", "Full name is required").notEmpty(),
    check("phone", "Phone number is required and should be in valid telephone format").isMobilePhone(),
    check("nightNumber", "Number of nights is required and should be a valid number").isInt(),
    check("vacationSpot", "Vacation spot is required").notEmpty()
], (req,res) => {
    const errors = validationResult(req);
    if(errors.isEmpty()){
        let reservationObj = new reservationDetail({
            fullName: req.body.fullName,
            phone: req.body.phone,
            province: req.body.province,
            nightNumber: req.body.nightNumber,
            vacationSpot: req.body.vacationSpot
        });
    
        reservationObj.save().then( () => {
            console.log("Reservation data is stored");
        });
    
        res.render("thanks", {userLoggedIn: userLoggedIn});
    }
    else{
        res.render("reservation", {errors: errors.array(), userLoggedIn: userLoggedIn});
    }
});

// LISTEN TO LOCAL HOST
expressApp.listen(port);
console.log(`Listening to http://localhost:${port}`);