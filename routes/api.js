'use strict';

const expect = require('chai').expect;
const mongoose = require('mongoose');
const Issues = require('../models/issues.js');

module.exports = function(app) {

  // Function taken from https://newbedev.com/express-logging-response-body
  function logResponseBody(req, res, next) {
    var oldWrite = res.write,
        oldEnd = res.end;
  
    var chunks = [];
  
    res.write = function (chunk) {
      chunks.push(chunk);
  
      return oldWrite.apply(res, arguments);
    };
  
    res.end = function (chunk) {
      if (chunk)
        chunks.push(chunk);
  
      var body = Buffer.concat(chunks).toString('utf8');
      console.log(req.path, body);
  
      oldEnd.apply(res, arguments);
    };
  
    next();
  }

  function logRequestInfo(req, res, next) {
    console.log('Request Type: ', req.method);
    console.log('Request Data Sent: ', req.body);

    next();
  }
  
  //app.use(logResponseBody);
  //app.use(logRequestInfo);

  // Route to display the complete MongoDB Atlas table
  app.route('/api/issues/')
  .get(function(req, res) {
    Issues.find({}, function(error, data) {
      if (error) return console.log(error);
      res.json(data);
    });
  });

  // Routes for specific issues tied to a project
  app.route('/api/issues/:project')

    // ---------------
    // GET ***********
    // ---------------
    .get(function (req, res) {
      const projectTitle = req.params.project || 'apitest';
      // Get the query parameters from the URL
      const issueText = req.query.issue_text;
      const issueTitle = req.query.issue_text;
      const createdBy = req.query.created_by;
      const assignedTo = req.query.assigned_to;
      const statusText = req.query.status_text;
      const createdOn = req.query.created_on;
      const updatedOn = req.query.updated_on;
      const open = req.query.open;
      const _id = req.query._id;

      // Declare query parameters object
      const queryParams = {};

      // Create regex to be used
      const spaces = /%20/g;

      // Populate query parameters object with parameters (if any)
      // Clean up query parameters with %20 for spaces
      if (projectTitle) queryParams["project_title"] = projectTitle.replace(spaces, " ");
      if (issueText) queryParams["issue_text"] = issueText.replace(spaces, " ");
      if (issueTitle) queryParams["issue_title"] = issueTitle.replace(spaces, " ");
      if (createdBy) queryParams["created_by"] = createdBy.replace(spaces, " ");
      if (assignedTo) queryParams["assigned_to"] = assignedTo.replace(spaces, " ");
      if (statusText) queryParams["status_text"] = statusText.replace(spaces, " ");
      
      // The open, _id, created_on, and updated_on parameters should not have any spaces in them
      // open must have a value of true or false
      // _id must be a valid Object Id to be used by Mongo DB
      // created_on and updated_on should be dates
      if (open) queryParams["open"] = open;
      if (_id) queryParams["_id"] = _id;
      if (createdOn) queryParams["created_on"] = createdOn;
      if (updatedOn) queryParams["updated_on"] = updatedOn; 

      // Print out the query parameters of the request
      // console.log(queryParams);

      // Search the database using the query parameters
      Issues.find(queryParams, (error, data) => {
        if (error) return console.log('hello' + error);
        res.json(data);
      }); 
    })
    
    // --------------
    // POST *********
    // --------------
    .post(function (req, res) {
      const projectTitle = req.params.project || 'apitest';
      const issueTitle = req.query.issue_title || req.body.issue_title;
      const issueText = req.query.issue_text || req.body.issue_text;
      const createdBy = req.query.created_by || req.body.created_by;
      const assignedTo = req.query.assigned_to || req.body.assigned_to;
      const statusText = req.query.status_text || req.body.status_text;

      //console.log(`issue title: ${issueTitle}\nissue text: ${issueText}\nassigned to: ${assignedTo}\nstatus text: ${statusText}\ncreated by: ${createdBy}`);
    
      // Return error message if there's no issue text, issue title, or created by information
      if (!createdBy || !issueTitle || !issueText) {
        res.json({ error: "required field(s) missing" });
        return;
      }
    
      // Access Mongo DB
      Issues.find({}, (error, data) => {
        if (error) {
          return console.log(error);
        }
    
        // Create new Issues object
        const newIssue = new Issues({
          project_title: projectTitle,
          issue_title: issueTitle,
          issue_text: issueText,
          created_by: createdBy,
          assigned_to: assignedTo,
          status_text: statusText
        });
    
        // Save issues object in the Mongo DB database 
        newIssue.save((error, data) => {
          if (error) return console.log(error);
    
          //console.log(data);
          
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

    // --------------
    // PUT *********
    // --------------
    .put(function (req, res) {
      // Get the input of the form or the data sent with the request
      //const projectTitle = req.params.project;
      const issueId = req.body._id || req.query._id || "";
      const issueTitle = req.query.issue_title || req.body.issue_title;
      const issueText = req.query.issue_text || req.body.issue_text;
      const createdBy = req.query.created_by || req.body.created_by;
      const assignedTo = req.query.assigned_to || req.body.assigned_to;
      const statusText = req.query.status_text || req.body.status_text;
      const open = req.query.open || req.body.open;
      //console.log("issue id:", issueId);

      // Check to see if an _id was sent
      if (issueId == "") {
        return res.json({ error: "missing _id"});
      }

      // Make sure the _id is a valid MongoDB Object Id
      try {
        mongoose.Types.ObjectId(issueId);
      } catch (error) {
        return res.json({ error: "could not update", "_id": issueId });
      }

      // Check to see if there are any update fields 
      if ([issueTitle, issueText, createdBy, assignedTo, statusText, open].every(val => val === undefined)) {
        return res.json({ error: "no update field(s) sent", "_id": issueId });
      }

      Issues.findOne({ "_id": issueId }, (error, data) => {
        if (error) {
          return console.log(error);
        }

        // Return an error if the there is no id match 
        if (!data) {
          return res.json({ error: "could not update", "_id": issueId });
        }

        // Store current data
        const currentIssueTitle = data.issue_title;
        const currentIssueText = data.issue_text;
        const currentCreatedBy = data.created_by;
        const currentAssignedTo = data.assigned_to;
        const currentStatusText = data.status_text;
        const currentOpen = data.open;

        const fieldsToUpdate = {}; 

        // Add fields to fieldsToUpdate dictionary if not null
        //if (projectTitle !== "") fieldsToUpdate["project_title"] = projectTitle;
        if (issueTitle !== currentIssueTitle) fieldsToUpdate["issue_title"] = issueTitle;
        if (issueText !== currentIssueText) fieldsToUpdate["issue_text"] = issueText;
        if (createdBy !== currentCreatedBy) fieldsToUpdate["created_by"] = createdBy;
        if (assignedTo !== currentAssignedTo) fieldsToUpdate["assigned_to"] = assignedTo;
        if (statusText !== currentStatusText) fieldsToUpdate["status_text"] = statusText;
        if (open !== currentOpen) fieldsToUpdate["open"] = open;

        //console.log(fieldsToUpdate);
        //console.log(Object.values(fieldsToUpdate));

        if (Object.values(fieldsToUpdate).every(val => val === undefined)) {
          return res.json({ error: "no update field(s) sent", "_id": issueId });
        }

        // Modify the updated_on date
        fieldsToUpdate["updated_on"] = Date.now();

        // Update the entry in the database with the new fields
        Issues.updateOne({ "_id": issueId }, fieldsToUpdate, (error, data) => {
          if (error) {
            return console.log(error); 
          }

          //console.log(data);

          return res.json({ result: "successfully updated", "_id": issueId });

        });

      });

    })
    
    // ----------------
    // DELETE *********
    // ----------------
    .delete(function (req, res) {
      const issueId = req.body._id || req.query._id || "";

      // If no id is input, return an error JSON
      if (issueId === "") {
        res.json({ error: "missing _id" });
        return;
      }

      Issues.findOne({ "_id": issueId }, (error, data) => {
        if (error || !data) {
          res.json({ error: "could not delete", "_id": issueId });
          return; 
        }

        //console.log(data);

        Issues.deleteOne({ "_id": issueId }, (error, data) => {
          if (error) {
            return;
          }

          res.json({ result: "successfully deleted", "_id": issueId });
          return;

        });

      });

    });
    
};
