class MainScene extends Scene {
  enter() {
    super.enter();
    this.setAnchorToTopLeft();
    this.buttons = [
      {
        position: new Vector(WIDTH / 4 * 1, HEIGHT * 0.3),
        halfSize: new Vector(210, 50),
        onRelease: () => {
          changeScene(scenes.menu);
        },
        type: 2,
        text: 'My Levels',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH / 4 * 3, HEIGHT * 0.3),
        halfSize: new Vector(210, 50),
        onRelease: () => {
          changeScene(scenes.gallery);
        },
        type: 2,
        text: 'Public Levels',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH / 4 * 1, HEIGHT * 0.5),
        halfSize: new Vector(210, 50),
        onRelease: () => {
          showForm([
            {
              label: 'Levels Created',
              type: 'span',
              get: () => playerData.levelsCreated
            },
            {
              label: 'Levels Finished',
              type: 'span',
              get: () => playerData.finishedLevelIds.length
            },
            {
              label: 'Deaths',
              type: 'span',
              get: () => playerData.deathCount
            }
          ]);
        },
        type: 2,
        text: 'Stats',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH / 4 * 3, HEIGHT * 0.5),
        halfSize: new Vector(210, 50),
        onRelease: () => {
          showForm([
            {
              label: 'Long Press Delay',
              type: 'number',
              step: 100,
              get: () => playerData.longPressDelay,
              set: (value) => {
                playerData.longPressDelay = value;
              }
            },
            {
              label: 'Ball Color',
              type: 'color',
              get: () => playerData.ballColor,
              set: (value) => {
                playerData.ballColor = value;
              }
            }
          ]);
        },
        type: 2,
        text: 'Preferences',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH / 2, HEIGHT * 0.7),
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
}
