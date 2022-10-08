/**
 * Donovan Kong & <partner name here>
 * CSE 154
 * Final Project
 *
 * The Javascript for the entire final project. This handles all of
 * the front-end functionality, such as displaying courses, the login
 * mechanism, and a whole host of other things. <ADD HERE WHEN THINGS ARE IMPLEMENTED>
 */

"use strict";

(function() {

  /**
   * Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", init);

  /**
   * CHANGE: Describe what your init function does here.
   */
  function init() {
    id("login").addEventListener("submit", function(ev) {
      ev.preventDefault();
      submitForm();
    });
  }

  /**
   * Submits the login form and logs the user logging in.
   */
  function submitForm() {
    let data = new FormData(id("login"));
    fetch('/login', {method: 'POST', body: data})
      .then(statusCheck)
      .then(res => res.text())
      .then(notifySuccess)
      .catch(notifyFailure);
  }

  /**
   * Notifies the user of a successful login.
   * @param {object} res - an object representing a success message
   */
  function notifySuccess(res) {
    const REDIRECT_DELAY = 2000;
    let successMessage = res;
    qs("#login-box h2").textContent = successMessage;
    setTimeout(function() {
      location.href = "index.html";
    }, REDIRECT_DELAY);
  }

  /**
   * Notifies the user of a login failure.
   * @param {object} res - an object containing a failure message
   */
  function notifyFailure(res) {
    qs("#login-box h2").textContent = res;
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
})();