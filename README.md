# [Issue Tracker](https://www.freecodecamp.org/learn/quality-assurance/quality-assurance-projects/issue-tracker)

This project is the second of five projects completed for FreeCodeCamp's sixth (final JavaScript) certificate: [Quality Assurance](https://www.freecodecamp.org/learn/quality-assurance/#advanced-node-and-express). The Issue Tracker's [assignment instructions](https://www.freecodecamp.org/learn/quality-assurance/quality-assurance-projects/issue-tracker) and [starter code on GitHub](https://github.com/freeCodeCamp/boilerplate-project-issuetracker/) were provided by FreeCodeCamp. A live demo of the project can be found on [Replit](https://replit.com/@john-albright/issue-tracker-free-code-camp).

The application was created with Express.js (a Node.js framework) to track issues encountered during the creation of a project. To see the entire database of issues, a GET request can be made to the /api/issues. The POST, PUT, and DELETE requests can be made to the route /api/issues/:projectname, requests that can be made using the forms found in the index.html file that displays when the root route is accessed.

Fourteen tests were written for the project using Chai.js HTTP requests testing all the routes and json responses generated. The Mocha.js hooks after() and before() were implemented in the tests/2_functional-tests.js file to clean up database entries created to be used for testing after testing completion. 

