CREATE TABLE users (
  username CHAR(255) NOT NULL PRIMARY KEY,
  password CHAR(255) NOT NULL,
	major CHAR(255)
)

CREATE TABLE professors (
  professorId INTEGER NOT NULL,
  firstName CHAR(255) NOT NULL,
  lastName CHAR(255) NOT NULL,
  PRIMARY KEY(professorId AUTOINCREMENT)
)

CREATE TABLE courses (
	name	TEXT NOT NULL,
	courseId	INTEGER NOT NULL,
	department	CHAR(255) NOT NULL,
	number	int NOT NULL,
	description	CHAR(1000),
	credits	int NOT NULL,
	professorId	int NOT NULL,
	totalSeats	INTEGER,
	availableSeats	INTEGER,
	prerequisite INTEGER,
	majorOnly CHAR(255),
	PRIMARY KEY(courseId AUTOINCREMENT),
	FOREIGN KEY(professorId) REFERENCES professors(professorId)
)

CREATE TABLE enrolledCourses (
	student	CHAR(255) NOT NULL,
	course	int NOT NULL,
	transactionId	INTEGER,
	FOREIGN KEY(student) REFERENCES users(username),
	FOREIGN KEY(course) REFERENCES courses(courseId)
)