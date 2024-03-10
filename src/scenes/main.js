class MainScene extends Scene {
  enter() {
    super.enter();
    this.setAnchorToTopLeft();
    this.buttons = [
      {
        position: new Vector(WIDTH / 2, 210),
        halfSize: new Vector(210, 50),
        onRelease: () => {
          changeScene(scenes.menu);
        },
        type: 2,
        text: 'My Levels',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH / 2, 360),
        halfSize: new Vector(210, 50),
        onRelease: () => {
          changeScene(scenes.gallery);
        },
        type: 2,
        text: 'Public Levels',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH / 2, 510),
        halfSize: new Vector(210, 50),
        onRelease: () => {
          playerData.username = '';
          playerData.password = '';
          showUserPopup();
        },
        type: 2,
        text: 'Log Out',
        font: '30px Arial'
      }
    ];
    if (playerData.username.length == 0) {
      showUserPopup();
    }
  }

  render() {
    context.fillStyle = playerData.username.length > 0 ? 'lightgray' : 'dimgray';
    context.fillRect(0, 0, canvas.width, canvas.height);
    super.render();
  }
  
  renderUI() {
    if (playerData.username.length > 0) {
      context.fillStyle = 'black';
      context.strokeStyle = 'black';
      this.renderButtons();
      drawText(playerData.username, { x: 30, y: 40 }, "25px Arial", "left");
    }
  }

  onClick(position) {
    super.onClick();
    const size = measureText(playerData.username, "25px Arial", "left");
    if (position.x >= 30 && position.x <= 30 + size.x && Math.abs(position.y - 40) <= size.y / 2) {
      // changeScene(scenes.profile);
    }
  }
}
