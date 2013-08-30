AccountController = function () {};

AccountController.create = function () {
    return new AccountController();
};

AccountController.prototype.loadUser = function (callback) {
    $.get("/me",function (result) {
        var user = new User(result);
        callback(user);
    });
};