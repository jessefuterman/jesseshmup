// This sectin contains some game constants. It is not super interesting
let GAME_WIDTH = 450;
let GAME_HEIGHT = 400;

let ENEMY_WIDTH = 75;
let ENEMY_HEIGHT = 135;
let MAX_ENEMIES = 3;

let PLAYER_WIDTH = 75;
let PLAYER_HEIGHT = 70;

let BULLET_HEIGHT = 50;
let BULLET_WIDTH = 50;

// These two constants keep us from using "magic numbers" in our code
let LEFT_ARROW_CODE = 37;
let RIGHT_ARROW_CODE = 39;
let SPACEBAR_CODE = 32;

// These two constants allow us to DRY
let MOVE_LEFT = "left";
let MOVE_RIGHT = "right";

// Preload game images
let imageFilenames = ["enemy1.png", "original.gif", "ship.png", "bullet2.png"];
let images = {};
// let animation =

imageFilenames.forEach(function(imgName) {
  let img = document.createElement("img");
  img.src = "images/" + imgName;

  images[imgName] = img;
});

let app = document.getElementById("app");

class Entity {
  render(ctx) {
    this.domElement.style.left = this.x + "px";
    this.domElement.style.top = this.y + "px";
  }
}

// This section is where you will be doing most of your coding
class Enemy extends Entity {
  constructor(root, xPos) {
    super();
    this.root = root;
    this.x = xPos;
    this.y = -ENEMY_HEIGHT;
    this.height = ENEMY_HEIGHT;
    this.width = ENEMY_WIDTH;

    let img = document.createElement("img");
    img.src = "images/enemy1.png";
    img.style.position = "absolute";
    img.style.left = this.x + "px";
    img.style.top = this.y + "px";
    img.style.zIndex = 5;
    root.appendChild(img);

    this.domElement = img;
    // Each enemy should have a different speed
    this.speed = Math.random() / 2 + 0.25;

    this.destroy = this.destroy.bind(this);
  }

  update(timeDiff) {
    this.y = this.y + timeDiff * this.speed;
  }

  destroy() {
    // When an enemy reaches the end of the screen, the corresponding DOM element should be destroyed
    this.root.removeChild(this.domElement);
  }
}

class Player extends Entity {
  constructor(root) {
    super();
    this.root = root;
    this.x = 2 * PLAYER_WIDTH;
    this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
    this.height = ENEMY_HEIGHT;
    this.width = ENEMY_WIDTH;
    this.bullets = 100;

    let img = document.createElement("img");
    img.src = "images/ship.png";
    img.style.position = "absolute";
    img.style.left = this.x + "px";
    img.style.top = this.y + "px";
    img.style.zIndex = "10";

    root.appendChild(img);

    this.domElement = img;
  }

  shoot() {
    if (this.bullets > 0) {
      explosionSound();
      let bullet = new Bullet(this.root, this.x, this.y);
      this.bullets--;
      return bullet;
    }
  }

  // This method is called by the game engine when left/right arrows are pressed
  move(direction) {
    if (direction === MOVE_LEFT && this.x > 0) {
      this.x = this.x - PLAYER_WIDTH;
    } else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
      this.x = this.x + PLAYER_WIDTH;
    }
  }
}

///this is the bullet

class Bullet extends Entity {
  constructor(root, xPos, yPos) {
    super();

    this.root = root;
    this.x = xPos;
    this.y = yPos;
    this.height = BULLET_HEIGHT;
    this.width = BULLET_WIDTH;

    let img = document.createElement("img");
    img.src = "images/bullet2.png";
    img.style.position = "absolute";
    img.style.left = this.x + "px";
    img.style.top = this.y + "px";
    img.style.zIndex = 5;
    img.style.maxWidth = "50px";
    img.style.transform = "rotate(-90deg)";
    root.appendChild(img);

    this.domElement = img;
    // Each enemy should have a different speed
    this.speed = 1;
  }

  update(timeDiff) {
    this.y = this.y - timeDiff * this.speed;
  }

  destroy() {
    // When an enemy reaches the end of the screen, the corresponding DOM element should be destroyed
    this.root.removeChild(this.domElement);
  }
}

class Text {
  constructor(root, xPos, yPos) {
    this.root = root;

    let span = document.createElement("span");
    span.style.zIndex = 5;
    span.style.position = "absolute";
    span.style.left = xPos;
    span.style.top = yPos;
    span.style.font = "bold 30px Impact";

    root.appendChild(span);
    this.domElement = span;
  }

  // This method is called by the game engine when left/right arrows are pressed
  update(txt) {
    this.domElement.innerText = txt;
  }
}

/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
*/
class Engine {
  constructor(element) {
    this.root = element;
    // Setup the player
    this.player = new Player(this.root);
    this.info = new Text(this.root, 5, 30);

    // Setup enemies, making sure there are always three
    this.setupEnemies();

    //Setup bullets
    this.bullets = [];

    //score

    // Put a white div at the bottom so that enemies seem like they dissappear
    let whiteBox = document.createElement("div");
    whiteBox.style.zIndex = 100;
    whiteBox.style.position = "absolute";
    whiteBox.style.top = GAME_HEIGHT + "px";
    whiteBox.style.height = ENEMY_HEIGHT + "px";
    whiteBox.style.width = GAME_WIDTH + "px";
    whiteBox.style.background = "#fff";
    this.root.append(whiteBox);

    let bg = document.createElement("img");
    bg.src = "images/original.gif";
    bg.style.position = "absolute";
    bg.style.height = GAME_HEIGHT + "px";
    bg.style.width = GAME_WIDTH + "px";
    this.root.append(bg);

    // Since gameLoop will be called out of context, bind it once here.
    this.gameLoop = this.gameLoop.bind(this);
  }

