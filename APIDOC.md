# University of CSE154 API documentation
The University of CSE154 API allows a user to create and login into an account, enroll in a single class, get information about a class, and get the capacity of a class.

## Create an account
**Request Format:** /create with POST parameters `username` and `password`

**Request Type:** POST

**Returned Data Format**: Plaintext

**Description:** Creates a new user account by adding the username and password to a database with user information, then returns a plaintext notification indicating success.


**Example Request:** /create with POST parameters `username=dkong1` and `password=12345678`

**Example Response:**

```
Successfully created an account!
```

**Error Handling:**
Possible 400 (Bad Request) via the following:
  - If the `username` POST parameter already exists in the user database, returns a message saying `That username already exists!`

Possible 500 (Internal Server Error) via the following:
  - Any database-related errors will return a message saying `Something went wrong!`

## Login to an account
**Request Format:** /login with POST parameters `username` and `password`

**Request Type:** POST

**Returned Data Format**: Plaintext

**Description:** Authenticates that the user exists in the user database, then returns a plaintext notification indicating success.

**Example Request:** /login with POST parameters `username=dkong1` and `password=12345678`

**Example Response:**

```
Successfully logged in!
```

**Error Handling:**
Possible 400 (Bad Request) via the following:
  - If the username-password pair does not exactly match a username and password in the user database, returns a message saying `Invalid username or password`.

Possible 500 (Internal Server Error) via the following:
  - Any database-related errors will return a message saying `Internal server error`

## Get a list of all courses
**Request Format:** /get

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns an array of JSON objects where each object contains the course ID, name, department, number, and credits for every existing course.


**Example Request:** /get

**Example Response:**

```json
[
  {
    "courseId": 1,
    "name": "Web Programming",
    "department": "CSE",
    "number": 154,
    "credits": 5
  },
  {
    "courseId": 2,
    "name": "Introduction to Programming II",
    "department": "CSE",
    "number": 143,
    "credits": 5
  }
]
```

**Error Handling:**
Possible 500 (Internal Server Error) via the following:
  - Any database-related errors will return a message saying `Internal server error.`

## Get detailed information about one course.
**Request Format:** /get with `course` query parameter.

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns a JSON object corresponding to the class with the `course` query parameter. The object contains information about the course ID, name, department, number, credits, description, total seats, available seats, and a professor's first and last name.


**Example Request:** /get?course=1

**Example Response:**

```json
{
  "courseId": 1,
  "name": "Web Programming",
  "department": "CSE",
  "number": 154,
  "credits": 5,
  "description": "Intro to web development.",
  "totalSeats": 180,
  "availableSeats": 170,
  "firstName": "Tal",
  "lastName": "Wolman"
}
```

**Error Handling:**
Possible 400 (Bad Request) via the following:
  - If the `course` query parameter does not correspond to a class that exists, returns a plaintext message saying `Invalid course!`

Possible 500 (Internal Server Error) via the following:
  - Any database-related errors will respond with a message saying `Internal server error.`

## Enroll in a single course
**Request Format:** /enroll with POST parameters `date` and `courseId`

**Request Type:** POST

**Returned Data Format**: Plaintext

**Description:** Enrolls a user in a course by recording a username, course, and transaction ID in an enrolled courses database, then returns the generated transaction ID.


**Example Request:** /enroll with POST parameters `date=1639096869675` and `courseId=1`

**Example Response:**

```
hasteanarchy_1639096869675
```

**Error Handling:**
Possible 400 (Bad Request) via the following:
  - If the user is not logged in, returns a plaintext message saying `User is not logged in!`

Possible 500 (Internal Server Error) via the following:
  - Any database-related errors will respond with a message saying `Internal server error`

## Get the capacity of a specified course
**Request Format:** /capacity with POST parameter `id`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Returns the course ID as well as the current remaining seats in the course specified by the `id` POST parameter.


**Example Request:** /capacity with POST parameter `id=1`

**Example Response:**

```json
{
  "id": "1",
  "capacity": 169
}
```

**Error Handling:**
Possible 400 (Bad Request) via the following:
  - If the `id` POST parameter contains a course ID that does not exist, returns a plaintext message saying `Invalid course`
  - If the user is not logged in, returns a plaintext message saying `User is not logged in!`

Possible 500 (Internal Server Error) via the following:
  - Any database-related errors will respond with a message saying `Internal server error`

## Get all transaction ID's for a user
**Request Format:** /transactions

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns an array of JSON objects where each object contains a transaction ID for a user. Each transaction ID is unique, meaning that if there are multiple transactions with the same ID, only one will be returned.

**Example Request:** /transactions

**Example Response:**

```json
[
  {
    "transactionId": "dkong1_1639150169574"
  }
]
```

**Error Handling:**
Possible 400 (Bad Request) via the following:
  - If the user is not logged in, returns a plaintext message saying `User is not logged in!`

Possible 500 (Internal Server Error) via the following:
  - Any database-related errors will respond with a message saying `Internal server error`

## Get all transaction ID's for a user
**Request Format:** /transactions/course with POST parameter `transactionId`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Returns an array of JSON objects where each object contains a course name and corresponding transaction ID.

**Example Request:** /transactions/course with POST parameter `transactionId=dkong1_1639150169574`

**Example Response:**

```json
[
  {
    "name": "Web Programming",
    "transactionId": "dkong1_1639150169574"
  },
  {
    "name": "Introduction to Programming II",
    "transactionId": "dkong1_1639150169574"
  }
]
```

**Error Handling:**
Possible 400 (Bad Request) via the following:
  - If the `transactionId` POST parameter is missing, returns a plaintext message saying `Missing required parameters.`

Possible 500 (Internal Server Error) via the following:
  - Any database-related errors will respond with a message saying `Internal server error`

## Search for a course
**Request Format:** /search

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Returns an array of JSON objects where each object contains the course ID, name, department, number, and credits for courses with the
search term in their description, and matching the fitlering conditions, if any.

**Example Request:** /search?search=web

**Example Response:**

```json
[
  {
    "courseId": 1,
    "name": "Web Programming",
    "department": "CSE",
    "number": 154,
    "credits": 5
  }
]
```

**Example Request:** /search?search=quantum&filter=PHYS

**Example Response:**

```json
[
  {
    "courseId": 14,
    "name": "High Level Physics",
    "department": "PHYS",
    "number": 422,
    "credits": 4
  }
]
```

**Error Handling:**
Possible 400 (User Error) via the following:
  - A missing search parameter will return a message saying `Search parameter must be defined`
Possible 500 (Internal Server Error) via the following:
  - Any database-related errors will return a message saying `Internal server error.`