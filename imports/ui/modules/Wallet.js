import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

import { userVotesInContract } from '/imports/startup/both/modules/User';
import { animationSettings } from '/imports/ui/modules/animation';
import { Contracts } from '/imports/api/contracts/Contracts';

/**
* @summary returns the type of target being used for the power avoidAllocation
* @param {string} targetId the id of the targeted element
* @return {string} type VOTE, DELEGATION, UNKNOWN
*/
const getTargetType = (targetId) => {
  if (Contracts.findOne({ _id: targetId })) {
    return 'VOTE';
  } else if (Meteor.users.findOne({ _id: targetId })) {
    return 'DELEGATION';
  }
  return 'UNKNOWN';
};

/**
* @summary Wallet class for transaction operations
* @constructor {object} Wallet - constructor function
* @param {object} wallet - wallet object that can be set from a user's profile.
* @param {string} targetId - contrct being used for this vote
* @param {string} sessionId - how this wallet will be identified on a session var
*/
export const Wallet = function (wallet, targetId, sessionId) {
  // properties
  if (wallet === undefined) {
    this.address = [];
    this.ledger = [];
    this.available = 0;
    this.balance = 0;
    this.placed = 0;
    this.inBallot = 0;
    this.currency = 'VOTES';
  } else {
    Object.assign(this, wallet);
  }

  // defined
  this.initialized = true;
  this.enabled = true;
  this.mode = 'PENDING';
  this.inBallot = userVotesInContract(wallet, targetId);
  this.targetId = targetId;
  this.targetType = getTargetType(targetId);

  // controller
  if (sessionId === undefined) {
    this.voteId = `${targetId}`;
  } else {
    this.voteId = `${sessionId}`;
  }

  // view
  this._initialSliderWidth = $(`#voteSlider-${this.voteId}`).width();
  this.sliderWidth = this._initialSliderWidth;
  // TODO remove 5 pixels for buffer?
  this._maxWidth = $(`#voteBar-${this.voteId}`).width() - (($(`#voteBar-${this.voteId}`).width() * parseInt(((this.placed - this.inBallot) * 100) / this.balance, 10)) / 100);

  // methods
  if (this.initialized === true) {
    this.resetSlider();
    this.initialized = false;
  }
};

const _scope = (value, max, min) => {
  let minval = min;
  if (minval === undefined) { minval = 0; }
  if (value < minval) { return minval; } else if (value > max) { return max; }
  return value;
};

Wallet.prototype.allocateVotes = function (quantity, avoidSlider) {
  if (this.enabled) {
    this.placedPercentage = ((this.placed * 100) / this.balance);
    this.allocatePercentage = ((quantity * 100) / this.balance);
    this.allocateQuantity = parseInt(_scope(quantity, (this.available + this.inBallot)), 10);
  }
  if (!avoidSlider) {
    const sliderWidth = parseFloat(($(`#voteSlider-${this.voteId}`).width() * this.available) / this._maxWidth, 10);
    const sliderCorrected = parseFloat((this._maxWidth * this.allocateQuantity) / this.available, 10);
    this.sliderInput((sliderCorrected - sliderWidth), true);
  }
};

Wallet.prototype.sliderInput = function (pixels, avoidAllocation) {
  if (pixels === undefined) { pixels = 0; }
  if ($(`#voteBar-${this.voteId}`).offset() !== undefined) {
    if ($(`#voteHandle-${this.voteId}`).offset() !== undefined) {
      this.sliderWidth = _scope((this._initialSliderWidth + pixels), this._maxWidth, 0);
    } else {
      this.sliderWidth = 0;
    }
    if (!avoidAllocation) {
      const sliderWidth = _scope($(`#voteSlider-${this.voteId}`).width(), this._maxWidth, 0);
      const barWidth = $(`#voteBar-${this.voteId}`).width();
      const pixelToVote = _scope(parseInt((sliderWidth * this.balance) / barWidth, 10), (this.available + this.inBallot), 0);
      this.allocateVotes(pixelToVote, true);
    }
  }
};

Wallet.prototype.sliderPercentage = function () {
  this.allocatePercentage = parseInt((this.allocateQuantity * 100) / this.balance, 10);
  this.allocateVotes(this.allocateQuantity);
};

/**
* @summary resets slider handle to current in ballot value position
*/
Wallet.prototype.resetSlider = function () {
  const initialValue = parseFloat((this.inBallot * 100) / this.balance, 10).toFixed(2);
  $(`#voteSlider-${this.voteId}`).velocity({ width: `${initialValue}%` }, animationSettings);
  this._initialSliderWidth = parseInt(($(`#voteBar-${this.voteId}`).width() * initialValue) / 100, 10);
  this.sliderWidth = this._initialSliderWidth;
  this.allocateVotes(this.inBallot, true);
};

/**
* @summary verify if user has already voted
* @param {object} ledger - ledger of contract or entity to verify on
* @param {string} userId - id of user
* @return {boolean} value - true or false
*/
const _verifyVote = (ledger, userId) => {
  for (const entity in ledger) {
    if (ledger[entity].entityId === userId) {
      const wallet = Session.get('newVote');
      if (wallet !== undefined) {
        wallet.allocatePercentage = parseInt((ledger[entity].quantity * 100) / wallet.balance, 10);
        wallet.allocateQuantity = ledger[entity].quantity;
        wallet.mode = 'EXECUTED';
        Session.set('newVote', wallet);
      }
      return true;
    }
  }
  return false;
};

export const verifyVote = _verifyVote;
