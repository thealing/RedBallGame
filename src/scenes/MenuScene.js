class MenuScene extends Scene {
  enter() {
    super.enter();
    this.setAnchorToTopLeft();
    if (this.currentUsername != playerData.username) {
      this.currentUsername = playerData.username;
      this.draftLevelsOffset = 200;
      this.publishedLevelsOffset = 200;
      this.selectedDraftLevel = -1;
      this.selectedPublishedLevel = -1;
    }
    if (this.addedLevels) {
      this.addedLevels = false;
      this.draftLevelsOffset = Math.min(200, HEIGHT - 200 - playerData.draftLevels.length * 100);
    }
    this.draggingLevels = false;
    this.buttons = [
      {
        position: new Vector(90, HEIGHT - 50),
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
      }
      drawText(playerData.draftLevels[i].name, new Vector(10, i * 100 + 50), '40px Arial', 'left', WIDTH / 2 - 22);
      if (i == this.selectedDraftLevel) {
        context.fillStyle = 'darkgray';
        drawOpaqueLevelImage(images.edit_level, new Vector(WIDTH / 2 - 156, i * 100 + 50), 0);
        drawOpaqueLevelImage(images.delete_level, new Vector(WIDTH / 2 - 56, i * 100 + 50), 0);
        context.fillStyle = 'black';
      }
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
      }
      drawText(playerData.publishedLevels[i].name, new Vector(WIDTH / 2 + 10, i * 100 + 50), '40px Arial', 'left', WIDTH / 2 - 122);
      if (i == this.selectedPublishedLevel) {
        context.fillStyle = 'darkgray';
        drawOpaqueLevelImage(images.play_level, new Vector(WIDTH - 156, i * 100 + 50), 0);
        drawOpaqueLevelImage(images.download_level, new Vector(WIDTH - 256, i * 100 + 50), 0);
        context.fillStyle = 'black';
      }
      drawImage(playerData.publishedLevels[i].sentToServer ? images.level_synced : images.level_dirty, new Vector(WIDTH - 56, i * 100 + 50), 0);
      drawSegment(new Vector(WIDTH / 2, (i + 1) * 100), new Vector(WIDTH, (i + 1) * 100));
    }
    context.restore();
    context.lineWidth = 6;
  }
  
  renderUI() {
    context.fillStyle = 'lightgray';
    context.fillRect(0, HEIGHT - 100, WIDTH, HEIGHT);
    context.fillRect(0, 0, WIDTH, 200);
    context.lineWidth = 6;
    drawSegment(new Vector(0, 100), new Vector(WIDTH, 100));
    drawSegment(new Vector(0, 200), new Vector(WIDTH, 200));
    drawSegment(new Vector(0, HEIGHT - 100), new Vector(WIDTH, HEIGHT - 100));
    drawSegment(new Vector(WIDTH / 2, 100), new Vector(WIDTH / 2, HEIGHT - 100));
    context.fillStyle = 'black';
    drawText('My Levels', new Vector(WIDTH / 2, 50), '50px Arial');
    drawText('Drafts', new Vector(WIDTH / 4, 150), '50px Arial');
    drawText('Published', new Vector(WIDTH / 2 + WIDTH / 4, 150), '50px Arial');
    this.renderButtons();
  }
  
  onTouchDown(position) {
    super.onTouchDown(position);
    if (position.y >= 200 && position.y < HEIGHT - 100) {
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
      this.draftLevelsOffset = Math.max(this.draftLevelsOffset, 300 - playerData.draftLevels.length * 100);
      this.draftLevelsOffset = Math.min(this.draftLevelsOffset, 200);
    }
    if (this.draggingLevels == 'published') {
      this.publishedLevelsOffset += delta.y;
      this.publishedLevelsOffset = Math.max(this.publishedLevelsOffset, 200 - (playerData.publishedLevels.length - 1) * 100);
      this.publishedLevelsOffset = Math.min(this.publishedLevelsOffset, 200);
    }
  }
  
  onClick(position) {
    if (position.y <= 200 || position.y >= HEIGHT - 100) {
      if (!this.uiTouched) {
        this.selectedPublishedLevel = -1;
        this.selectedDraftLevel = -1;
      }
      return;
    }
    if (position.x < WIDTH / 2) {
      const touchedDraftLevel = Math.floor((position.y - this.draftLevelsOffset) / 100);
      if (touchedDraftLevel == playerData.draftLevels.length && position.x < WIDTH / 4 + 125 && position.x > WIDTH / 4 - 125) {
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
        this.selectedPublishedLevel = -1;
        doubleClickPosition = null;
        saveLocalData();
      }
      else if (touchedDraftLevel >= 0) {
        if (touchedDraftLevel == this.selectedDraftLevel) {
          if (position.x >= WIDTH / 2 - 206 && position.x < WIDTH / 2 - 106) {
            gameData.currentLevel = playerData.draftLevels[this.selectedDraftLevel];
            changeScene(scenes.editor);
          }
          if (position.x >= WIDTH / 2 - 106 && position.x < WIDTH / 2 - 6) {
            playerData.draftLevels.splice(this.selectedDraftLevel, 1);
            this.selectedDraftLevel = -1;
            saveLocalData();
          }
        }
        else if (touchedDraftLevel < playerData.draftLevels.length) {
          this.selectedDraftLevel = touchedDraftLevel;
          this.selectedPublishedLevel = -1;
        }
        else {
          this.selectedPublishedLevel = -1;
          this.selectedDraftLevel = -1;
        }
      }
    }
    else {
      const touchedPublishedLevel = Math.floor((position.y - this.publishedLevelsOffset) / 100);
      if (touchedPublishedLevel >= 0 && touchedPublishedLevel == this.selectedPublishedLevel) {
        if (position.x >= WIDTH - 206 && position.x < WIDTH - 106) {
          gameData.currentLevel = playerData.publishedLevels[touchedPublishedLevel];
          gameData.onLevelExit = () => {
            changeScene(scenes.menu);
          }
          changeScene(scenes.play);
        }
        if (position.x >= WIDTH - 306 && position.x < WIDTH - 206) {
          downloadLevel(playerData.publishedLevels[touchedPublishedLevel]);
          this.draftLevelsOffset = Math.min(HEIGHT - 200 - playerData.draftLevels.length * 100, 200);
        }
      }
      else if (touchedPublishedLevel >= 0 && touchedPublishedLevel < playerData.publishedLevels.length) {
        this.selectedPublishedLevel = touchedPublishedLevel;
        this.selectedDraftLevel = -1;
      }
      else {
        this.selectedPublishedLevel = -1;
        this.selectedDraftLevel = -1;
      }
    }
  }
  
  onDoubleClick(position) {
    if (position.y <= 200 || position.y >= HEIGHT - 100) {
      if (!this.uiTouched) {
        this.selectedPublishedLevel = -1;
        this.selectedDraftLevel = -1;
      }
      return;
    }
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
