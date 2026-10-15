// ===== 1. SETUP =====
var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
var scoreText = document.getElementById("score");
var bestText = document.getElementById("best");
var livesText = document.getElementById("lives");
var startBtn = document.getElementById("startBtn");

// Emojis we will use
var goodFoods = ["🍕", "🍔", "🍟", "🍩"];
var badItems = ["💣", "🧨"];

// The basket (the player)
var basket = {
  x: 170,       // left side of the basket
  y: 450,       // top of the basket
  width: 60,
  height: 40
};

// Game variables
var items = [];          // all the falling things
var score = 0;
var lives = 3;
var combo = 0;           // how many good foods caught in a row
var spawnTimer = 0;      // counts up until it's time to drop a new item
var gameRunning = false;
var screenMessage = "Catch the food! Avoid the bombs!";

// Keys
var leftPressed = false;
var rightPressed = false;

// Best score is saved in the browser
var best = Number(localStorage.getItem("foodRushBest"));
if (!best) {
  best = 0;
}
bestText.textContent = best;


// ===== 2. START THE GAME =====
function startGame() {
  score = 0;
  lives = 3;
  combo = 0;
  items = [];
  spawnTimer = 0;
  basket.x = 170;
  gameRunning = true;
  startBtn.textContent = "Restart";
  updateInfo();
}

// Update the score and hearts above the game
function updateInfo() {
  scoreText.textContent = score;

  var hearts = "";
  for (var i = 0; i < lives; i++) {
    hearts = hearts + "❤️";
  }
  livesText.textContent = hearts;
}


// ===== 3. DIFFICULTY =====
// Level goes up every 100 points
function getLevel() {
  return Math.floor(score / 100) + 1;
}

// Items fall faster at higher levels (max speed is 8)
function getFallSpeed() {
  var speed = 2 + getLevel() * 0.5;
  if (speed > 8) {
    speed = 8;
  }
  return speed;
}

// Items appear more often at higher levels (min wait is 15)
function getSpawnDelay() {
  var delay = 50 - getLevel() * 4;
  if (delay < 15) {
    delay = 15;
  }
  return delay;
}


// ===== 4. CREATE FALLING ITEMS =====
function spawnItem() {
  var item = {
    x: 20 + Math.random() * 360,   // random spot across the screen
    y: 0,
    emoji: "",
    type: ""
  };

  var chance = Math.random();   // number from 0 to 1

  if (chance < 0.05) {
    // 5% chance: golden star
    item.type = "star";
    item.emoji = "⭐";
  } else if (chance < 0.30) {
    // 25% chance: bad item
    item.type = "bad";
    item.emoji = badItems[Math.floor(Math.random() * badItems.length)];
  } else {
    // 70% chance: good food
    item.type = "good";
    item.emoji = goodFoods[Math.floor(Math.random() * goodFoods.length)];
  }

  items.push(item);
}


// ===== 5. MOVE THINGS =====
function moveBasket() {
  if (leftPressed) {
    basket.x = basket.x - 7;
  }
  if (rightPressed) {
    basket.x = basket.x + 7;
  }
  keepBasketInside();
}

// Don't let the basket leave the screen
function keepBasketInside() {
  if (basket.x < 0) {
    basket.x = 0;
  }
  if (basket.x + basket.width > canvas.width) {
    basket.x = canvas.width - basket.width;
  }
}

function moveItems() {
  // Go through the list from the end to the start,
  // so removing an item does not mess up the loop
  for (var i = items.length - 1; i >= 0; i--) {
    var item = items[i];
    item.y = item.y + getFallSpeed();

    // Did the basket catch it?
    var touchingBasket =
      item.y >= basket.y &&
      item.y <= basket.y + basket.height &&
      item.x >= basket.x &&
      item.x <= basket.x + basket.width;

    if (touchingBasket) {
      catchItem(item);
      items.splice(i, 1);   // remove from the list
    } else if (item.y > canvas.height) {
      // The item fell past the bottom
      if (item.type === "good") {
        combo = 0;          // missed food breaks your combo
      }
      items.splice(i, 1);
    }
  }
}


