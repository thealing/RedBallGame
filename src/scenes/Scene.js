class Scene {
  enter() {
    this.anchor = new Vector(0, 0);
    this.origin = new Vector(0, 0);
    this.zoom = 1;
    this.buttons = [];
    this.buttonPressed = null;
  }

  leave() {
  }

  update() {
  }

  render() {
    context.save();
    context.translate(this.anchor.x, this.anchor.y);
    context.scale(this.zoom, this.zoom);
    context.translate(this.origin.x, this.origin.y);
    this.renderWorld();
    context.restore();
    this.renderUI();
  }

  renderWorld() {
  }

  renderUI() {
  }

  onTouchDown(position) {
    this.uiTouched = false;
    for (let button of this.buttons) {
      if (testPointRect(position, Vector.subtract(button.position, button.halfSize), Vector.add(button.position, button.halfSize))) {
        if (!button.disabled && !button.hidden) {
          if (button.toggled != undefined) {
            if (button.autoToggle) {
              button.toggled = !button.toggled;
            }
          }
          else {
            this.buttonPressed = button;
          }
          button.onPress?.();
          this.uiTouched = true;
        }
      }
    }
  }

  onTouchUp(position) {
    if (this.buttonPressed) {
      this.buttonPressed.onRelease?.();
      this.buttonPressed = null;
    }
    else {
      this.uiTouched = false;
    }
  }

  onTouchMove(position, delta, downPosition) {
    if (this.buttonPressed && !testPointRect(position, Vector.subtract(this.buttonPressed.position, this.buttonPressed.halfSize), Vector.add(this.buttonPressed.position, this.buttonPressed.halfSize))) {
      this.buttonPressed = null;
    }
  }
  
  onClick(position) {
  }
  
  onLongClick(position) {
  }
  
  updateButtons() {
    if (this.buttonPressed) {
      this.buttonPressed.onHold?.();
    }
  }
  
  renderButtons() {
    for (let button of this.buttons) {
      if (button.hidden) {
        continue;
      }
      if (button.type != undefined) {
        if (button == this.buttonPressed) {
          drawImage(images.ui.buttons[button.type].pressed, button.position, 0);
        }
        else if (button.toggled) {
          drawImage(images.ui.buttons[button.type].selected, button.position, 0);
        }
        else if (button.disabled) {
          drawImage(images.ui.buttons[button.type].disabled, button.position, 0);
        }
        else {
          drawImage(images.ui.buttons[button.type].frame, button.position, 0);
        }
      }
      if (button.renderProc) {
        context.save();
        context.translate(button.position.x, button.position.y);
        button.renderProc();
        context.restore();
        continue;
      }
      if (button.icon) {
        drawImage(button.icon, button.position, 0);
      }
      if (button.text) {
        drawText(button.text, button.position, button.font);
      }
    }
  }

  screenToWorldPosition(position) {
    return Vector.subtract(position, this.anchor).divide(this.zoom).subtract(this.origin);
  }

  screenToWorldDelta(delta) {
    return Vector.divide(delta, this.zoom);
  }
  
  setAnchorToCenter() {
    this.anchor.set(WIDTH / 2, HEIGHT / 2);
  }
  
  setAnchorToTopLeft() {
    this.anchor.set(0, 0);
  }
}
