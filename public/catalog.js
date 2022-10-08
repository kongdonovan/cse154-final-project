/**
 * Donovan Kong & Dan Temereanca
 * CSE 154
 * Final Project
 *
 * The Javascript for the entire final project. This handles all of
 * the front-end functionality, such as displaying courses, the login
 * mechanism, and a whole host of other things.
 */

"use strict";

(function() {

  // MODULE GLOBAL VARIABLES, CONSTANTS, AND HELPER FUNCTIONS CAN BE PLACED HERE

  /**
   * Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", init);

  /**
   * Checks whether the user is logged in. Also shows all courses
   * and allows the user to search for courses.
   */
  function init() {
    checkLoggedIn();
    fetchCatalog();
    qs("form").addEventListener("submit", function(ev) {
      ev.preventDefault();
      search();
    });
    id("change-views").addEventListener("click", changeViews);
  }

  /**
   * Toggles the user view between list and grid view.
   */
  function changeViews() {
    id("course-cards").classList.toggle("list-view");
    id("course-cards").classList.toggle("grid-view");
  }

  /**
   * Fetches all classes and displays them. If there is an error, also
   * displays an error message.
   */
  function fetchCatalog() {
    fetch('/get')
      .then(statusCheck)
      .then(res => res.json())
      .then(populateBoard)
      .catch(displayError);
  }

  /**
   * Populates the catalog with classes.
   * @param {Object[]} res - an array of JSON objects containing information
   * about all classes
   */
  function populateBoard(res) {
    id("course-cards").innerHTML = '';
    for (let i = 0; i < res.length; i++) {
      let article = gen("article");
      article.classList.add("element-container");
      let course = res[i].department + " " + res[i].number;
      let name = res[i].name;
      let credits = res[i].credits + " cr";
      article.appendChild(formatContainers(course));
      let nameContainer = formatContainers(name);
      nameContainer.classList.add("course-name");
      nameContainer.id = res[i].courseId;
      nameContainer.firstElementChild.addEventListener("click", detailedView);
      article.appendChild(nameContainer);
      article.appendChild(formatContainers(credits));
      id("course-cards").appendChild(article);
    }
  }

  /**
   * Switches the user to a more detailed view of the course they clicked on
   * @param {Object} event - an object with information about the event that called this function
   */
  async function detailedView(event) {
    id("course-cards").classList.add("hidden");
    id("change-views").classList.add("hidden");
    id("detailed-view").classList.remove("hidden");
    id("detailed-view").innerHTML = '';

    let courseId = event.srcElement.parentNode.id;
    fetch('/get?course=' + courseId)
      .then(statusCheck)
      .then(res => res.json())
      .then(await generateDetailedView)
      .catch(displayError);
  }

  /**
   * Populates the HTML with detailed information about a course
   * @param {Object} res - an object with the information about a course
   */
  async function generateDetailedView(res) {
    let article = gen("article");
    article.id = res.courseId;
    article.classList.add("element-container");
    let header = gen("h2");
    let currentSpace = gen("p");
    header.textContent = res.department + " " + res.number + ": " +
                         res.name + " (" + res.credits + ")";
    currentSpace.textContent = res.availableSeats + " seats remaining out of " +
                               res.totalSeats + " seats";
    article.appendChild(header);
    article.appendChild(currentSpace);
    article.appendChild(await formatInfoSection(res));
    article.appendChild(formatSignUpButton());
    article.appendChild(formatCartButton());
    id("detailed-view").appendChild(article);
  }

  /**
   * Using a passed-in object, formats a container with information about a class
   * and returns it.
   * @param {object} res - an object containing information on a class
   * @returns {object} - a formatted DOM element with information on a course
   */
  async function formatInfoSection(res) {
    let infoSection = gen("div");
    infoSection.appendChild(formatParagraphs("Description: " + res.description));
    let prereq = res.prerequisite;
    if (prereq) {
      prereq = await fetch('/get?course=' + prereq)
        .then(statusCheck)
        .then(resp => resp.json())
        .then(resp => {return resp;})
        .catch(displayError);
    }
    let major = res.majorOnly;
    let text;
    if (!prereq && !major) {
      text = "none";
    } else if (prereq && major) {
      text = major + " majors only and must complete " + prereq.department + " " + prereq.number;
    } else if (prereq) {
      text = "must complete " + prereq.department + " " + prereq.number;
    } else {
      text = major + "majors only";
    }
    infoSection.appendChild(formatParagraphs("Prerequisites: " + text));
    infoSection.appendChild(formatParagraphs("Professor: " + res.firstName + " " + res.lastName));
    infoSection.classList.add("info-section");
    return infoSection;
  }

  /**
   * Formats an add to cart button and returns it.
   * @returns {object} - a DOM element representing a button
   */
  function formatCartButton() {
    let button = gen("button");
    button.textContent = "Add to cart!";
    button.id = "add-cart";
    button.addEventListener("click", confirmPrompt);
    return button;
  }

  /**
   * Formats a button for use in the detailed view and returns it.
   * @returns {object} - a DOM object representing a button
   */
  function formatSignUpButton() {
    let button = gen("button");
    button.textContent = "Sign up!";
    button.id = "sign-up";
    button.addEventListener("click", confirmPrompt);
    return button;
  }

  /**
   * Prompts the user to confirm their selection by having them
   * click on a button again.
   */
  function confirmPrompt() {
    id(this.id).textContent = "Click again to confirm";
    id(this.id).removeEventListener("click", confirmPrompt);
    if (this.id === "sign-up") {
      id("add-cart").classList.add("hidden");
      id(this.id).textContent += " enrollment";
      id(this.id).addEventListener("click", enroll);
    } else {
      id("sign-up").classList.add("hidden");
      id(this.id).textContent += " adding to cart";
      id(this.id).addEventListener("click", checkCourseCapacity);
    }
  }

  /**
   * Checks the course capacity for a specified course.
   */
  function checkCourseCapacity() {
    let data = new FormData();
    data.append("id", this.parentNode.id);

    fetch('/capacity', {method: "POST", body: data})
      .then(statusCheck)
      .then(res => res.json())
      .then(addToCart)
      .catch(displayError);
  }

  /**
   * Adds a class to the cart if it is not already there.
   * @param {object} res - a response containing information about a class.
   */
  function addToCart(res) {
    const PAGE_CHANGE_DELAY = 1000;
    id("add-cart").removeEventListener("click", checkCourseCapacity);
    let courseId = res.id;
    let currentCourses = window.localStorage.getItem("selectedCourses");
    if (currentCourses === null && res.capacity !== 0) {
      id("add-cart").textContent = "Successfully added to cart!";
      window.localStorage.setItem("selectedCourses", courseId);
    } else if (res.capacity === 0) {
      id("add-cart").textContent = "Course is already full!";
    } else {
      currentCourses = currentCourses.split(",");
      let containsDuplicate = false;
      for (let i = 0; i < currentCourses.length; i++) {
        if (currentCourses[i] === courseId) {
          containsDuplicate = true;
        }
      }
      if (containsDuplicate) {
        id("add-cart").textContent = "Course has already been added!";
      } else {
        id("add-cart").textContent = "Successfully added to cart!";
        window.localStorage.setItem("selectedCourses", currentCourses + "," + courseId);
      }
    }
    setTimeout(function() {
      location.href = "catalog.html";
    }, PAGE_CHANGE_DELAY);
  }

  /**
   * Enrolls the user in a single class.
   */
  function enroll() {
    let courseId = this.parentNode.id;
    let date = Date.now();
    let data = new FormData();
    data.append("courseId", courseId);
    data.append("date", date);

    fetch('/enroll', {method: "POST", body: data})
      .then(statusCheck)
      .then(res => res.text())
      .then(notifyEnrollmentSuccess)
      .catch(displayError);
  }

  /**
   * Notifies the user that they successfully enrolled in a class, then
   * redirects them to the main catalog page.
   * @param {object} res - a text object representing a success message
   */
  function notifyEnrollmentSuccess(res) {
    id("detailed-view").classList.add("hidden");
    id("catalog-success").classList.remove("hidden");
    id("sign-up").removeEventListener("click", enroll);
    id("catalog-transaction-id").textContent = "Transaction ID: " + res;
  }

  /**
   * Formats a paragraph tag and returns it for use somewhere.
   * @param {String} text - a string representing some text
   * @returns {object} - an object representing a paragraph tag.
   */
  function formatParagraphs(text) {
    let paragraph = gen("p");
    paragraph.textContent = text;
    return paragraph;
  }

  /**
   * Creates an information container to be used to display a class.
   * @param {String} text - a string of text representing some information
   * about a class
   * @returns {Object} - an object containing text information about a class
   */
  function formatContainers(text) {
    let courseContainer = gen("div");
    let course = gen("p");
    course.textContent = text;
    courseContainer.appendChild(course);
    return courseContainer;
  }

  /**
   * Searches for a specific course based on a search query and/or filters.
   */
  function search() {
    id("detailed-view").classList.add("hidden");
    id("course-cards").classList.remove("hidden");
    let cse = id("cse").checked;
    let dino = id("dino").checked;
    let engl = id("engl").checked;
    let phys = id("phys").checked;
    let url = "/search?search=" + id("search").value;
    if (cse || dino || engl || phys) {
      url = url + "&filter=";
      if (cse) {
        url += 'cse-';
      }
      if (dino) {
        url += 'dino-';
      }
      if (engl) {
        url += 'engl-';
      }
      if (phys) {
        url += 'phys-';
      }
      url = url.substring(0, url.length - 1);
    }
    fetch(url)
      .then(statusCheck)
      .then(res => res.json())
      .then(populateBoard)
      .catch(displayError);
  }

  /**
   * Displays an error message to the user.
   * @param {Object} res - a response containing a potential error message
   */
  function displayError(res) {
    id("course-cards").classList.add("hidden");
    id("detailed-view").classList.add("hidden");
    id("error").classList.remove("hidden");
    id("error-message").textContent = res;
  }

  /**
   * Checks whether the user is logged in. If they are,
   * display information about their current classes and
   * previously taken classes.
   */
  function checkLoggedIn() {
    let cookie = document.cookie;
    cookie = cookie.split("=")[1];
    if (cookie) {
      id("login-btn").textContent = "logout";
      id("login-btn").href = "";
      id("login-btn").addEventListener("click", logout);
    }
  }

  /**
   * Logs out the user.
   */
  async function logout() {
    try {
      await cookieStore.delete("username");
      await cookieStore.delete("major");
      await cookieStore.delete("majorOnly");
    } catch (err) {
      displayError(err);
    }
  }

  /** ------------------------------ Helper Functions  ------------------------------ */
  /**
   * Note: You may use these in your code, but remember that your code should not have
   * unused functions. Remove this comment in your own code.
   */

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} res - response to check for success/error
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns a new element with the given tag name.
   * @param {string} tagName - HTML tag name for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

})();