Math.clamp = function(x, l, h) {
	return Math.min(Math.max(x, l), h);
}

Array.prototype.top = function() {
	return this[this.length - 1];
}
