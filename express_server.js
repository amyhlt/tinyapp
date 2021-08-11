const express = require("express");
const app = express();
const PORT = 8018; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')
const { Template } = require("ejs");

app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
}))
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const {
    generateRandomString,
    templateVars,
    urlsForUser,
    getUserByEmail,
    isLogged, getDate
} = require("./helpers");
const { urlDatabase, users } = require("./database/database");

//------------ all the get routes below-------
app.get("/", (req, res) => {
    const userId = req.session.user_id;
    if (isLogged(userId, users)) {
        res.redirect("/urls");
    } else {
        res.redirect("/login");
    };
});

// list of all the urls 
app.get("/urls", (req, res) => {
    const userId = req.session.user_id;
    let errors = [];
    if (isLogged(userId, users)) {
        //get shortURl and longURL from urlDatabase
        const urls = urlsForUser(userId, urlDatabase);
        return res.render("urls_index", templateVars(urls, userId, users));
    } else {
        errors.push({ msg: "Please sign up or long in first!" });
        res.render('login', { errors, user: {} });
    }
});
// create a new shortURL for a longURL 
app.get("/urls/new", (req, res) => {
    const userId = req.session.user_id;
    let errors = [];
    if (isLogged(userId, users)) {
        res.render("urls_new", templateVars(urlDatabase, userId, users));
    } else {
        errors.push({ msg: "Please sign up or long in first!" });
        res.render('login', { errors, user: {} });
    }
});
// browse a longURL by a shoutURl 
app.get("/u/:shortURL", (req, res) => {
    const userId = req.session.user_id;
    const arrShortUrl = Object.keys(urlDatabase);
    let errors = [];
    const { shortURL } = req.params;
    //check if this shortURL in the urlDatabase
    if (arrShortUrl.includes(shortURL)) {
      const longURL = urlDatabase[shortURL]["longURL"];
      res.redirect(longURL);  
    } else  {
        errors.push({ msg: "This shortURL isn't found!" });
        res.render('nonexist', { errors, user: isLogged(userId, users)});
    }
});
// edit URL page
app.get("/urls/:shortURL", (req, res) => {
    const userId = req.session.user_id;
    const arrShortUrl = Object.keys(urlDatabase);
    const urls = urlsForUser(userId, urlDatabase);
    const myUrl = Object.keys(urls);
    const shortURL = req.params.shortURL;
    let errors = [];

    if (isLogged(userId, users)) {
        //check if this shortURL in the urlDatabase
        if (arrShortUrl.includes(shortURL)) {
            // check if it is this user's URL
            if (myUrl.includes(shortURL)) {
                const templateVars = {
                    shortURL: shortURL,
                    longURL: urlDatabase[shortURL]["longURL"],
                    user: isLogged(userId, users)
                };
                res.render("urls_show", templateVars);
            }
            if (!myUrl.includes(shortURL)) {
                errors.push({ msg: "Can't access to this url! It doesn't belong to you!" });
                res.render('nonexist', { errors, user:isLogged(userId, users) });
            }
        }
        if (!arrShortUrl.includes(shortURL)) {
            errors.push({ msg: "This shortURL isn't found!" });
            res.render('nonexist', { errors, user: isLogged(userId, users)});
        }
    }
    if (!isLogged(userId, users)) {
        errors.push({ msg: "Please sign up or long in first!" });
        res.render('login', { errors, user: {} });
    }
});
// registration page by fill out Email and password
app.get("/register", (req, res) => {
    const userId = req.session.user_id;

    if (isLogged(userId, users)) {
        res.redirect("/urls/");
    } else {
        let template = { user: {} };
        res.render("registration", template);
    }
});
//login page by fill out Email and password
app.get("/login", (req, res) => {
    const userId = req.session.user_id;

    if (isLogged(userId, users)) {
        res.redirect("/urls/");
    } else {
        let template = { user: {} };
        res.render("login", template);
    }
});
//---------------all the post routes below-----
// create a new shortURL for longURL and add it to urlDatabase
app.post("/urls", (req, res) => {
    let errors = [];
    const longURL = req.body["longURL"];
    const userId = req.session.user_id;

    if (isLogged(userId, users)) {
        let arr = Object.values(urlDatabase);
        const shortURL = generateRandomString();
        urlDatabase[shortURL] = {
            longURL: req.body["longURL"],
            userID: userId,
            date: getDate()
        };
        res.redirect(`/urls/${shortURL}`);
    } else {
        errors.push({ msg: "Please sign up or long in first!" });
        res.render('login', { errors, user: {} });
    }
});
// delete a shortURL by id
app.post('/urls/:shortURL/delete', (req, res) => {
    const userId = req.session.user_id;
    const arrShortUrl = Object.keys(urlDatabase);
    const myUrl = Object.keys(urlsForUser(userId, urlDatabase));
    const shortURL = req.params.shortURL;
    let errors = [];
    if (isLogged(userId, users)) {
        if (arrShortUrl.includes(shortURL)) {
            if (myUrl.includes(shortURL)) {
                delete urlDatabase[req.params.shortURL];
                res.redirect('/urls/');
            }
            if (!myUrl.includes(shortURL)) {

                errors.push({ msg: "Can't delete this url! It doesn't belong to you!" });
                res.render('urls_index', { errors, user: {} });
            }
        }
        if (!arrShortUrl.includes(shortURL)) {
            errors.push({ msg: "This shortURL isn't found!" });
            res.render('urls_index', { errors, urls:{},user: {} });
        }
    }
    if (!isLogged(userId, users)) {
        errors.push({ msg: "Please sign up or long in first!" });
        res.render('login', { errors, user: {} });
    }
});
// edit a URL. put new URL into urlDatebase
app.post('/urls/:id', (req, res) => {
    const userId = req.session.user_id;
    const urlId = req.params.id;
    const longURL = req.body.longURL;
    let errors = [];
    if (isLogged(userId, users)) {
        delete urlDatabase[urlId];
        urlDatabase[urlId] = { longURL: longURL, userID: userId, date: getDate() };
        res.redirect('/urls/');
    } else {                                                        g
        errors.push({ msg: "Please sign up or long in first!" });
        res.render('login', { errors, user: {} });
    }
});
// check if user exists
// If user exists, go to login page, otherwise 
// Add user information to usersDatebase
app.post("/register", (req, res) => {
    const email = req.body["username"];
    const password = req.body["password"];
    let errors = [];

    const user = getUserByEmail(email, users);

    if (!user) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        let userId = generateRandomString();
        const newUser = {
            id: userId,
            email: email,
            password: hashedPassword
        };
        users[userId] = newUser;
        req.session.user_id = userId;
        res.redirect('/urls/');
    } else {
        errors.push({ msg: 'email already registered' });
        res.render('registration', { errors, email, password, user: {} })
    }
});
// check if the user exists
// check if email and password are correct
app.post("/login", (req, res) => {
    const email = req.body["username"];
    const password = req.body["password"];
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = getUserByEmail(email, users);
    let isCorrect = false;
    let errors = [];
    if (user) {
        // Check if username & password are correct
        for (let user in users) {
            const hashedPassword = users[user]["password"];
            const passwordCheck = bcrypt.compareSync(password, hashedPassword);
            if (passwordCheck && email === users[user].email) {
                isCorrect = true;
                // Setting session
                req.session.user_id = user;
                res.redirect('/urls/');
                return;
            }
        }
        if (!isCorrect) {
            errors.push({ msg: 'Email or password is incorrect!' });
            res.render('login', { errors, email, password, user: {} });
        }
    }
    if (!user) {
        errors.push({ msg: "The account doesn't exist!" });
        res.render('login', { errors, email, password, user: {} });
    }
});
// logout and clear cookie
app.post("/logout", (req, res) => {

    // Clearing the cookie
    req.session.user_id = null;
    res.redirect('/urls/');

});
//app listen port
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});
