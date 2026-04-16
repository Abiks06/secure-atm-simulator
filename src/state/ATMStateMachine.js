/**
 * ATMStateMachine.js
 * Controls the states of the ATM transaction flow.
 */

export const ATM_STATES = {
  IDLE: 'IDLE',
  CARD_INSERTING: 'CARD_INSERTING',
  PIN_ENTRY: 'PIN_ENTRY',
  AUTHENTICATING: 'AUTHENTICATING',
  AUTH_FAILED: 'AUTH_FAILED',
  MENU: 'MENU',
  WITHDRAWAL: 'WITHDRAWAL',
  BALANCE: 'BALANCE',
  PROCESSING: 'PROCESSING',
  DISPENSING: 'DISPENSING',
  SUCCESS: 'SUCCESS',
  CARD_EJECTING: 'CARD_EJECTING',
};

// Valid PIN for simulation
const VALID_PIN = '1234';
const MAX_PIN_ATTEMPTS = 3;

/**
 * State transition definitions
 * Maps: currentState → { event → nextState }
 */
const TRANSITIONS = {
  [ATM_STATES.IDLE]: {
    INSERT_CARD: ATM_STATES.CARD_INSERTING,
  },
  [ATM_STATES.CARD_INSERTING]: {
    CARD_INSERTED: ATM_STATES.PIN_ENTRY,
  },
  [ATM_STATES.PIN_ENTRY]: {
    SUBMIT_PIN: ATM_STATES.AUTHENTICATING,
    CANCEL: ATM_STATES.CARD_EJECTING,
  },
  [ATM_STATES.AUTHENTICATING]: {
    AUTH_SUCCESS: ATM_STATES.MENU,
    AUTH_FAILURE: ATM_STATES.AUTH_FAILED,
    AUTH_LOCKED: ATM_STATES.CARD_EJECTING,
  },
  [ATM_STATES.AUTH_FAILED]: {
    RETRY: ATM_STATES.PIN_ENTRY,
    CANCEL: ATM_STATES.CARD_EJECTING,
  },
  [ATM_STATES.MENU]: {
    SELECT_WITHDRAWAL: ATM_STATES.WITHDRAWAL,
    SELECT_BALANCE: ATM_STATES.BALANCE,
    CANCEL: ATM_STATES.CARD_EJECTING,
  },
  [ATM_STATES.BALANCE]: {
    BACK: ATM_STATES.MENU,
    CANCEL: ATM_STATES.CARD_EJECTING,
  },
  [ATM_STATES.WITHDRAWAL]: {
    CONFIRM_AMOUNT: ATM_STATES.PROCESSING,
    BACK: ATM_STATES.MENU,
    CANCEL: ATM_STATES.CARD_EJECTING,
  },
  [ATM_STATES.PROCESSING]: {
    PROCESS_COMPLETE: ATM_STATES.DISPENSING,
  },
  [ATM_STATES.DISPENSING]: {
    CASH_DISPENSED: ATM_STATES.SUCCESS,
  },
  [ATM_STATES.SUCCESS]: {
    CONTINUE: ATM_STATES.MENU,
    FINISH: ATM_STATES.CARD_EJECTING,
  },
  [ATM_STATES.CARD_EJECTING]: {
    CARD_REMOVED: ATM_STATES.IDLE,
  },
};

/**
 * ATM State Machine Class
 * Manages all state transitions and associated data
 */
export class ATMStateMachine {
  constructor(onStateChange) {
    this.state = ATM_STATES.IDLE;
    this.pin = '';
    this.pinAttempts = 0;
    this.selectedAmount = 0;
    this.balance = 25000.00;
    this.accountNumber = '****-****-****-4829';
    this.cardholderName = 'JOHN DOE';
    this.onStateChange = onStateChange || (() => {});
    this.transactionHistory = [];
    this.stateTimestamp = Date.now();
  }

  /**
   * Get the current state
   */
  getState() {
    return this.state;
  }

