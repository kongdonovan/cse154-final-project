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

  /**
   * Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", init);

  /**
   * CHANGE: Describe what your init function does here.
   */
  function init() {
    id("create-account").addEventListener("submit", function(ev) {
      ev.preventDefault();
      submitForm();
    });
    id("confirm").addEventListener("input", validateMatch);
  }

  /**
   * Validates whether the password and confirm password prompts match.
   */
  function validateMatch() {
    let password = id("password").value;
    let confirmPassword = id("confirm").value;
    if (password !== confirmPassword) {
      id("confirm").setCustomValidity("Make sure your passwords match!");
    } else {
      id("confirm").setCustomValidity("");
    }
    id("confirm").reportValidity();
  }

  /**
   * Submits the create account form and creates a new user account.
   */
  function submitForm() {
    let data = new FormData(qs("#create-account"));
    fetch('/create', {method: 'POST', body: data})
      .then(statusCheck)
      .then(res => res.text())
      .then(notifySuccess)
      .catch(notifyFailure);
  }

  /**
   * Notifies the user of a successful account creation.
   * @param {object} res - an object containing a success message
   */
  function notifySuccess(res) {
    const REDIRECT_DELAY = 2000;
    qs("#create-box h2").textContent = res;
    setTimeout(function() {
      location.href = "login.html";
    }, REDIRECT_DELAY);
  }

  /**
   * Notifies the user of a failed account creation.
   * @param {object} res - an object containing a failure message
   */
  function notifyFailure(res) {
    qs("#create-box h2").textContent = res;
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