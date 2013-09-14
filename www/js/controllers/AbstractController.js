Theodorus.Controller =  Class.extend({
    init: function (io) {
        _.bindAll(this, "render");
        this.io = io;
        if (this.view) {
            this.view.setController(this);
        }
    },

    render: function (callback) {
        var This = this;
        this.view.render(function () {
            This.setup();
            if (callback) {
                callback();
            }
        });
        return this;
    },

    setup: function (callback) {
        this.view.setup(function () {
            if (callback) {
                callback();
            }
        });
        return this;
    }
});

