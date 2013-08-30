/*Credentials = function () {
    this.user = null;
}

Credentials.getCurrentUser = function(callback) {
    var This = this;

    $.get(SERVER_URL + "me",
          function (response) {
            This.getCurrentUserCallback(response);
            callback(response);
          }
    );
}

Credentials.getCurrentUserCallback = function (response) {
    this.user = response;
}

Credentials.initSigninForm = function (form) {
    new ScriptLoader([   "/lib/md5.js",
        "/lib/Barrett.js",
        "/lib/BigInt.js",
        "/lib/RSA.js"],function(){ alert ("here")});
    var This = this;
    form.onsubmit = function () {
        var data = getFormFields(this),
            password =data["password"];
        data["password"] = md5(password);
        data["md5"] = true;
        setCookie("password",data["password"]);
        setCookie("email",data["email"]);
        $.post("/signin",data,ExternalWindow.windowCallback);
        return false;
    }
}

Credentials.initSignupForm = function (form) {
    new ScriptLoader([   "/lib/md5.js",
        "/lib/Barrett.js",
        "/lib/BigInt.js",
        "/lib/RSA.js"],function(){});
    document.getElementById("su_password").onkeyup = this.verifyPasswordComplexity;
    var This = this;
    form.onsubmit = function () {
        var data = getFormFields(this),
            password =data["password"],
            passwordRepeat =data["password-repeat"];
        if (password == passwordRepeat) {
            data["password"] = md5(password); //TODO: RSA on top of the md5
            data["password-repeat"] = md5(passwordRepeat);
            data["md5"] = true;
            setCookie("password",data["password"]);
            setCookie("email",data["email"]);
            $.post("/signup",data,ExternalWindow.windowCallback);
        } else {
            transform(document.getElementById("su_messages"),"<error message='passwords-dont-match' />");
        }

        return false;
    }
}

Credentials.verifyPasswordComplexity = function (event) {
    var password=  event.target.value;
    if (/(?=^.{8,}$)(?=.*\d)(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/.test(password)) {
        console.log ("password is Super Secure Complex Password");
    } else if (/(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/.test(password)) {
        console.log ("password is complex");
    } else if (/(?=^.{6,}$)(?=.*\d)(?=.*[A-Za-z]).*$/.test(password)) {
        console.log ("password is moderate");
    } else if (/[a-zA-Z0-9\_\-]{3,}$/i.test(password)) {
        console.log ("password is weak");
    } else {
        console.log ("password is too weak");
    }
}*/