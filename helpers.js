//Generate shortUrl for urls and userid for users
const generateRandomString = function () {
    const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz123456789";
    let n = t.length;
    let str = "";
    for (i = 0; i < 6; i++)
        str += t.charAt(Math.floor(Math.random() * n));
    return str;
};
const getDate = function () {
    let today = new Date();
    let dd = today.getDate();

   let mm = today.getMonth() + 1;
   let yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }
    today = mm + '-' + dd + '-' + yyyy;
    return today;
}
// Pass this template including urls & user to each page
const templateVars = function (urlDatabase, userid,userDatabse) {
    const template = { urls: urlDatabase, user: isLogged(userid,userDatabse) };
    return template;
}
const urlsForUser = function (id, urlData) {
    let urls = {};
    for (let url in urlData) {
        if (id === urlData[url]["userID"]) {
            urls[url] = {longURL: urlData[url]["longURL"],date:urlData[url]["date"]};
        }
    };
    return urls;
}
// check if there is a cookie. If cookie, return the object of a user.Otherwise return {}
const isLogged = function (userid, userDatabse) {
    if (userid) {
        for (let user in userDatabse) {
            if (userid === user) {
                return userDatabse[user];
            }
        }
    }
}
//check if email already exists.return false: If no exist
const getUserByEmail = function (email, database) {
    for (let user in database) {
        if (email === database[user]["email"]) {
            return database[user];
        }
    }

};

module.exports ={ 
    generateRandomString, 
    templateVars, 
    urlsForUser, 
    getUserByEmail, 
    isLogged,getDate
};