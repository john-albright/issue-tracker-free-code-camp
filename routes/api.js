'use strict';

const expect = require('chai').expect;
const mongoose = require('mongoose');
const Issues = require('../models/issues.js');

module.exports = function(app) {

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
    .get(function (req, res){
      const projectTitle = req.params.project || 'apitest';
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
      if (projectTitle) queryParams["project_title"] = projectTitle.replace(spaces, " ");
      if (issueText) queryParams["issue_text"] = issueText.replace(spaces, " ");
      if (issueTitle) queryParams["issue_title"] = issueTitle.replace(spaces, " ");
      if (createdBy) queryParams["created_by"] = createdBy.replace(spaces, " ");
      if (assignedTo) queryParams["assigned_to"] = assignedTo.replace(spaces, " ");
      if (statusText) queryParams["status_text"] = statusText.replace(spaces, " ");
      if (open) queryParams["open"] = open.replace(spaces, " ");

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
    .post(function (req, res){
      const projectTitle = req.params.project || 'apitest';
      const issueTitle = req.query.issue_title || req.body.issue_title;
      const issueText = req.query.issue_text || req.body.issue_text;
      const createdBy = req.query.created_by || req.body.created_by;
      const assignedTo = req.query.assigned_to || req.body.assigned_to;
      const statusText = req.query.status_text || req.body.status_text;

      //console.log(`issue title: ${issueTitle}\nissue text: ${issueText}\ncreated by: ${createdBy}\nnull? ${!issueText}`)
    
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
    .put(function (req, res){
      const projectTitle = req.params.project;
      const issueId = req.body._id || req.query._id || "";

      if (issueId == "") {
        return res.json({ error: "missing _id"});
      }
      
      try {
        mongoose.Types.ObjectId(issueId);
      } catch (error) {
        return res.json({ error: "could not update", "_id": issueId });
      }

      Issues.findOne({ "_id": issueId }, (error, data) => {
        if (error) return console.log(error);

        // Return an error if the there is no id match 
        if (!data) return res.json({ error: "could not update", "_id": issueId });

        // Get the other input of the form 
        const issueTitle = req.query.issue_title || req.body.issue_title || "";
        const issueText = req.query.issue_text || req.body.issue_text || "";
        const createdBy = req.query.created_by || req.body.created_by || "";
        const assignedTo = req.query.assigned_to || req.body.assigned_to || "";
        const statusText = req.query.status_text || req.body.status_text || "";

        const fieldsToUpdate = {}; 

        // Add fields to fieldsToUpdate dictionary if not null
        if (projectTitle !== "") fieldsToUpdate["project_title"] = projectTitle;
        if (issueTitle !== "") fieldsToUpdate["issue_title"] = issueTitle;
        if (issueText !== "") fieldsToUpdate["issue_text"] = issueText;
        if (createdBy !== "") fieldsToUpdate["created_by"] = createdBy;
        if (assignedTo !== "") fieldsToUpdate["assigned_to"] = assignedTo;
        if (statusText !== "") fieldsToUpdate["status_text"] = statusText;

        //console.log(fieldsToUpdate);

        if (Object.keys(fieldsToUpdate).length === 0 || Object.keys(fieldsToUpdate).length === 1 && projectTitle === "apitest") {
          res.json({ error: "no update field(s) sent", "_id": data._id });
          return;
        }

        // Modify the updated_on date
        fieldsToUpdate["updated_on"] = Date.now();

        // Update the entry in the database with the new fields
        Issues.updateOne({ "_id": issueId }, fieldsToUpdate, (error, data) => {
          if (error) return console.log(error); 

          //console.log(data);

          res.json({ result: 'successfully updated', '_id': data._id })

        });

      });

    })
    
    // ----------------
    // DELETE *********
    // ----------------
    .delete(function (req, res){
      const issueId = req.body._id || req.query._id;

      // If no id is input, return an error JSON
      if (issueId === "") {
        res.json({ error: "missing _id" });
        return;
      }

      Issues.findOne({ "_id": issueId }, (error, data) => {
        if (error || !data) {
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
    
};
