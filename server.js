'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const expect      = require('chai').expect;
const cors        = require('cors');
const mongoose    = require('mongoose');
require('dotenv').config();

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');
const Issues            = require('./models/issues.js');

let app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

// Connect MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Sample front-end
app.route('/:project/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/issue.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//Route to display the complete MongoDB Atlas table
app.route('/api/issues/apitest')
  .get(function(req, res) {

    // Get the query parameters from the URL
    const issueText = req.query.issue_text;
    const issueTitle = req.query.issue_text;
    const createdBy = req.query.created_by;
    const assignedTo = req.query.assigned_to;
    const statusText = req.query.status_text;
    const open = req.query.open;

    // Declare query parameters object
    const queryParams = {};

    // Create regex to be used
    const spaces = /%20/g;

    // Populate query parameters object with parameters (if any)
    // Clean up query parameters with %20 for spaces
    if (issueText) queryParams["issue_text"] = issueText.replace(spaces, " ");
    if (issueTitle) queryParams["issue_title"] = issueTitle.replace(spaces, " ");
    if (createdBy) queryParams["created_by"] = createdBy.replace(spaces, " ");
    if (assignedTo) queryParams["assigned_to"] = assignedTo.replace(spaces, " ");
    if (statusText) queryParams["status_text"] = statusText.replace(spaces, " ");
    if (open) queryParams["open"] = open.replace(spaces, " ");

    // Print out the query parameters of the request
    console.log(queryParams);

    // Search the database using the query parameters
    Issues.find(queryParams, (error, data) => {
      if (error) return console.log(error);
      res.json(data);
    });

  })
  .post(function(req, res) {
    const issueTitle = req.body.issue_title;
    const issueText = req.body.issue_text;
    const createdBy = req.body.created_by;
    const assignedTo = req.body.assigned_to;
    const statusText = req.body.status_text;

    // Return error message if there's no issue text, issue title, or created by information
    if (!issueText || !issueTitle || !createdBy) {
      res.json({error: "required field(s) missing"});
    }

    // Access Mongo DB
    Issues.find({}, (error, data) => {
      if (error) {
        return console.log(error);
      }

      // Create new Issues object
      const newIssue = new Issues({
        issue_title: issueTitle,
        issue_text: issueText,
        created_by: createdBy,
        assigned_to: assignedTo,
        status_text: statusText
      });

      // Save issues object in the Mongo DB database 
      newIssue.save((error, data) => {
        if (error) return console.log(error);

        console.log(data);
        
        // Create JSON to be returned
        const issuesObject = {
          "assigned_to": data.assigned_to,
          "status_text": data.status_text,
          "open": data.open,
          "_id": data._id,
          "issue_title": data.issue_title,
          "issue_text": data.issue_text,
          "created_by": data.created_by,
          "created_on": data.created_on,
          "updated_on": data.updated_on
        };

        // Return the JSON object with all the information
        res.json(issuesObject);

      });
    });
  })
  .put(function(req, res) {
    const issueId = req.body._id;

    Issues.findOne({ "_id": issueId }, (error, data) => {
      if (error) return console.log(error);

      // Return an error if the there is no id match 
      if (!data) res.json({ error: "missing _id" });

      // Get the other input of the form 
      const issueTitle = req.body.issue_title;
      const issueText = req.body.issue_text;
      const createdBy = req.body.created_by;
      const assignedTo = req.body.assigned_to;
      const statusText = req.body.status_text;

      const fieldsToUpdate = {}; 

      // Add fields to fieldsToUpdate dictionary if not null
      if (issueTitle !== "") fieldsToUpdate["issue_title"] = issueTitle;
      if (issueText !== "") fieldsToUpdate["issue_text"] = issueText;
      if (createdBy !== "") fieldsToUpdate["created_by"] = createdBy;
      if (assignedTo !== "") fieldsToUpdate["assigned_to"] = assignedTo;
      if (statusText !== "") fieldsToUpdate["status_text"] = statusText;

      // console.log(fieldsToUpdate);

      if (Object.keys(fieldsToUpdate).length === 0) {
        res.json({ error: "no update field(s) sent", "_id": data._id });
        return;
      }

      // Modify the updated_on date
      fieldsToUpdate["updated_on"] = Date.now();

      // Update the entry in the database with the new fields
      Issues.updateOne({ "_id": issueId }, fieldsToUpdate, (error, data) => {
        if (error) return console.log(error); 

        console.log(data);

        res.json({ result: 'successfully updated', '_id': data._id })

      });

    });
  })
  .delete(function(req, res) {
    const issueId = req.body._id;

    // If no id is input, return an error JSON
    if (issueId === "") {
      res.json({ error: "missing _id" });
      return;
    }

    Issues.findOne({ "_id": issueId }, (error, data) => {
      if (error) {
        res.json({ error: "could not delete", _id: issueId });
        return; 
      }

      //console.log(data);

      Issues.deleteOne({ "_id": issueId }, (error, data) => {
        if (error) {
          return console.log(error);
        }

        res.json({ result: "successfully deleted", _id: data._id });
        return;

      });

    });
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 3500);
  }
});

module.exports = app; //for testing
