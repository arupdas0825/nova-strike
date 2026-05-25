'use strict';

/**
 * Performance-tuned object pooling system to eliminate runtime Garbage Collection latency.
 */
export class Pool {
  /**
   * @param {new (...args: any[]) => any} ClassConstructor - Factory entity class
   * @param {number} initialSize - Pre-allocated array size
   */
  constructor(ClassConstructor, initialSize = 100) {
    this.ClassConstructor = ClassConstructor;
    /** @type {any[]} Container for inactive reusable structures */
    this.freeList = [];

    // Pre-allocate instances
    for (let i = 0; i < initialSize; i++) {
      const obj = new this.ClassConstructor();
      obj.active = false;
      this.freeList.push(obj);
    }
  }

  /**
   * Recovers a recycled instance from the pool or instantiates a new one if empty
   * @param {...any} args - Initialization parameters
   * @returns {any}
   */
  obtain(...args) {
    let instance;
    if (this.freeList.length > 0) {
      instance = this.freeList.pop();
    } else {
      instance = new this.ClassConstructor();
    }
    
    instance.active = true;
    if (typeof instance.init === 'function') {
      instance.init(...args);
    }
    
    return instance;
  }

  /**
   * Returns a dead instance back to the free storage list for future reuse
   * @param {any} instance
   */
  free(instance) {
    if (!instance) return;
    instance.active = false;
    this.freeList.push(instance);
  }

  /**
   * Empties the internal pool storage
   */
  clear() {
    this.freeList = [];
  }
}
