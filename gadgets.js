class Gadget {
	constructor(name) {
		this.name = name;
		this.userCallback = '(event, data, sendCommand) => {\n}\n';
	}

	testPoint(point) {
		return false;
	}

	drag(position, delta) {
	}

	render() {
	}

	createBody() {
	}

	addUserCallback(obj) {
		try {
			obj.userCallback = eval(this.userCallback);
			obj.userCallback.bind(obj);
		}
		catch (e) {
			console.warn("Instantiation Error:\n" + e);
		}
	}
}

class Box extends Gadget {
	constructor(name, position) {
		super(name);
		this.center = position;
		this.halfSize = 50;
	}

	testPoint(point) {
		return testPointRect(point, Vector.subtractXY(this.center, this.halfSize, this.halfSize), Vector.addXY(this.center, this.halfSize, this.halfSize));
	}

	drag(position, delta) {
		this.center.add(delta);
	}

	render() {
		drawImage(images.box, this.center, 0);
	}

	createBodies() {
		const body = Matter.Bodies.rectangle(this.center.x, this.center.y, this.halfSize * 2 - 14, this.halfSize * 2 - 14, {
			friction: 20,
			frictionStatic: 20,
			frictionAir: 0,
			slop: 10,
			restitution: 0,
			mass: 30,
			name: this.name
		});
		body.gadgetType = 0;
		body.renderProc = () => {
			drawImage(images.box, body.position, body.angle);
		};
		super.addUserCallback(body);
		return [ body ];
	}
}

class Button extends Gadget {
	constructor(name, position) {
		super(name);
		this.center = position;
	}

	testPoint(point) {
		return testPointRect(point, Vector.subtractXY(this.center, 40, 20), Vector.addXY(this.center, 40, 40));
	}

	drag(position, delta) {
		this.center.add(delta);
	}

	render() {
		drawImage(images.button, this.center, 0);
	}

	createBodies() {
		const body = Matter.Bodies.rectangle(this.center.x, this.center.y + 25, 80, 20, {
			friction: 20,
			frictionStatic: 20,
			frictionAir: 0,
			slop: 10,
			restitution: 0,
			mass: 30,
			isStatic: true,
			pressed: false,
			name: this.name
		});
		body.gadgetType = 1;
		body.renderProc = () => {
			drawImage(body.pressed ? images.button_pressed : images.button, Vector.addXY(body.position, 0, -25), body.angle);
		};
		const sensorBody = Matter.Bodies.rectangle(this.center.x, this.center.y, 72, 15, {
			isStatic: true,
			isSensor: true
		});
		sensorBody.onCollision = (otherBody, point) => {
			body.pressed = true;
		};
		super.addUserCallback(body);
		return [ body, sensorBody ];
	}
}

class Plank extends Gadget {
	constructor(name, position) {
		super(name);
		this.start = Vector.addXY(position, -100, 0);
		this.end = Vector.addXY(position, 100, 0);
	}

	testPoint(point) {
		return distanceFromSegment(point, this.start, this.end) < 10;
	}

	drag(position, delta) {
		if (!position) {
			this.start.add(delta);
			this.end.add(delta);
		}
		else {
			const distanceFromStart = Vector.distance(position, this.start);
			const distanceFromEnd = Vector.distance(position, this.end);
			if (distanceFromStart < 40 && distanceFromEnd >= 40) {
				this.start.add(delta);
			}
			else if (distanceFromEnd < 40 && distanceFromStart >= 40) {
				this.end.add(delta);
			}
			else {
				this.start.add(delta);
				this.end.add(delta);
			}
		}
		const length = this.getLength();
		const minLength = 60;
		if (length > 0 && length < minLength) {
			const offset = Vector.subtract(this.end, this.start).multiply(80 / minLength);
			this.start.add(offset);
			this.end.subtract(offset);
		}
	}

	render() {
		drawImage(images.plank, this.getCenter(), this.getAngle(), { x: this.getLength() / 200, y: 1 });
		drawImage(images.plank_end, this.start, this.getAngle());
		drawImage(images.plank_end, this.end, this.getAngle());
	}

	createBodies() {
		const center = this.getCenter();
		const length = this.getLength();
		const angle = this.getAngle();
		const body = Matter.Bodies.rectangle(center.x, center.y, length, 16, {
			angle: angle,
			friction: 0.5,
			frictionStatic: 0.5,
			frictionAir: 0.5,
			slop: 10,
			restitution: 0,
			mass: 30,
			isStatic: true,
			name: this.name
		});
		body.gadgetType = 2;
		body.renderProc = () => {
			drawImage(images.plank, body.position, body.angle, { x: length / 200, y: 1 });
			drawImage(images.plank_end, { x: body.position.x - length / 2 * Math.cos(body.angle), y: body.position.y - length / 2 * Math.sin(body.angle) }, body.angle);
			drawImage(images.plank_end, { x: body.position.x + length / 2 * Math.cos(body.angle), y: body.position.y + length / 2 * Math.sin(body.angle) }, body.angle);
		};
		super.addUserCallback(body);
		return [ body ];
	}

	getLength() {
		return Vector.distance(this.start, this.end);
	}

	getCenter() {
		return Vector.middle(this.start, this.end);
	}

	getAngle() {
		return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
	}
}
