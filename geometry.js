function orientation(a, b, c) {
	return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
}

function testPointRect(p, a, b) {
	return p.x >= a.x && p.y >= a.y && p.x <= b.x && p.y <= b.y;
}

function testPointTriangle(p, a, b, c) {
	return orientation(a, b, p) >= 0 && orientation(b, c, p) >= 0 && orientation(c, a, p) >= 0;
}

function testSegments(a1, b1, a2, b2) {
	return orientation(a1, b1, a2) * orientation(a1, b1, b2) < 0 && orientation(a2, b2, a1) * orientation(a2, b2, b1) < 0;
}

function projectOntoSegment(p, a, b) {
	var abX = b.x - a.x;
	var abY = b.y - a.y;
	var apX = p.x - a.x;
	var apY = p.y - a.y;
	var t = Math.clamp((abX * apX + abY * apY) / (abX * abX + abY * abY), 0, 1);
	var projectedX = a.x + t * abX;
	var projectedY = a.y + t * abY;
	return { x: projectedX, y: projectedY };
}

function distanceFromSegment(p, a, b) {
	var abX = b.x - a.x;
	var abY = b.y - a.y;
	var apX = p.x - a.x;
	var apY = p.y - a.y;
	var t = Math.clamp((abX * apX + abY * apY) / (abX * abX + abY * abY), 0, 1);
	var projectedX = a.x + t * abX;
	var projectedY = a.y + t * abY;
	var distanceSquared = (p.x - projectedX) * (p.x - projectedX) + (p.y - projectedY) * (p.y - projectedY);
	return Math.sqrt(distanceSquared);
}

function distanceFromPolyline(point, polyline) {
	var distance = Number.POSITIVE_INFINITY;
	for (var i = 0; i + 1 < polyline.length; i++) {
		distance = Math.min(distance, distanceFromSegment(point, polyline[i], polyline[i + 1]));
	}
	return distance;
}
