class MenuScene extends Scene {
  enter() {
    super.enter();
    this.setAnchorToTopLeft();
    this.draftLevelsOffset = 200;
    this.publishedLevelsOffset = 200;
    this.selectedDraftLevel = -1;
    this.selectedPublishedLevel = -1;
    this.draggingLevels = false;
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
    ];
  }
  
  render() {
    context.fillStyle = 'lightgray';
    context.fillRect(0, 0, canvas.width, canvas.height);
    super.render();
  }
  
  renderWorld() {
    context.fillStyle = 'black';
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.lineCap = 'flat';
    context.save();
    context.translate(0, this.draftLevelsOffset);
    for (let i = 0; i < playerData.draftLevels.length; i++) {
      if (i == this.selectedDraftLevel) {
        context.fillStyle = 'darkgray';
        context.fillRect(0, i * 100 + 1, WIDTH / 2, 100 - 1);
        context.fillStyle = 'black';
        drawImage(images.edit_level, new Vector(WIDTH / 2 - 156, i * 100 + 50), 0);
        drawImage(images.delete_level, new Vector(WIDTH / 2 - 56, i * 100 + 50), 0);
      }
      drawText(playerData.draftLevels[i].name, new Vector(10, i * 100 + 50), '40px Arial', 'left', WIDTH / 2 - 222);
      drawSegment(new Vector(0, (i + 1) * 100), new Vector(WIDTH / 2, (i + 1) * 100));
    }
    drawImage(images.new_level, new Vector(WIDTH / 4, playerData.draftLevels.length * 100 + 50), 0);
    context.restore();
    context.save();
    context.translate(0, this.publishedLevelsOffset);
    for (let i = 0; i < playerData.publishedLevels.length; i++) {
      if (i == this.selectedPublishedLevel) {
        context.fillStyle = 'darkgray';
        context.fillRect(WIDTH / 2, i * 100 + 1, WIDTH, 100 - 1);
        context.fillStyle = 'black';
        drawImage(images.play_level, new Vector(WIDTH - 156, i * 100 + 50), 0);
      }
      drawImage(playerData.publishedLevels[i].sentToServer ? images.level_synced : images.level_dirty, new Vector(WIDTH - 56, i * 100 + 50), 0);
      drawText(playerData.publishedLevels[i].name, new Vector(WIDTH / 2 + 10, i * 100 + 50), '40px Arial', 'left', WIDTH / 2 - 222);
      drawSegment(new Vector(WIDTH / 2, (i + 1) * 100), new Vector(WIDTH, (i + 1) * 100));
    }
    context.restore();
    context.lineWidth = 6;
  }
  
  renderUI() {
    context.fillStyle = 'lightgray';
    context.fillRect(0, 620, WIDTH, 720);
    context.fillRect(0, 0, WIDTH, 200);
    context.lineWidth = 6;
    drawSegment(new Vector(0, 100), new Vector(WIDTH, 100));
    drawSegment(new Vector(0, 200), new Vector(WIDTH, 200));
    drawSegment(new Vector(0, 620), new Vector(WIDTH, 620));
    drawSegment(new Vector(WIDTH / 2, 100), new Vector(WIDTH / 2, 620));
    context.fillStyle = 'black';
    drawText('My Levels', new Vector(WIDTH / 2, 50), '50px Arial');
    drawText('Drafts', new Vector(WIDTH / 4, 150), '50px Arial');
    drawText('Published', new Vector(WIDTH / 2 + WIDTH / 4, 150), '50px Arial');
    this.renderButtons();
  }
  
  onTouchDown(position) {
    super.onTouchDown(position);
    if (position.y >= 200 && position.y < 620) {
      this.draggingLevels = position.x < WIDTH / 2 ? 'drafts' : 'published';
    }
  }
  
  onTouchUp(position) {
    super.onTouchUp(position);
    this.draggingLevels = null;
  }
  
  onTouchMove(position, delta) {
    super.onTouchMove(position, delta);
    if (this.draggingLevels == 'drafts') {
      this.draftLevelsOffset += delta.y;
      this.draftLevelsOffset = Math.max(this.draftLevelsOffset, 200 - playerData.draftLevels.length * 100);
      this.draftLevelsOffset = Math.min(this.draftLevelsOffset, 200);
    }
    if (this.draggingLevels == 'published') {
      this.publishedLevelsOffset += delta.y;
      this.publishedLevelsOffset = Math.max(this.publishedLevelsOffset, 200 - (playerData.publishedLevels.length - 1) * 100);
      this.publishedLevelsOffset = Math.min(this.publishedLevelsOffset, 200);
    }
  }
  
  onClick(position) {
    if (position.x < WIDTH / 2) {
      const touchedDraftLevel = Math.floor((position.y - this.draftLevelsOffset) / 100);
      if (touchedDraftLevel == playerData.draftLevels.length) {
        playerData.levelsCreated++;
        playerData.draftLevels.push({
          id: generateRandomId(),
          name: 'Level ' + playerData.levelsCreated,
          author: playerData.username,
          player: new Vector(-100, 0),
          goal: new Vector(100, 0),
          terrain: [],
          gadgets: [],
          verified: false,
          gadgetsCreated: new Array(EditorScene.gadgetTypes.length + EditorScene.decorTypes.length).fill(0),
          upperColor: '#add8e6',
          lowerColor: '#00008b'
        });
        this.selectedDraftLevel = playerData.draftLevels.length - 1;
      }
      else if (touchedDraftLevel >= 0) {
        if (touchedDraftLevel == this.selectedDraftLevel) {
          if (position.x < WIDTH / 2 - 206) {
            this.selectedDraftLevel = -1;
          }
          if (position.x >= WIDTH / 2 - 206 && position.x < WIDTH / 2 - 106) {
            gameData.currentLevel = playerData.draftLevels[this.selectedDraftLevel];
            changeScene(scenes.editor);
          }
          if (position.x >= WIDTH / 2 - 106 && position.x < WIDTH / 2 - 6) {
            playerData.draftLevels.splice(this.selectedDraftLevel, 1);
            this.selectedDraftLevel = -1;
          }
        }
        else if (touchedDraftLevel < playerData.draftLevels.length) {
          this.selectedDraftLevel = touchedDraftLevel;
          this.selectedPublishedLevel = -1;
        }
      }
    }
    else {
      const touchedPublishedLevel = Math.floor((position.y - this.publishedLevelsOffset) / 100);
      if (touchedPublishedLevel >= 0 && touchedPublishedLevel == this.selectedPublishedLevel) {
        if (position.x < WIDTH - 106) {
          this.selectedPublishedLevel = -1;
        }
        if (position.x >= WIDTH - 206 && position.x < WIDTH - 106) {
          gameData.currentLevel = playerData.publishedLevels[touchedPublishedLevel];
          gameData.onLevelExit = () => {
            changeScene(scenes.menu);
          }
          changeScene(scenes.play);
        }
      }
      else if (touchedPublishedLevel >= 0 && touchedPublishedLevel < playerData.publishedLevels.length) {
        this.selectedPublishedLevel = touchedPublishedLevel;
        this.selectedDraftLevel = -1;
      }
    }
  }
  
  onLongClick(position) {
    if (position.x < WIDTH / 2) {
      const touchedDraftLevel = Math.floor((position.y - this.draftLevelsOffset) / 100);
      if (touchedDraftLevel == this.selectedDraftLevel) {
        if (position.x < WIDTH / 2 - 206) {
          showInputPopup(playerData.draftLevels[this.selectedDraftLevel].name, (text) => {
            playerData.draftLevels[this.selectedDraftLevel].name = text;
          });
        }
      }
    }
  }
}
