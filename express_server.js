const express = require("express");
const app = express();
const PORT = 8018; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')
const {
    generateRandomString,
    templateVars,
    urlsForUser,
    getUserByEmail,
    isLogged, getDate
} = require("./helpers");
const { Template } = require("ejs");

app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
}))
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// create url object (key: shortUrl value: longUrl)
const urlDatabase = {
    b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "aJ48lW"
    },
    i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW"
    }
};
// create users object(key: userid value: {userid,email,password})
const users = {};

//------------ all the get routes below-------
app.get("/", (req, res) => {
    const userId = req.session.user_id;
    if (isLogged(userId, users)) {
        res.redirect("/urls");
    } else {
        res.redirect("/login");
    };
});
// list of all the urls --shortURL,longURL, createDate, edit, delete
app.get("/urls", (req, res) => {
    const userId = req.session.user_id;
    if (isLogged(userId, users)) {
        //get shortURl and longURL from urlDatabase
        const urls = urlsForUser(userId, urlDatabase);
        return res.render("urls_index", templateVars(urls, userId, users));
    } else {
        return res.status(400).json({
            status: 'error',
            error: "Please sign up or long in first!",
        });
    }
});
// create a new shortURL page
app.get("/urls/new", (req, res) => {
    const userId = req.session.user_id;
    if (isLogged(userId, users)) {
        res.render("urls_new", templateVars(urlDatabase, userId, users));
    } else {
        res.redirect("/login");
    }
});
// browse a longURL from a shoutURl 
app.get("/u/:shortURL", (req, res) => {
    if (urlDatabase[req.params.shortURL]) {
        const longURL = urlDatabase[req.params.shortURL]["longURL"];
        res.redirect(longURL);
    }
    else {
        res.send(" id No found!");
    }

});
// edit page
app.get("/urls/:shortURL", (req, res) => {
    const userId = req.session.user_id;
    const arrShortUrl = Object.keys(urlDatabase);
    const myUrl = Object.keys(urlsForUser(userId, urlDatabase));
    const shortURL = req.params.shortURL;
   
    if (isLogged(userId, users)) {
        if (!arrShortUrl.includes(shortURL)) {
            return res.status(401).send("No found !");
        } else if (myUrl.includes(shortURL)) {

            const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]["longURL"], user: isLogged(userId, users) };
            res.render("urls_show", templateVars);
        } else {
            return res.status(400).json({
                status: 'error',
                error: "Can't access to this url! It doesn't belong to you!",
            });

        }
    } else {
        return res.status(400).json({
            status: 'error',
            error: "Please sign up or long in first!",
        });
    }
});
// registration page
app.get("/register", (req, res) => {
    const userId = req.session.user_id;

    if (isLogged(userId, users)) {
        res.redirect("/urls/");
    } else {
        let template = { user: {} };
        res.render("registration", template);
    }


});
//login page
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
    const longURL = req.body["longURL"];
    const userId = req.session.user_id;

    if (isLogged(userId, users)) {
        let arr = Object.values(urlDatabase);
        const shortURL = generateRandomString();
        urlDatabase[shortURL] = { longURL: req.body["longURL"], userID: userId, date: getDate() };
        res.redirect(`/urls/${shortURL}`);
    } else {
        return res.status(400).json({
            status: 'error',
            error: "Please sign up or long in first!",
        });
    }
});
// delete a shortURL by id
app.post('/urls/:shortURL/delete', (req, res) => {
    const userId = req.session.user_id;
    const arrShortUrl = Object.keys(urlDatabase);
    const myUrl = Object.keys(urlsForUser(userId, urlDatabase));
    const shortURL = req.params.shortURL;

    if (isLogged(userId, users)) {
        if (!arrShortUrl.includes(shortURL)) {
            return res.status(401).send("No found !");
        } else if (myUrl.includes(shortURL)) {
            delete urlDatabase[req.params.shortURL];
            res.redirect('/urls/');
        } else {
            return res.status(401).send("Can't delete this url! It doesn't belong to you!");
        }
    } else {
        return res.status(400).json({
            status: 'error',
            error: "Please sign up or long in first!",
        });
    }
});
// edit a shortURL. put new shortURL into urlDatebase
app.post('/urls/:id', (req, res) => {
    const userId = req.session.user_id;
    if (isLogged(userId, users)) {
        const longURL = urlDatabase[req.params.id];
        const shortURL = generateRandomString();
        delete urlDatabase[req.params.id];
        urlDatabase[shortURL] = { longURL: longURL, userID: userId, date: getDate() };
        res.redirect('/urls/');
    } else {
        return res.status(400).json({
            status: 'error',
            error: "Please sign up or long in first!",
        });
    }
});
// Add user information to usersDatebase
app.post("/register", (req, res) => {
    const email = req.body["username"];
    const password = req.body["password"];

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
    }
    else {
        return res.status(400).json({
            status: 'error',
            error: 'This account already exists! Please log in!',
        });

    }
});
app.post("/login", (req, res) => {
    const email = req.body["username"];
    const password = req.body["password"];
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = getUserByEmail(email, users);
    let isCorrect = false;
    if (user) {
        // Check if username & password are correct
        for (let user in users) {
            const hashedPassword = users[user]["password"];
            if (bcrypt.compareSync(password, hashedPassword) && email === users[user].email) {
                isCorrect = true;
                // Setting session
                req.session.user_id = user;
                res.redirect('/urls/');
                return;
            }
        }
        if (!isCorrect) {
            return res.status(403).json({
                status: 'error',
                error: "Account or password isn't correct!",
            });
        }
    } else {
        return res.status(403).json({
            status: 'error',
            error: "The account doesn't exist!",
        });
    }
});

app.post("/logout", (req, res) => {

    // Clearing the cookie
    req.session.user_id = null;
    res.redirect('/urls/');

});
//app listen port
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});