  /**
   * Get all data associated with current state
   */
  getData() {
    return {
      state: this.state,
      pin: this.pin,
      pinDisplay: this.pin.replace(/./g, '●'),
      pinAttempts: this.pinAttempts,
      maxAttempts: MAX_PIN_ATTEMPTS,
      remainingAttempts: MAX_PIN_ATTEMPTS - this.pinAttempts,
      selectedAmount: this.selectedAmount,
      balance: this.balance,
      accountNumber: this.accountNumber,
      cardholderName: this.cardholderName,
      stateTimestamp: this.stateTimestamp,
    };
  }

  /**
   * Dispatch an event to trigger a state transition
   * @param {string} event - Event name
   * @param {Object} payload - Optional data
   * @returns {boolean} Whether the transition was valid
   */
  dispatch(event, payload = {}) {
    const currentTransitions = TRANSITIONS[this.state];
    if (!currentTransitions || !currentTransitions[event]) {
      console.warn(`Invalid transition: ${this.state} + ${event}`);
      return false;
    }

    const prevState = this.state;
    this.state = currentTransitions[event];
    this.stateTimestamp = Date.now();

    // Handle side effects
    this._handleSideEffects(event, payload, prevState);

    // Notify listener
    this.onStateChange(this.getData(), prevState);

    return true;
  }

  /**
   * Handle side effects of state transitions
   */
  _handleSideEffects(event, payload, prevState) {
    switch (event) {
      case 'INSERT_CARD':
        this.pin = '';
        this.pinAttempts = 0;
        // Auto-transition after card animation
        setTimeout(() => this.dispatch('CARD_INSERTED'), 2000);
        break;

      case 'SUBMIT_PIN':
        this.pinAttempts++;
        // Simulate authentication delay
        setTimeout(() => {
          if (this.pin === VALID_PIN) {
            this.dispatch('AUTH_SUCCESS');
          } else if (this.pinAttempts >= MAX_PIN_ATTEMPTS) {
            this.dispatch('AUTH_LOCKED');
          } else {
            this.dispatch('AUTH_FAILURE');
          }
        }, 1500);
        break;

      case 'AUTH_FAILURE':
        // Reset PIN for retry
        this.pin = '';
        break;

      case 'RETRY':
        this.pin = '';
        break;

      case 'CONFIRM_AMOUNT':
        this.selectedAmount = payload.amount || 0;
        // Simulate processing
        setTimeout(() => {
          this.balance -= this.selectedAmount;
          this.transactionHistory.push({
            type: 'WITHDRAWAL',
            amount: this.selectedAmount,
            timestamp: Date.now(),
            balance: this.balance,
          });
          this.dispatch('PROCESS_COMPLETE');
        }, 2000);
        break;

      case 'PROCESS_COMPLETE':
        // Auto-dispense after a delay
        setTimeout(() => this.dispatch('CASH_DISPENSED'), 2500);
        break;

      case 'CARD_REMOVED':
        // Reset everything
        this.pin = '';
        this.pinAttempts = 0;
        this.selectedAmount = 0;
        break;

      case 'FINISH':
        // Auto-remove card after animation
        setTimeout(() => this.dispatch('CARD_REMOVED'), 2000);
        break;

      case 'CANCEL':
        setTimeout(() => this.dispatch('CARD_REMOVED'), 2000);
        break;
    }
  }

  /**
   * Add a digit to the PIN
   * @param {string} digit - Single digit 0-9
   */
  addPinDigit(digit) {
    if (this.state !== ATM_STATES.PIN_ENTRY) return;
    if (this.pin.length < 4) {
      this.pin += digit;
      this.onStateChange(this.getData(), this.state);
    }
  }

  /**
   * Remove last PIN digit (backspace)
   */
  removePinDigit() {
    if (this.state !== ATM_STATES.PIN_ENTRY) return;
    this.pin = this.pin.slice(0, -1);
    this.onStateChange(this.getData(), this.state);
  }

  /**
   * Clear entire PIN
   */
  clearPin() {
    if (this.state !== ATM_STATES.PIN_ENTRY) return;
    this.pin = '';
    this.onStateChange(this.getData(), this.state);
  }
}

export default ATMStateMachine;
