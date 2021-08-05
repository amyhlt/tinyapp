const express = require("express");
const app = express();
const PORT = 8018; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');

app.use(cookieParser());
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

//Generate shortUrl for urls and userid for users
const generateRandomString = function () {
    const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz123456789";
    let n = t.length;
    let str = "";
    for (i = 0; i < 6; i++)
        str += t.charAt(Math.floor(Math.random() * n));
    return str;
};
// Pass this template including urls & user to each page
const templateVars = function (urlDatabase, userid) {
  const template = { urls: urlDatabase, user: isLogged(userid) };
  return template;
}
const urlsForUser = function(id) {
    let urls = {};
    for (let url in urlDatabase) {
        if (id === urlDatabase[url]["userID"]) {
            urls[url] = urlDatabase[url]["longURL"];
        }
    };
    return urls;
}
// check if there is a cookie. If cookie, return the object of a user.Otherwise return {}
const isLogged = function (userid) {
    if (userid) {
        for (let user in users) {
            if (userid === user) {
                return users[user];
                break;
            }
        }
    }
    return false;
}
//check if email already exists.return false: If no exist
const isExistEmail = function (email) {
    for (let user in users) {
        if (email === users[user]["email"]) {
            return true;
        }
    }
    return false;
}
app.get("/", (req, res) => {
    res.send("Hello!");
});
//------------ all the get routes below-------
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.get("/urls/new", (req, res) => {
    const userId = req.cookies['user_id'];
    if (isLogged(userId)) {
        res.render("urls_new", templateVars(urlDatabase, userId));
    } else {
        res.redirect("/login");
    }
});
app.get("/urls", (req, res) => {
    const userId = req.cookies['user_id'];
    if (isLogged(userId)) {
        //get shortURl and longURL from urlDatabase
       return res.render("urls_index", templateVars(urlsForUser(userId), userId));
    } else {
        return res.redirect("/login");
    }
});

app.get("/urls/:shortURL", (req, res) => {
    const userId = req.cookies['user_id'];
    const arrShortUrl = Object.keys(urlDatabase);
    const myUrl = Object.keys(urlsForUser(userId));
    const shortURL = req.params.shortURL;

    if (isLogged(userId)) {
        if (!arrShortUrl.includes(shortURL)) {
            return res.status(401).send("No found !");
        } else if (myUrl.includes(shortURL)) {
          const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]["longURL"], user: isLogged(userId) };
          res.render("urls_show", templateVars);
        } else {
            return res.status(401).send("Can't access to this url! It doesn't belong to you!");
        }  
    } else {
        return res.status(401).send("Please longin or register first!");
    }
});
app.get("/u/:shortURL", (req, res) => {
    if (urlDatabase[req.params.shortURL]) {
        const longURL = urlDatabase[req.params.shortURL]["longURL"];
        res.redirect(longURL);
    }
    else {
        res.send("No found!");
    }

});
app.get("/register", (req, res) => {
    res.render("registration");
});
app.get("/login", (req, res) => {
    res.render("login");
});
//---------------all the post routes below-----
// create a new shortURL for longURL and add it to urlDatabase
app.post("/urls", (req, res) => {
    const longURL = req.body["longURL"];
    const userId = req.cookies['user_id'];
    if (longURL) {
        let arr = Object.values(urlDatabase);
        const shortURL = generateRandomString();
        urlDatabase[shortURL] = { longURL: req.body["longURL"], userID: userId };
        res.redirect(`/urls/`);
    } else {
        res.status(401).send("LongURL shoud not be empty!");
    }
});
app.post('/urls/:shortURL/delete', (req, res) => {
    const userId = req.cookies['user_id'];
    const arrShortUrl = Object.keys(urlDatabase);
    const myUrl = Object.keys(urlsForUser(userId));
    const shortURL = req.params.shortURL;
    
    if (isLogged(userId)) {
        if (!arrShortUrl.includes(shortURL)) {
            return res.status(401).send("No found !");
        } else if (myUrl.includes(shortURL)) {
            delete urlDatabase[req.params.shortURL];
            res.redirect('/urls/');
        } else {
            return res.status(401).send("Can't delete this url! It doesn't belong to you!");
        }  
    } else {
        return res.status(401).send("Please longin or register first!");
    }
});
app.post('/urls/:id', (req, res) => {
    const userId = req.cookies['user_id'];
    if (isLogged(userId)) {
        const longURL = urlDatabase[req.params.id];
        const shortURL = generateRandomString();
        delete urlDatabase[req.params.id];
        urlDatabase[shortURL] = longURL;
        res.redirect('/urls/');
    } else {
        res.redirect("/login");
    }
});
app.post("/register", (req, res) => {
    const email = req.body["username"];
    const password = req.body["password"];
    if (!isExistEmail(email)) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        let userId = generateRandomString();
        const newUser = {
            id: userId,
            email: email,
            password: hashedPassword
        };
        users[userId] = newUser;
        res.cookie("user_id", userId);
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
    if (!email || !password) {
        return res.status(401).send("Please enter Username and Password!");
    } else {
        const hashedPassword = bcrypt.hashSync(password, 10);
        let isCorrect = false;
        
        if (!isExistEmail(email, res)) {
            return res.status(403).render("This account doesn't exist!");
        } else {
            // Check if username & password are correct
            for (let user in users) {
                const hashedPassword = users[user]["password"];
                if (bcrypt.compareSync(password, hashedPassword) && email === users[user].email) {
                    isCorrect = true;
                    // Setting cookie (key-value)
                    res.cookie('user_id', user);
                    res.redirect('/urls/');
                    return;
                }
            }
        }
        // if isExistEmail() is false, return a response with a 403 status code
        if (!isCorrect) { 
            return res.status(403).json({
                status: 'error',
                error: "Account or password isn't correct!",
            });
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
//app listen port
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});
