class List {
  constructor() {
    this.first = null;
    this.last = null;
    this.size = 0;
  }

  insertFirst(item) {
    if (this.size == 0) {
      const node = new ListNode(this, null, null, item);
      this.first = node;
      this.last = node;
      this.size = 1;
      return node;
    }
    else {
      return this.first.insertPrev(item);
    }
  }

  insertLast(item) {
    if (this.size == 0) {
      const node = new ListNode(this, null, null, item);
      this.first = node;
      this.last = node;
      this.size = 1;
      return node;
    }
    else {
      return this.last.insertNext(item);
    }
  }

  [Symbol.iterator]() {
    let current = this.first;
    return {
      next: () => {
        if (current != null) {
          const value = current.item;
          current = current.next;
          return { value, done: false };
        } else {
          return { done: true };
        }
      }
    };
  }
}
