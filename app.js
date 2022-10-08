/**
 * Donovan Kong & Dan Temereanca
 * CSE 154
 * Final Project
 *
 * This is the app.js for our final project. This contains
 * all the endpoints necessary for backend functionality, such as
 * getting a list of all courses, validating logins and new user
 * creations, and enrolling a user in one or more courses.
 */

"use strict";

const express = require('express');
const app = express();
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const multer = require('multer');
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(multer().none());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
const SERVER_ERR_CODE = 500;
const USER_ERR_CODE = 400;
const COOKIE_EXPIRATION_TIME = 86400000;

/**
 * Creates an account for a user.
 */
app.post('/create', async (req, res) => {
  let user = req.body.username;
  let pass = req.body.password;
  try {
    let db = await getDBConnection();
    let checkDuplicateQuery = "SELECT username FROM users WHERE username = ?";
    let duplicates = await db.get(checkDuplicateQuery, [user]);
    if (duplicates) {
      res.type('text');
      res.status(USER_ERR_CODE).send('That username already exists!');
    } else {
      let query = "INSERT INTO users (username, password) VALUES (?, ?)";
      await db.run(query, [user, pass]);
      await db.close();
      res.type('text').send('Successfully created an account!');
    }
  } catch (err) {
    res.status(SERVER_ERR_CODE).type('text');
    res.send('Something went wrong!');
  }
});

/**
 * Gets either a list of all classes or a specific class.
 */
app.get('/get', async (req, res) => {
  try {
    let db = await getDBConnection();
    let courseId = req.query.course;
    if (courseId) {
      let detailedQuery = "SELECT c.courseId, c.name, c.department, c.number, c.credits, " +
                          "c.description, c.totalSeats, c.availableSeats, c.prerequisite, " +
                          "c.majorOnly, p.firstName, p.lastName FROM courses c, professors p " +
                          "WHERE c.professorId = p.professorId AND courseId = ?";
      let results = await db.get(detailedQuery, [courseId]);
      if (results === undefined) {
        res.type('text');
        res.status(USER_ERR_CODE).send('Invalid course!');
      } else {
        res.json(results);
      }
    } else {
      let basicQuery = "SELECT courseId, name, department, number, credits FROM courses";
      res.json(await db.all(basicQuery));
    }
    await db.close();
  } catch (err) {
    res.status(SERVER_ERR_CODE);
    res.type('text').send('Internal server error.');
  }
});

/**
 * Logs in a user to the website.
 */
app.post('/login', async (req, res) => {
  res.type('text');
  let db = await getDBConnection();
  let user = req.body.username;
  let password = req.body.password;
  let major = await db.get("SELECT major FROM users WHERE username = ?", [user]);
  try {
    let duplicates = await checkDuplicates(user, password);
    if (duplicates) {
      res.cookie("username", user, {expires: new Date(Date.now() + COOKIE_EXPIRATION_TIME)});
      res.cookie("major", major, {expires: new Date(Date.now() + COOKIE_EXPIRATION_TIME)});
      res.send("Successfully logged in!");
    } else {
      res.status(USER_ERR_CODE);
      res.send('Invalid username or password');
    }
  } catch (err) {
    res.status(SERVER_ERR_CODE).send('Internal server error');
  }
});

/**
 * Enrolls the user into a course.
 */
app.post('/enroll', async (req, res) => {
  let major = req.cookies['major'];
  if (major) {
    major = major.Major;
  }
  let courseId = req.body.courseId;
  if (req.cookies['username'] === undefined) {
    res.status(USER_ERR_CODE);
    res.send('User is not logged in!');
  } else {
    try {
      let remainingSeats = await checkCourseCapacity(courseId);
      let majorRequirement = await checkMajorRequirement(courseId);
      let meetsPrereq = await meetsPrerequisite(req.cookies['username'], courseId);
      if (remainingSeats === 0) {
        res.status(USER_ERR_CODE).send('Course is full! Sorry!');
      } else if (majorRequirement !== null && majorRequirement !== major) {
        res.status(USER_ERR_CODE).send('You are not in the correct major for this course!');
      } else if (!meetsPrereq) {
        res.status(USER_ERR_CODE).send('Course prerequisites are not met!');
      } else {
        let transactionId = req.cookies['username'] + "_" + req.body.date;
        await logEnroll(courseId, remainingSeats, req.cookies['username'], transactionId);
        res.type('text').send(transactionId);
      }
    } catch (err) {
      res.status(SERVER_ERR_CODE).send('Internal server error');
    }
  }
});

/**
 * Returns the capacity of a given class.
 */
app.post('/capacity', async (req, res) => {
  let courseId = req.body.id;
  let user = req.cookies['username'];

  if (user === undefined) {
    res.type('text');
    res.status(USER_ERR_CODE);
    res.send('User is not logged in!');
  } else {
    try {
      let capacity = await checkCourseCapacity(courseId);
      if (capacity === undefined) {
        res.type('text');
        res.status(USER_ERR_CODE).send("Invalid course");
      } else {
        let courseData = {"id": courseId, "capacity": capacity};
        res.json(courseData);
      }
    } catch (err) {
      res.type('text');
      res.status(SERVER_ERR_CODE).send("Internal server error");
    }
  }
});

/**
 * Gets all transaction ID's for a specific user.
 */
app.get('/transactions', async (req, res) => {
  let username = req.cookies['username'];

  if (username === undefined) {
    res.status(USER_ERR_CODE);
    res.type('text').send('User is not logged in!');
  } else {
    try {
      let db = await getDBConnection();
      let getTransactionQuery = "SELECT DISTINCT transactionId FROM " +
                                "enrolledCourses WHERE student = ?";
      let results = await db.all(getTransactionQuery, [username]);
      res.json(results);
    } catch (err) {
      res.type('text');
      res.status(SERVER_ERR_CODE).send("Internal server error");
    }
  }
});

