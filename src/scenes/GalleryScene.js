class GalleryScene extends Scene {
  enter() {
    super.enter();
    this.setAnchorToTopLeft();
    this.levelsOffset ??= 0;
    this.selectedLevel ??= -1;
    this.filter ??= '';
    this.draggingLevels = false;
    this.loading = true;
    this.rawLevels ??= [];
    this.levels ??= [];
    getPublicLevels((levels) => {
      this.loading = false;
      levels.reverse();
      this.rawLevels = levels;
      this.filterLevels();
    });
    this.buttons = [
      {
        position: new Vector(90, 670),
        halfSize: new Vector(80, 40),
        onRelease: () => {
          changeScene(scenes.main);
        },
        type: 1,
        text: 'BACK',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH - 90, 670),
        halfSize: new Vector(80, 40),
        onRelease: () => {
          showForm([
            {
              label: 'Filter Text',
              type: 'text',
              get: () => this.filter,
              set: (value) => {
                this.filter = value;
                this.selectedLevel = -1;
                this.levelsOffset = 0;
                this.filterLevels();
              }
            }
          ]);
        },
        type: 1,
        text: 'FILTER',
        font: '30px Arial'
      },
    ];
  }

  getLevelTitle(level) {
    return level.author + " : " + level.name;
  }

  filterLevels() {
    this.levels = [];
    for (const level of this.rawLevels) {
      const title = this.getLevelTitle(level);
      if (title.toLowerCase().includes(this.filter)) {
        this.levels.push(level);
      }
    }
  }

  render() {
    context.fillStyle = 'lightgray';
    context.fillRect(0, 0, canvas.width, canvas.height);
    super.render();
    if (this.loading) {
      drawText("Loading...", new Vector(20, 50), '36px Arial', 'left', WIDTH);
    }
  }

  renderWorld() {
    context.fillStyle = 'black';
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.lineCap = 'flat';
    context.save();
    context.translate(0, this.levelsOffset + 100);
    for (let i = 0; i < this.levels.length; i++) {
      if (i == this.selectedLevel) {
        context.fillStyle = 'darkgray';
        context.fillRect(0, i * 100 + 1, WIDTH, 100 - 1);
        context.fillStyle = 'black';
        drawImage(images.play_level, new Vector(WIDTH - 56, i * 100 + 50), 0);
      }
      drawText(this.getLevelTitle(this.levels[i]), new Vector(10, i * 100 + 50), '40px Arial', 'left', WIDTH - 222);
      drawSegment(new Vector(0, (i + 1) * 100), new Vector(WIDTH, (i + 1) * 100));
    }
    context.restore();
  }

  renderUI() {
    context.fillStyle = 'lightgray';
    context.fillRect(0, 620, WIDTH, 720);
    context.fillRect(0, 0, WIDTH, 100);
    context.lineWidth = 6;
    drawSegment(new Vector(0, 100), new Vector(WIDTH, 100));
    drawSegment(new Vector(0, 620), new Vector(WIDTH, 620));
    context.fillStyle = 'black';
    drawText('Public Levels', new Vector(WIDTH / 2, 50), '50px Arial');
    this.renderButtons();
  }

  onTouchDown(position) {
    super.onTouchDown(position);
    if (position.y >= 100 && position.y < 620) {
      this.draggingLevels = true;
    }
  }
  
  onTouchUp(position) {
    super.onTouchUp(position);
    this.draggingLevels = false;
  }
  
  onTouchMove(position, delta) {
    super.onTouchMove(position, delta);
    if (this.draggingLevels) {
      this.levelsOffset += delta.y;
      this.levelsOffset = Math.max(this.levelsOffset, -(this.levels.length - 5) * 100);
      this.levelsOffset = Math.min(this.levelsOffset, 0);
    }
  }

  onClick(position) {
    if (this.uiTouched) {
      return;
    }
    const touchedLevel = Math.floor((position.y - this.levelsOffset) / 100 - 1);
    if (touchedLevel == this.selectedLevel) {
      if (position.x < WIDTH - 106) {
        this.selectedLevel = -1;
      }
      if (position.x >= WIDTH - 106 && position.x < WIDTH - 6) {
        gameData.currentLevel = this.levels[touchedLevel];
        gameData.onLevelExit = () => {
          changeScene(scenes.gallery);
        }
        changeScene(scenes.play);
      }
    }
    else if (touchedLevel >= 0 && touchedLevel < this.levels.length) {
      this.selectedLevel = touchedLevel;
    }
  }
}
