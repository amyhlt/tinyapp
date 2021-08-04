const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
app.use(cookieParser())

app.set("view engine", "ejs");
const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};
const generateRandomString = function () {
  const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz123456789";
  let n = t.length;
  let str = "";
  for (i = 0; i < 6; i++) 
    str += t.charAt(Math.floor(Math.random() * n));
    return str;
};

app.use(bodyParser.urlencoded({ extended: true }));
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
    const templateVars = {
        username: req.cookies["username"]
      };
    res.render("urls_new",templateVars);
});
app.get("/urls", (req, res) => {
    
    const templateVars = { urls: urlDatabase ,  username: req.cookies['username']};
   
    res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"]};
    res.render("urls_show", templateVars);
});
app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL];
   
    res.redirect(longURL);
});

app.post("/urls", (req, res) => {
    
   
  if (!Object.values(urlDatabase).includes(req.body["longURL"])){
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = req.body["longURL"];
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.send("longURL already exits. You can edit it!");
    res.redirect('/urls/');
  }
    
});
app.post('/urls/:shortURL/delete',(req, res) => {
    
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls/');
});
app.post('/urls/:id',(req, res) => {
    const longURL =urlDatabase[req.params.id];
    
    const shortURL = generateRandomString();
    delete urlDatabase[req.params.id];
    urlDatabase[shortURL] =longURL;
    
    res.redirect('/urls/');
});
app.post("/login",(req,res) =>{
    const userName = req.body["username"];
     // Setting cookie (key-value)
     res.cookie('username', userName);

    res.redirect('/urls/');
});

app.post("/logout",(req,res) =>{
    
   // Clearing the cookie
   res.clearCookie('username');
    res.redirect('/urls/');
});
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});
