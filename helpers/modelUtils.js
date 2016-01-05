(function modelUtilsEnclosure() {
    function toList (list) {
        var items = [];
        var i, listLength = list.length;
        for ( i = 0; i < listLength; i++) {
            items.push(list[i].toJSON());
        }
        return items;
    }

    exports.toList = toList;
})();