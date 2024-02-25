class Gadget {
	constructor(position) {
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
}

class Box extends Gadget {
	constructor(position) {
		super(position);
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

	createBody() {
		const body = Matter.Bodies.rectangle(this.center.x, this.center.y, this.halfSize * 2 - 14, this.halfSize * 2 - 14, {
			friction: 20,
			frictionStatic: 20,
			frictionAir: 0,
			slop: 10,
			restitution: 0,
			mass: 30
		});
		body.render = () => {
			drawImage(images.box, body.position, body.angle);
		};
		return body;
	}
}
