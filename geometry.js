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
  let abX = b.x - a.x;
  let abY = b.y - a.y;
  let apX = p.x - a.x;
  let apY = p.y - a.y;
  let t = Math.clamp((abX * apX + abY * apY) / (abX * abX + abY * abY), 0, 1);
  let projectedX = a.x + t * abX;
  let projectedY = a.y + t * abY;
  return { x: projectedX, y: projectedY };
}

function distanceFromSegment(p, a, b) {
  let abX = b.x - a.x;
  let abY = b.y - a.y;
  let apX = p.x - a.x;
  let apY = p.y - a.y;
  let t = Math.clamp((abX * apX + abY * apY) / (abX * abX + abY * abY), 0, 1);
  let projectedX = a.x + t * abX;
  let projectedY = a.y + t * abY;
  let distanceSquared = (p.x - projectedX) * (p.x - projectedX) + (p.y - projectedY) * (p.y - projectedY);
  return Math.sqrt(distanceSquared);
}

function distanceFromPolyline(point, polyline) {
  let distance = Number.POSITIVE_INFINITY;
  for (let i = 0; i + 1 < polyline.length; i++) {
    distance = Math.min(distance, distanceFromSegment(point, polyline[i], polyline[i + 1]));
  }
  return distance;
}

function testPointPolygon(point, polygon) {
  let count1 = 0;
  let count2 = 0;
  for (let i1 = polygon.length - 1, i2 = 0; i2 < polygon.length; i1 = i2, i2++) {
    count1 += orientation(point, polygon[i1], polygon[i2]) >= 0;
    count2 += orientation(point, polygon[i1], polygon[i2]) <= 0;
  }
  return count1 == polygon.length || count2 == polygon.length;
}

function generateEllipse(topLeft, bottomRight) {
  const cx = (topLeft.x + bottomRight.x) / 2;
  const cy = (topLeft.y + bottomRight.y) / 2;
  const rx = Math.abs(bottomRight.x - topLeft.x) / 2;
  const ry = Math.abs(bottomRight.y - topLeft.y) / 2;
  const points = [];
  const da = Math.PI * 2 / 108;
  for (let a = 0; a <= Math.PI * 2; a += da) {
    const x = cx + rx * Math.cos(a);
    const y = cy + ry * Math.sin(a);
    points.push({ x, y });
  }
  return points;
}
