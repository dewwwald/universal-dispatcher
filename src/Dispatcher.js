const defined = x => typeof x !== 'undefined';
const DispatchActionTypes = {
  EVENT: 0,
  UPDATE: 1
};

export class Dispatcher {
  constructor() {
    queue = [];
    processing_event = undefined;
    processing = false;
    dispatchableList = [];
    dispatchableSubscriberList = [];
    dispatchableSubscriptions = [];
    dispatchableValues = [];
  }

  /**
   * private method Dispatcher
   * routes to either an event or a tracked
   * @returns null;
   */
  _dispatch(resolver) {
    if (this.event.type === typeActions.UPDATE) {
      this._dispatchUpdate(resolver);
    } else {
      this._dispatchEvent(resolver);
    }
  }

  /**
   * private method Dispatcher
   * dispatches either an update or a pure event
   * @returns null;
   */
  _dispatchEvent(resolver) {
    this.emitDispatchableEvent(this.event);
    resolver();
  }

  _dispatchUpdate(resolver) {
    if (!defined(this.dispatchableValues[this.event.key])) {
      this.dispatchableValues[this.event.key] = [];
    }
    if (typeof this.event.dispatcherAction.updateCallback === 'function') {
      this.dispatchableValues[this.event.key][this.event.dispatcherAction.action]
        = this.event.dispatcherAction.updateCallback(this.dispatchableValues[this.event.key][this.event.dispatcherAction.action]);
    } else {
      this.dispatchableValues[this.event.key][this.event.dispatcherAction.action] = this.event.dispatcherAction;
    }
    this.emitDispatchableValues(this.event.dispatcherAction.action);
    resolver();
  }

  /**
   * Emits an event throughout the application
   */
  _registerEvent(action, value = undefined) {
    this.queue.push({ action: action, value: value, type: typeActions.EVENT });
    this._processNextAction();
  }

  /**
   * Tracks a value and and emit update events throughout the application
   */
  _registerUpdate(action, value) {
    if (!defined(value)) {
      throw new Error('Dispatcher can only track values that are defined.');
    }
    this.queue.push({ action: action, value: value, type: typeActions.UPDATE });
    this._processNextAction();
  }

  /**
   * Emits an event throughout the application
   */
  _hardRegisterEvent(action, value = undefined) {
    this.queue = this.queue.filter(v => v.dispatcherAction.action !== dispatcherAction.action);
    this.queue.splice(0, 0, { type: typeActions.EVENT, action: action, value: value });
    this._processNextAction();
  }

  /**
   * Tracks a value and and emit update events throughout the application
   */
  _hardRegisterUpdate(action, value) {
    if (!defined(value)) {
      throw new Error('Dispatcher can only track values that are defined.');
    }
    this.queue = this.queue.filter(v => v.dispatcherAction.action !== dispatcherAction.action);
    this.queue.splice(0, 0, { type: typeActions.UPDATE, action: action, value: value });
    this._processNextAction();
  }

  _processNextAction() {
    if (!this.processing && this.queue.length > 0) {
      this.processing = true;
      this.event = this.queue.shift();
      this._dispatch(this._resolveAction.bind(this));
    }
    return;
  }

  _resolveAction() {
    this.event = undefined;
    this.processing = false;
    this._processNextAction();
  }

  _subscribeAndEmit(action, callback) {
    if (!defined(this.dispatchableSubscriptions[action])) {
      this.dispatchableSubscriptions[action] = {};
    }
    const placement = Date.now();
    this.dispatchableSubscriptions[action][placement] = callback;
    this._emitDispatchableValues(action);

    return {
      unsubscribe: this._unsubscribe.bind(this, action, placement)
    };
  }

  _emitDispatchableEvent(event) {
    if (defined(this.dispatchableSubscriptions) &&
      defined(this.dispatchableSubscriptions[event.dispatcherAction.action])) {
      this._callDispatchableSubscriptions(action, event.dispatcherAction.value);
    }
  }

  _emitDispatchableValues(action) {
    if (defined(this.dispatchableSubscriptions) && defined(this.dispatchableSubscriptions[action]) &&
      defined(this.dispatchableValues) && defined(this.dispatchableValues[action])) {
      this._callDispatchableSubscriptions(action, this.dispatchableValues[action]);
    }
  }

  _callDispatchableSubscriptions(action, value) {
    Object.keys(this.dispatchableSubscriptions[action]).forEach(key => {
      dispatchableSubscriptions[action][key](value);
    });
  }

  _unsubscribe(key, placement) {
    this.dispatchableSubscriptions[action][placement] = undefined;
  }

  getStoredValue(action) {
    if (this.dispatchableValues && this.dispatchableValues[action]) {
      return this.dispatchableValues[action];
    }
    return undefined;
  }

  createDispatchWriter() {
    const self = this;
    return {
      registerEvent: self._registerEvent.bind(self),
      hardRegisterEvent: self._hardRegisterEvent.bind(self),
      registerUpdate: self._registerUpdate.bind(self),
      hardRegisterUpdate: self._hardRegisterUpdate.bind(self)
    };
  }

  createDispatchReader(action) {
    let self = this;
    return {
      subscribe: self._subscribeAndEmit.bind(self, action),
      getStoredValue: self.getStoredValue.bind(self, action)
    };
  }
}