// ===== 6. WHAT HAPPENS WHEN YOU CATCH SOMETHING =====
function catchItem(item) {
  if (item.type === "good") {
    combo = combo + 1;
    // Every 5 foods in a row adds +1 to the multiplier
    var multiplier = 1 + Math.floor(combo / 5);
    score = score + 10 * multiplier;
  } else if (item.type === "star") {
    score = score + 50;
  } else if (item.type === "bad") {
    lives = lives - 1;
    combo = 0;
    if (lives <= 0) {
      gameOver();
    }
  }
  updateInfo();
}

function gameOver() {
  gameRunning = false;
  screenMessage = "Game Over! Score: " + score;

  if (score > best) {
    best = score;
    localStorage.setItem("foodRushBest", best);
    bestText.textContent = best;
    screenMessage = "New best: " + score + "!";
  }
  startBtn.textContent = "Play Again";
}


// ===== 7. DRAWING =====
function draw() {
  // Clear the screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Draw the basket
  ctx.font = "50px Arial";
  ctx.fillText("🧺", basket.x + basket.width / 2, basket.y + basket.height / 2);

  // Draw every falling item
  ctx.font = "32px Arial";
  for (var i = 0; i < items.length; i++) {
    ctx.fillText(items[i].emoji, items[i].x, items[i].y);
  }

  // Draw level and combo at the top
  if (gameRunning) {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#3b2a1a";
    ctx.textAlign = "left";
    ctx.fillText("Level " + getLevel(), 10, 20);

    if (combo >= 2) {
      var multiplier = 1 + Math.floor(combo / 5);
      ctx.textAlign = "right";
      ctx.fillText("Combo " + combo + "  (x" + multiplier + ")", 390, 20);
    }
  }

  // Show a message when the game is not running
  if (!gameRunning) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 180, canvas.width, 100);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "22px Arial";
    ctx.fillText(screenMessage, canvas.width / 2, 215);
    ctx.font = "16px Arial";
    ctx.fillText("Press the button to play", canvas.width / 2, 250);
  }
}


// ===== 8. THE GAME LOOP (runs about 50 times per second) =====
function gameLoop() {
  if (gameRunning) {
    moveBasket();

    spawnTimer = spawnTimer + 1;
    if (spawnTimer >= getSpawnDelay()) {
      spawnItem();
      spawnTimer = 0;
    }

    moveItems();
  }
  draw();
}

setInterval(gameLoop, 20);


// ===== 9. CONTROLS =====
// Keyboard: press down
document.addEventListener("keydown", function (event) {
  var key = event.key.toLowerCase();
  if (key === "arrowleft" || key === "a") {
    leftPressed = true;
    event.preventDefault();
  }
  if (key === "arrowright" || key === "d") {
    rightPressed = true;
    event.preventDefault();
  }
});

// Keyboard: let go
document.addEventListener("keyup", function (event) {
  var key = event.key.toLowerCase();
  if (key === "arrowleft" || key === "a") {
    leftPressed = false;
  }
  if (key === "arrowright" || key === "d") {
    rightPressed = false;
  }
});

// Turn a finger or mouse position into a basket position
function moveBasketTo(clientX) {
  var box = canvas.getBoundingClientRect();
  var scale = canvas.width / box.width;
  var x = (clientX - box.left) * scale;
  basket.x = x - basket.width / 2;
  keepBasketInside();
}

// Phone: drag your finger
canvas.addEventListener("touchmove", function (event) {
  moveBasketTo(event.touches[0].clientX);
  event.preventDefault();
});
canvas.addEventListener("touchstart", function (event) {
  moveBasketTo(event.touches[0].clientX);
});

// Laptop: you can also move the mouse over the game
canvas.addEventListener("mousemove", function (event) {
  moveBasketTo(event.clientX);
});

// Play / Restart button
startBtn.addEventListener("click", startGame);
