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
   * Checks whether the user is logged in and allows them
   * to view their past transactions if logged in.
   */
  function init() {
    checkLoggedIn();
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
      id("user-info").classList.remove("hidden");
      id("website-summary").classList.add("hidden");
      id("login-btn").textContent = "logout";
      id("login-btn").href = "";
      id("login-btn").addEventListener("click", logout);
      id("previous-transaction").classList.remove("hidden");
      getTransactions();
    }
  }

  /**
   * Gets all transactions from a user.
   */
  function getTransactions() {
    fetch('/transactions')
      .then(statusCheck)
      .then(res => res.json())
      .then(getTransactionCourses)
      .catch(displayError);
  }

  /**
   * Gets all courses associated with a transaction ID.
   * @param {object} res - an object containing information about transactions
   */
  function getTransactionCourses(res) {
    for (let i = 0; i < res.length; i++) {
      let data = new FormData();
      data.append('transactionId', res[i].transactionId);

      fetch('/transactions/course', {method: 'POST', body: data})
        .then(statusCheck)
        .then(resp => resp.json())
        .then(populatePage)
        .catch(displayError);
    }
  }

  /**
   * Populates the page with course transaction information.
   * @param {object} res - an object containing information on course
   * transactions
   */
  function populatePage(res) {
    let transactionId = res[0].transactionId;
    let article = gen("article");
    article.classList.add("transaction-view");
    let header = gen("h2");
    header.textContent = transactionId;
    article.appendChild(header);
    for (let i = 0; i < res.length; i++) {
      let course = gen("p");
      course.textContent = res[i].name;
      article.appendChild(course);
    }
    id("user-info").appendChild(article);
  }

  /**
   * Displays an error message to the user.
   * @param {object} res - an object containing an error message
   */
  function displayError(res) {
    id("user-info").classList.add("hidden");
    id("previous-transaction").classList.add("hidden");
    id("website-summary").classList.add("hidden");
    id("index-error").classList.remove("hidden");
    id("index-error-message").textContent = res;
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
   * Returns a new element with the given tag name.
   * @param {string} tagName - HTML tag name for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

})();