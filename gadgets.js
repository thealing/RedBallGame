const DEFAULT_USER_INSTANCE =
`{
	onCollision: function(other, point) {
	},
	onCollisionWithPlayer: function(point) {
	},
}
`;

class Gadget {
	constructor(name) {
		this.name = name;
		this.userInstance = DEFAULT_USER_INSTANCE;
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

	addUserInstance(obj) {
		try {
			obj.userInstance = eval('(' + this.userInstance + ')');
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
			mass: 30
		});
		body.gadgetType = 0;
		body.renderProc = () => {
			drawImage(images.box, body.position, body.angle);
		};
		super.addUserInstance(body);
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
			pressed: false
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
		super.addUserInstance(body);
		return [ body, sensorBody ];
	}
}
