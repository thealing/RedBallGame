## Custom Ball

This is a Red Ball clone game, but instead of limited amount of pre-made levels, here you have a **level editor** so you can **create and publish unlimited number of levels**. You can also play levels published by other players. You can sign-up and log-in with only a username and password.

Hosted at: <https://redballgame.netlify.app>

**How To Play**

- Keyboard Controls
  - A – go left
  - D – go right
  - W – jump
- My Levels
  - Click the + button to create a new empty level
  - Click a level to edit or delete it
  - Long click a level to change it's name
- Public Levels
  - The levels are sorted by publish date (the latest is on the top)
  - The names of the levels along with the username of their author are displayed
- Editor
  - Moving
    - Drag objects to move them
    - Drag the background to move the camera
    - Long click to set coordinates
  - Drawing
    - Materials: grass, lava, ice, invisible
    - Shapes: free-form, line, rectangle, oval
    - Drag to draw the shape with the selected material
  - Erasing
    - Click on a shape to erase it
  - Objects and Decorations
    - Placed stars will have to be collected before finishing to complete the level
    - Gear icon
      - Click to configure the object
      - Long click to see or change the name of the object
    - Brush icon
      - Click to change skin (only for some decorations)
      - Drag to rotate objects
    - Duplicate icon
      - Click to duplicate objects
    - Bin icon
      - Click to delete objects
  - Power Objects
    - Some objects can be turned on and off (like the windmill, booster, elevator...)
    - You can set a controller for these, which has to be the name of a button, switch or sensor
  - Grid
    - Possible to snap center of objects to grid while dragging
  - Zoom
    - Hold down the buttons to zoom in or out

**About**

- No game engines, no libraries, no frameworks
- Playable in any browser with ES6
- Variable aspect ratio (min. 4:3)
- All levels, stats, preferences are saved on the server