/**
 * Gets a list of all courses corresponding to the transaction ID.
 */
app.post('/transactions/course', async (req, res) => {
  let transactionId = req.body.transactionId;

  if (!transactionId) {
    res.type('text');
    res.status(USER_ERR_CODE).send('Missing required parameters.');
  } else {
    try {
      let query = "SELECT c.name, ec.transactionId FROM courses c, enrolledCourses ec WHERE " +
                  "c.courseid = ec.course AND ec.transactionId = ?";
      let db = await getDBConnection();
      let results = await db.all(query, [transactionId]);
      if (!results) {
        res.type('text');
        res.status(USER_ERR_CODE).send('Invalid transaction ID.');
      } else {
        res.json(results);
      }
    } catch (err) {
      res.type('text');
      res.status(SERVER_ERR_CODE).send("Internal server error");
    }
  }
});

/**
 * Gets a list of all courses matching the search parameters.
 */
app.get('/search', async (req, res) => {
  try {
    let db = await getDBConnection();
    let search = req.query.search;
    if (search === undefined) {
      res.status(USER_ERR_CODE).send("Search parameter must be defined");
    }
    search = '%' + search + '%';
    let sql = "SELECT courseId, name, department, number, credits FROM courses" +
              " WHERE (description LIKE ? OR name LIKE ? OR number LIKE ?)";
    let filter = req.query.filter;
    let filters;
    let sqlParams = [search, search, search];
    if (filter !== undefined) {
      sql = sql + " AND (";
      filters = filter.split("-");
      for (let i = 0; i < filters.length; i++) {
        sqlParams[i + 3] = filters[i].toUpperCase();
        sql = sql + " department = ? OR";
      }
      sql = sql.substring(0, sql.length - 3) + ")";
    }
    let response = await db.all(sql, sqlParams);
    res.type('json').send(response);
  } catch (err) {
    res.status(SERVER_ERR_CODE);
    res.send("Internal server error");
  }
});

/**
 * Logs the enrollment of a user into a specific course.
 * @param {String} courseId - a string representing the ID of a course
 * @param {int} remainingSeats - an integer representing the remaining seats in a course
 * @param {String} user - a string representing a username
 * @param {String} transactionId - a string representing a transaction ID
 */
async function logEnroll(courseId, remainingSeats, user, transactionId) {
  let db = await getDBConnection();
  let editSeatsQuery = "UPDATE courses SET availableSeats = ? WHERE courseid = ?";
  await db.run(editSeatsQuery, [remainingSeats - 1, courseId]);
  let logTransactionQuery = "INSERT INTO enrolledCourses (student, course, transactionId) " +
                             "VALUES (?, ?, ?)";
  await db.run(logTransactionQuery, [user, courseId, transactionId]);
  await db.close();
}

/**
 * Checks there is a username with this matching password in the database.
 * @param {String} user - the username
 * @param {String} password - the password
 * @returns {String} - the username, if the passowrd matches it in the database.
 */
async function checkDuplicates(user, password) {
  let db = await getDBConnection();
  let checkDuplicateQuery = "SELECT username FROM users WHERE username = ? AND password = ?";
  let duplicates = await db.get(checkDuplicateQuery, [user, password]);
  await db.close();
  return duplicates;
}

/**
 * Checks if there is a major requirement to enroll in this course.
 * @param {int} courseId - the id of a course in the db
 * @returns {String} - the major required to enroll in this course. Can be null if none required.
 */
async function checkMajorRequirement(courseId) {
  let db = await getDBConnection();
  let sql = "SELECT majorOnly FROM courses WHERE courseId = ?";
  let result = await db.get(sql, [courseId]);
  result = result.majorOnly;
  await db.close();
  return result;
}

/**
 * Checks if a user meets the course prerequisites to enroll in this course.
 * @param {String} user - a username
 * @param {int} courseId - the courseId of the course being enrolled in.
 * @returns {boolean} - true if the user meets the requirements, false otherwise.
 */
async function meetsPrerequisite(user, courseId) {
  let db = await getDBConnection();
  let sql = "SELECT prerequisite FROM courses WHERE courseId = ?";
  let preRqId = await db.get(sql, [courseId]);
  if (!preRqId.prerequisite) {
    return true;
  }
  sql = "SELECT * FROM enrolledCourses WHERE student = ? AND course = ?";
  let sqlParams = [user, preRqId.prerequisite];
  let enrolled = await db.get(sql, sqlParams);
  if (enrolled) {
    return true;
  }
  return false;
}

/**
 * Returns the amount of seats remaining in a course given a specific course ID.
 * @param {String} courseId - a string representing the ID of a specific course
 * @returns {integer} - an integer representing the available seats in a course
 */
async function checkCourseCapacity(courseId) {
  let db = await getDBConnection();
  let query = 'SELECT availableSeats FROM courses WHERE courseId = ?';
  let queryResults = await db.get(query, [courseId]);
  await db.close();
  if (queryResults !== undefined) {
    return queryResults.availableSeats;
  }
}

/**
 * Establishes a database connection to the database and returns the database object.
 * Any errors that occur shold be caught in the function that calls this one.
 * @returns {Object} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: 'courses_and_users.db',
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static('public'));
const PORT_NUMBER = 8000;
const PORT = process.env.PORT || PORT_NUMBER;
app.listen(PORT);
