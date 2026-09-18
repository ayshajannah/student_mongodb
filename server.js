// ==========================================
// IMPORT MODULES
// ==========================================

const express = require("express");
const fs = require("fs");
const EventEmitter = require("events");
const path = require("path");


// ==========================================
// CREATE EXPRESS APP
// ==========================================

const app = express();

const PORT = 3000;


// ==========================================
// FILE LOCATIONS
// ==========================================

// Location of users.json
const usersFile = path.join(__dirname, "users.json");

// Location of audit.log
const auditFile = path.join(__dirname, "audit.log");


// ==========================================
// MIDDLEWARE
// ==========================================

// Allow Express to read JSON data
app.use(express.json());

// Serve files from the public folder
app.use(express.static(path.join(__dirname, "public")));


// ==========================================
// FUNCTIONS FOR users.json
// ==========================================

// Read users from users.json
function readUsers() {

    const data = fs.readFileSync(usersFile, "utf8");

    return JSON.parse(data);
}


// Save users to users.json
function saveUsers(users) {

    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2),
        "utf8"
    );
}


// ==========================================
// EVENT SYSTEM
// ==========================================

// Create our own EventEmitter
const userEvents = new EventEmitter();


// ==========================================
// SIGNUP EVENT
// ==========================================

userEvents.on("signup", function(user) {

    const message =
        `[${new Date().toISOString()}] SIGNUP: ${user.email}\n`;

    fs.appendFileSync(
        auditFile,
        message,
        "utf8"
    );

    console.log("Signup event recorded:", user.email);
});


// ==========================================
// LOGIN EVENT
// ==========================================

userEvents.on("login", function(user) {

    const message =
        `[${new Date().toISOString()}] LOGIN: ${user.email}\n`;

    fs.appendFileSync(
        auditFile,
        message,
        "utf8"
    );

    console.log("Login event recorded:", user.email);
});


// ==========================================
// SIGN UP ROUTE
// POST /signup
// ==========================================

app.post("/signup", function(req, res) {

    // Get information sent from the browser
    const { name, email, password } = req.body;


    // Check if all information was provided
    if (!name || !email || !password) {

        return res.status(400).json({
            success: false,
            message: "Please fill in all fields."
        });

    }


    // Read existing users
    const users = readUsers();


    // Check whether email already exists
    const existingUser = users.find(function(user) {

        return user.email.toLowerCase() === email.toLowerCase();

    });


    if (existingUser) {

        return res.status(400).json({
            success: false,
            message: "An account with this email already exists."
        });

    }


    // Create new user
    const newUser = {

        name: name,
        email: email,
        password: password

    };


    // Add new user to array
    users.push(newUser);


    // Save updated users
    saveUsers(users);


    // Trigger signup event
    userEvents.emit("signup", newUser);


    // Send success response
    res.json({

        success: true,
        message: "Account created successfully!"

    });

});


// ==========================================
// LOGIN ROUTE
// POST /login
// ==========================================

app.post("/login", function(req, res) {

    // Get email and password
    const { email, password } = req.body;


    // Check that information was provided
    if (!email || !password) {

        return res.status(400).json({

            success: false,
            message: "Please enter your email and password."

        });

    }


    // Read users from users.json
    const users = readUsers();


    // Look for matching email and password
    const user = users.find(function(user) {

        return (
            user.email.toLowerCase() === email.toLowerCase() &&
            user.password === password
        );

    });


    // If no matching user was found
    if (!user) {

        return res.status(401).json({

            success: false,
            message: "Invalid email or password."

        });

    }


    // Trigger login event
    userEvents.emit("login", user);


    // Send successful response
    res.json({

        success: true,
        message: "Login successful!",
        name: user.name

    });

});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, function() {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});