  /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
  setupEnemies() {
    if (!this.enemies) {
      this.enemies = [];
    }

    while (
      this.enemies.filter(function() {
        return true;
      }).length < MAX_ENEMIES
    ) {
      this.addEnemy();
    }
  }

  // This method finds a random spot where there is no enemy, and puts one in there
  addEnemy() {
    let enemySpots = GAME_WIDTH / ENEMY_WIDTH;

    let enemySpot = undefined;
    // Keep looping until we find a free enemy spot at random
    while (enemySpot === undefined || this.enemies[enemySpot]) {
      enemySpot = Math.floor(Math.random() * enemySpots);
    }

    this.enemies[enemySpot] = new Enemy(this.root, enemySpot * ENEMY_WIDTH);
  }

  // This method kicks off the game
  start() {
    var audio = new Audio("sound/another man.mp3");
    audio.play();

    this.score = 0;
    this.lastFrame = Date.now();
    let keydownHandler = function(e) {
      if (e.keyCode === LEFT_ARROW_CODE) {
        this.player.move(MOVE_LEFT);
      } else if (e.keyCode === RIGHT_ARROW_CODE) {
        this.player.move(MOVE_RIGHT);
      } else if (e.keyCode === SPACEBAR_CODE) {
        let bullet = this.player.shoot();
        if (bullet) {
          this.bullets.push(bullet);
        }
      }
    };
    keydownHandler = keydownHandler.bind(this);
    // Listen for keyboard left/right and update the player
    document.addEventListener("keydown", keydownHandler);

    this.gameLoop();
  }

  gameLoop() {
    // Check how long it's been since last frame
    let currentFrame = Date.now();
    let timeDiff = currentFrame - this.lastFrame;

    // Increase the score!
    this.score;

    // Call update on all enemies
    this.enemies.forEach(function(enemy) {
      enemy.update(timeDiff);
    });

    // Call update on all bullets
    this.bullets.forEach(function(bullet) {
      bullet.update(timeDiff);
    });

    // Draw everything!
    //this.ctx.drawImage(images["stars.png"], 0, 0); // draw the star bg
    let renderElement = function(element) {
      element.render(this.ctx);
    };
    renderElement = renderElement.bind(this);
    this.enemies.forEach(renderElement); // draw the enemies
    this.bullets.forEach(renderElement); // draw the bullets
    this.player.render(this.ctx); // draw the player

    // Check if any enemies should die
    this.enemies.forEach((enemy, enemyIdx) => {
      if (enemy.y > GAME_HEIGHT) {
        this.enemies[enemyIdx].destroy();
        delete this.enemies[enemyIdx];
      }
      if (this.isCollidingWithBullet(enemy)) {
        this.enemies[enemyIdx].destroy();
        delete this.enemies[enemyIdx];
        this.score += 500;
      }
    });
    this.setupEnemies();

    // this.bullets.forEach((bullet, bulletIdx) => {
    //   if (bullet.y + BULLET_HEIGHT < 0) {
    //     bullet.destroy();
    //     delete this.bullets[bulletIdx];
    //   }
    // });

    // Check if player is dead
    if (this.isPlayerDead()) {
      // If they are dead, then it's game over!
      soundEffect();
      howCould();
      this.info.update(this.score + "  HOW COULD YOU DO THIS TO ME!?");

      renderRestartButton();
    } else {
      // If player is not dead, then draw the score
      this.info.update(this.score);

      // Set the time marker and redraw
      this.lastFrame = Date.now();
      setTimeout(this.gameLoop, 20);
    }
  }

  isCollidingWithBullet(enemy) {
    return this.bullets.some((bullet, i) => {
      if (
        bullet.x >= enemy.x &&
        bullet.x + BULLET_WIDTH <= enemy.x + ENEMY_WIDTH &&
        bullet.y + BULLET_HEIGHT <= enemy.y + ENEMY_HEIGHT
      ) {
        bullet.destroy();
        delete this.bullets[i];
        return true;
      }
    });
  }

  isPlayerDead() {
    // TODO: fix this function!
    return this.enemies.some(enemy => {
      return !(
        enemy.y + enemy.height / 2 < this.player.y ||
        enemy.y > this.player.y + this.player.height / 2 ||
        enemy.x + enemy.width / 2 < this.player.x ||
        enemy.x > this.player.x + this.player.width / 2
      );
    });
  }
}

function soundEffect() {
  var audio = new Audio("soundfx/explosion.mp3");
  audio.play();
}

function explosionSound() {
  var audio = new Audio("sound/laser.wav");
  audio.play();
}

function howCould() {
  var audio = new Audio("sound/howcouldyou.mp3");
  audio.play();
}

function renderRestartButton() {
  let btn = document.createElement("button");
  btn.innerText = "RESETT? :>";
  btn.onclick = function() {
    location.reload();
  };
  btn.id = "restartBtn";
  app.appendChild(btn);
}

// This section will start the game
let gameEngine = new Engine(app);
gameEngine.start();
