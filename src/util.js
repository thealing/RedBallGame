class Util {
  static clamp(x, l, u) {
    return Math.min(Math.max(x, l), u);
  }

  static cloneArray(array) {
    return array.map((item) => item.clone());
  }
  
  static averageOfArray(array) {
    if (array.length == 0) {
      return 0;
    }
    let sum = 0;
    for (const i of array) {
      sum += i;
    }
    return sum / array.length;
  }
}
