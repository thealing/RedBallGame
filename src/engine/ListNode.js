class ListNode {
  constructor(list, prev, next, item) {
    this.list = list;
    this.prev = prev;
    this.next = next;
    this.item = item;
  }

  insertPrev(item) {
    const node = new ListNode(this.list, this.prev, this, item);
    if (this == this.list.first) {
      this.list.first = node;
    }
    else {
      this.prev.next = node;
    }
    this.prev = node;
    this.list.size++;
    return node;
  }

  insertNext(item) {
    const node = new ListNode(this.list, this, this.next, item);
    if (this == this.list.last) {
      this.list.last = node;
    }
    else {
      this.next.prev = node;
    }
    this.next = node;
    this.list.size++;
    return node;
  }

  swapWithPrev() {
    this.prev.next = this.next;
    if (this.next != null) {
      this.next.prev = this.prev;
    }
    this.next = this.prev;
    this.prev = this.prev.prev;
    this.next.prev = this;
    if (this.prev != null) {
      this.prev.next = this;
    }
    if (this.next == this.list.first) {
      this.list.first = this;
    }
    if (this == this.list.last) {
      this.list.last = this.next;
    }
  }

  swapWithNext() {
    this.next.prev = this.prev;
    if (this.prev != null) {
      this.prev.next = this.next;
    }
    this.prev = this.next;
    this.next = this.next.next;
    this.prev.next = this;
    if (this.next != null) {
      this.next.prev = this;
    }
    if (this.prev == this.list.last) {
      this.list.last = this;
    }
    if (this == this.list.first) {
      this.list.first = this.prev;
    }
  }

  remove() {
    if (this == this.list.last) {
      this.list.last = this.prev;
    }
    else {
      this.next.prev = this.prev;
    }
    if (this == this.list.first) {
      this.list.first = this.next;
    }
    else {
      this.prev.next = this.next;
    }
    this.list.size--;
  }
}
