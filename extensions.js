Object.clone = function(obj) {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}
	if (Array.isArray(obj)) {
		return obj.map(Object.clone);
	}
	const cloned = Object.create(Object.getPrototypeOf(obj));
	for (const key in obj) {
		if (typeof obj[key] === "function") {
			cloned[key] = obj[key].bind(cloned);
		} else {
			cloned[key] = Object.clone(obj[key]);
		}
	}
	return cloned;
}

Math.clamp = function(x, l, h) {
	return Math.min(Math.max(x, l), h);
}

Array.prototype.top = function() {
	return this[this.length - 1];
}
