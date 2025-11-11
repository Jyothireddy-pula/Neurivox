// utils/eventEmitter.ts

interface EventListeners {
  [eventName: string]: Function[];
}

class EventEmitter {
  private listeners: EventListeners = {};

  on(eventName: string, listener: Function) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(listener);
    return () => this.off(eventName, listener); // Return an unsubscribe function
  }

  off(eventName: string, listener: Function) {
    if (!this.listeners[eventName]) {
      return;
    }
    this.listeners[eventName] = this.listeners[eventName].filter(
      (l) => l !== listener
    );
  }

  emit(eventName: string, ...args: any[]) {
    if (!this.listeners[eventName]) {
      return;
    }
    this.listeners[eventName].forEach((listener) => {
      try {
        listener(...args);
      } catch (e) {
        console.error(`Error in event listener for ${eventName}:`, e);
      }
    });
  }
}

export const globalEmitter = new EventEmitter();
