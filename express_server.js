const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};
const users = {};

const generateRandomString = function () {
    const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz123456789";
    let n = t.length;
    let str = "";
    for (i = 0; i < 6; i++)
        str += t.charAt(Math.floor(Math.random() * n));
    return str;
};
const templateVars = function (userid) {
    const template = { urls: urlDatabase, user: checkLogged(userid) };
    return template;
}
const checkLogged = function (userid) {
    for (let user in users) {
        if (userid === user) {
            return users[user];
            break;
        }
    }
    return {};
}
//check if email already exists
// return false: no exist
const isExistEmail = function(email,res){
    for (let user in users) {
        if ( email === users[user]["email"]) {
           return true;
        }
    }
    return false;
}
app.get("/", (req, res) => {
    res.send("Hello!");
});
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.get("/urls/new", (req, res) => {
    res.render("urls_new", templateVars(req.cookies['user_id'] ));
});
app.get("/urls", (req, res) => {
    res.render("urls_index", templateVars(req.cookies['user_id'] ));
});

app.get("/urls/:shortURL", (req, res) => {
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: checkLogged(req.cookies['user_id'] ) };
    res.render("urls_show", templateVars);
});
app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
});
app.get("/register", (req, res) => {
    res.render("registration");
});
app.get("/login", (req, res) => {
    res.render("login");
});
app.post("/urls", (req, res) => {
    if (!Object.values(urlDatabase).includes(req.body["longURL"])) {
        const shortURL = generateRandomString();
        urlDatabase[shortURL] = req.body["longURL"];
        res.redirect(`/urls/${shortURL}`);
    } else {
        res.send("longURL already exits. You can edit it!");
        res.redirect('/urls/');
    }
});
app.post('/urls/:shortURL/delete', (req, res) => {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls/');
});
app.post('/urls/:id', (req, res) => {
    const longURL = urlDatabase[req.params.id];
    const shortURL = generateRandomString();
    delete urlDatabase[req.params.id];
    urlDatabase[shortURL] = longURL;
    res.redirect('/urls/');
});
app.post("/register", (req, res) => {
    const email = req.body["username"];
    const password = req.body["password"];
    if (!isExistEmail(email, res)) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        let userId = generateRandomString();
        const newUser = {
            id: userId,
            email: email,
            password: hashedPassword
        };
        users[userId] = newUser;
        console.log(users);
        res.cookie("user_id", userId);
        res.redirect('/urls/');
    }
    else {
        res.status(400);
        res.send('This account already exists! Please log in!');   
    }
});
app.post("/login", (req, res) => {
    const email = req.body["username"];
    const password = req.body["password"];
    if (!email || !password) {
        res.send("Please enter Username and Password!");
    } else {
        const hashedPassword = bcrypt.hashSync(password, 10);
        let isCorrect = false;
        // if isExistEmail() is false, return a response with a 403 status code
        if (!isExistEmail(email,res)){
            res.status(403).render("This account doesn't exist!");
        } else {
            // Check if username & password are correct
            for (let user in users) {
                const hashedPassword = users[user]["password"];
                if (email === users[user].email )
                 
                  if (bcrypt.compareSync(password, hashedPassword)) {
                    isCorrect = true;
                    console.log(isCorrect);
                    // Setting cookie (key-value)
                    res.cookie('user_id', user);
                    res.redirect('/urls/');
                    return;
                }
            }
        }
        if (!isCorrect) {
            res.status(403).render("Account or password is correct!");;
        }

    }
});

app.post("/logout", (req, res) => {

    // Clearing the cookie
    for (let user in users) {
        if (req.cookies['user_id'] === user) {
            res.clearCookie('user_id');
            res.redirect('/urls/');
            break;
        }
    }
});
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});
