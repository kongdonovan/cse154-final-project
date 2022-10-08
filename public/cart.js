/**
 * Donovan Kong & Dan Temereanca
 * CSE 154
 * Final Project
 *
 * The Javascript for the entire final project. This handles all of
 * the front-end functionality, such as displaying courses, the login
 * mechanism, and a whole host of other things. <ADD HERE WHEN THINGS ARE IMPLEMENTED>
 */

"use strict";

(function() {

  // MODULE GLOBAL VARIABLES, CONSTANTS, AND HELPER FUNCTIONS CAN BE PLACED HERE

  /**
   * Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", init);

  /**
   * Listens to determine whether the user wants to check out.
   * Also finds out if the user is logged in.
   */
  function init() {
    checkLoggedIn();
    id("bulk-enroll").addEventListener("click", confirm);
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
      id("cart").classList.remove("hidden");
      id("login-prompt").classList.add("hidden");
      populateCart();
    }
  }

  /**
   * Allows the user to confirm that they want to checkout.
   */
  function confirm() {
    let cart = window.localStorage.getItem("selectedCourses");
    if (!cart) {
      id(this.id).textContent = "Your cart is empty! Add some items first!";
    } else {
      id(this.id).textContent = "Click again to confirm enrollment";
      id(this.id).removeEventListener("click", confirm);
      id(this.id).addEventListener("click", bulkEnroll);
    }
  }

  /**
   * Bulk enrolls the user into the classes in their cart.
   */
  function bulkEnroll() {
    let cart = window.localStorage.getItem("selectedCourses");
    cart = cart.split(",");
    let date = Date.now();
    for (let i = 0; i < cart.length; i++) {
      let data = new FormData();
      data.append("courseId", cart[i]);
      data.append("date", date);
      fetch('/enroll', {method: "POST", body: data})
        .then(statusCheck)
        .then(res => res.text())
        .then(displaySuccess)
        .catch(displayFailure);
    }
    window.localStorage.clear();
  }

  /**
   * Populates the page with classes that the user has selected.
   */
  function populateCart() {
    let cart = window.localStorage.getItem("selectedCourses");
    if (cart !== null) {
      id("cart-container").classList.remove("hidden");
      cart = cart.split(",");
      for (let i = 0; i < cart.length; i++) {
        fetch("/get?course=" + cart[i])
          .then(statusCheck)
          .then(res => res.json())
          .then(addToPage)
          .catch(displayFailure);
      }
    }
  }

  /**
   * Populates the catalog with classes.
   * @param {Object[]} res - an array of JSON objects containing information
   * about all classes
   */
  function addToPage(res) {
    let article = gen("article");
    article.classList.add("element-container");
    let course = res.department + " " + res.number;
    let name = res.name;
    let credits = res.credits + " cr";
    article.appendChild(formatContainers(course));
    let nameContainer = formatContainers(name);
    nameContainer.id = res.courseId;
    article.appendChild(nameContainer);
    article.appendChild(formatContainers(credits));
    id("cart-container").appendChild(article);
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
   * Notifies the user of a successful checkout.
   * @param {object} res - an object containing a transaction ID
   */
  function displaySuccess(res) {
    id("cart-container").classList.add("hidden");
    id("cart-success").classList.remove("hidden");
    id("transaction-id").textContent = "Transaction ID: " + res;
    window.localStorage.removeItem("selectedCourses");
  }

  /**
   * Notifies the user of a failed checkout.
   * @param {object} res - an object containing a failure message
   */
  function displayFailure(res) {
    id("cart-container").classList.add("hidden");
    id("cart-error").classList.remove("hidden");
    id("cart-error-message").textContent = res;
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
      displayFailure(err);
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
   * Returns a new element with the given tag name.
   * @param {string} tagName - HTML tag name for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

})();