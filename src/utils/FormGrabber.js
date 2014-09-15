var FormGrabber = (function FormGrabberClosure () {
    var FormGrabber = (function () {
        return {
            get : function getFormFields (formElement) {
                var formFields = formElement.elements;
                var data = {};
                for (var x in formFields) {
                    var element = formFields[x];
                    if (element.name) {
                        data[element.name] = (element.type=="checkbox") ? (element.checked) : element.value;
                    }
                }
                return data;
            }
        };
    })();
    return FormGrabber;
    }
)();