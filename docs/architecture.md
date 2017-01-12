# Theodorus Architecture

## Back-End
## Web App
components are small piece of html that are invoked into coming alive using the
invoke command:
<div id="myList" data-type="communityTopicList" data-source="dataSourceId"></div>
app.invoke(document.getElementById('myList'))

The invoker uses the data-type to learn what is component that should be used

The component then connects to the data-source, using app.source(domElm.getAttribute('data-source'))
and is able to provide itself with the proper content

Once data is fetched and processed by the dataSource, ui will display it, assign
functionality to relevant buttons and create sub-components if necessary.

Components are broken down to data-input/output layer (io.js) and
user-interaction (ui.js).

* IO
The Business Layer is responsible to fetch the data from the provided
DataSource, sorting and filtering and eventually sending the View the data.

* UI
provided a ready-to-display data,
