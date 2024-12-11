// Array and Math prototypes
Array.prototype.last = function () {
  return this[this.length - 1];
};

Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Game configuration and constants
const config = {
  canvasWidth: 375,
  canvasHeight: 375,
  platformHeight: 100,
  heroDistanceFromEdge: 10,
  paddingX: 100,
  perfectAreaSize: 10,
  backgroundSpeedMultiplier: 0.2,
  speeds: {
    stretching: 4,
    turning: 4,
    walking: 4,
    transitioning: 2,
    falling: 2,
  },
  hero: {
    width: 17,
    height: 30,
  },
};

class StickHeroGame {
  constructor() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.scoreElement = document.getElementById("score");
    this.introductionElement = document.getElementById("introduction");
    this.restartButton = document.getElementById("restart");
    this.micModeButton = document.getElementById("micMode");
    this.mouseModeButton = document.getElementById("mouseMode");

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Game state variables
    this.phase = "waiting";
    this.lastTimestamp = undefined;
    this.heroX = 0;
    this.heroY = 0;
    this.sceneOffset = 0;
    this.score = 0;
    this.platforms = [];
    this.sticks = [];
    this.trees = [];

    this.initializeControls();
    this.resetGame();
    this.setupEventListeners();

    // Start the animation loop
    window.requestAnimationFrame(this.animate.bind(this));
  }

  initializeControls() {
    this.controlMode = "mic"; // Default to microphone mode
    this.microphoneStream = null;
    this.audioContext = null;
    this.analyser = null;
  }

  setupEventListeners() {
    this.micModeButton.addEventListener("click", () =>
      this.switchControlMode("mic")
    );
    this.mouseModeButton.addEventListener("click", () =>
      this.switchControlMode("mouse")
    );
    this.restartButton.addEventListener("click", () => this.resetGame());
    window.addEventListener("resize", () => this.handleResize());

    // Mouse mode event listeners
    window.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    window.addEventListener("mouseup", (e) => this.handleMouseUp(e));
  }

  switchControlMode(mode) {
    this.controlMode = mode;

    // Update button styles
    if (mode === "mic") {
      this.micModeButton.classList.add("active");
      this.mouseModeButton.classList.remove("active");
      this.setupMicrophoneMode();
    } else {
      this.micModeButton.classList.remove("active");
      this.mouseModeButton.classList.add("active");
      this.teardownMicrophoneMode();
    }
  }

  async setupMicrophoneMode() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 2048;

      this.microphoneStream = stream;
      this.startMicrophoneListening();
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Could not access microphone. Switching to mouse mode.");
      this.switchControlMode("mouse");
    }
  }

  teardownMicrophoneMode() {
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((track) => track.stop());
      this.microphoneStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  startMicrophoneListening() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkAudioLevel = () => {
      this.analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i] - 128;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const decibels = 20 * Math.log10(rms);

      if (decibels > -50 && this.phase === "waiting") {
        this.startGame();
      }

      if (this.controlMode === "mic") {
        requestAnimationFrame(checkAudioLevel);
      }
    };

    checkAudioLevel();
  }

  handleMouseDown(e) {
    if (this.controlMode === "mouse" && this.phase === "waiting") {
      this.startGame();
    }
  }

  handleMouseUp(e) {
    if (this.controlMode === "mouse" && this.phase === "stretching") {
      this.phase = "turning";
    }
  }

  handleResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.draw();
  }

  startGame() {
    this.lastTimestamp = undefined;
    this.introductionElement.style.opacity = 0;
    this.phase = "stretching";
    window.requestAnimationFrame(this.animate.bind(this));
  }

  resetGame() {
    this.phase = "waiting";
    this.lastTimestamp = undefined;
    this.sceneOffset = 0;
    this.score = 0;

    this.introductionElement.style.opacity = 1;
    this.restartButton.style.display = "none";
    this.scoreElement.innerText = this.score;

    this.platforms = [{ x: 50, w: 50 }];
    this.generatePlatform();

    this.sticks = [
      { x: this.platforms[0].x + this.platforms[0].w, length: 0, rotation: 0 },
    ];

    this.trees = [];

    this.heroX =
      this.platforms[0].x + this.platforms[0].w - config.heroDistanceFromEdge;
    this.heroY = 0;

    this.draw();
  }

  generatePlatform() {
    const minimumGap = 40;
    const maximumGap = 200;
    const minimumWidth = 20;
    const maximumWidth = 100;

    const lastPlatform = this.platforms[this.platforms.length - 1];
    let furthestX = lastPlatform.x + lastPlatform.w;

    const x =
      furthestX +
      minimumGap +
      Math.floor(Math.random() * (maximumGap - minimumGap));
    const w =
      minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

    this.platforms.push({ x, w });
  }

  thePlatformTheStickHits() {
    if (this.sticks.last().rotation != 90)
      throw Error(`Stick is ${this.sticks.last().rotation}°`);
    const stickFarX = this.sticks.last().x + this.sticks.last().length;

    const platformTheStickHits = this.platforms.find(
      (platform) =>
        platform.x < stickFarX && stickFarX < platform.x + platform.w
    );

    if (
      platformTheStickHits &&
      platformTheStickHits.x +
        platformTheStickHits.w / 2 -
        config.perfectAreaSize / 2 <
        stickFarX &&
      stickFarX <
        platformTheStickHits.x +
          platformTheStickHits.w / 2 +
          config.perfectAreaSize / 2
    )
      return [platformTheStickHits, true];

    return [platformTheStickHits, false];
  }

  animate(timestamp) {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      window.requestAnimationFrame(this.animate.bind(this));
      return;
    }

    switch (this.phase) {
      case "waiting":
        return;
      case "stretching": {
        this.sticks.last().length +=
          (timestamp - this.lastTimestamp) / config.speeds.stretching;
        break;
      }
      case "turning": {
        this.sticks.last().rotation +=
          (timestamp - this.lastTimestamp) / config.speeds.turning;

        if (this.sticks.last().rotation > 90) {
          this.sticks.last().rotation = 90;

          const [nextPlatform] = this.thePlatformTheStickHits();
          if (nextPlatform) {
            this.score += 1;
            this.scoreElement.innerText = this.score;
            this.generatePlatform();
          }

          this.phase = "walking";
        }
        break;
      }
      case "walking": {
        this.heroX += (timestamp - this.lastTimestamp) / config.speeds.walking;

        const [nextPlatform] = this.thePlatformTheStickHits();
        if (nextPlatform) {
          const maxHeroX =
            nextPlatform.x + nextPlatform.w - config.heroDistanceFromEdge;
          if (this.heroX > maxHeroX) {
            this.heroX = maxHeroX;
            this.phase = "transitioning";
          }
        } else {
          const maxHeroX =
            this.sticks.last().x +
            this.sticks.last().length +
            config.hero.width;
          if (this.heroX > maxHeroX) {
            this.heroX = maxHeroX;
            this.phase = "falling";
          }
        }
        break;
      }
      case "transitioning": {
        this.sceneOffset +=
          (timestamp - this.lastTimestamp) / config.speeds.transitioning;

        const [nextPlatform] = this.thePlatformTheStickHits();
        if (
          this.sceneOffset >
          nextPlatform.x + nextPlatform.w - config.paddingX
        ) {
          this.sticks.push({
            x: nextPlatform.x + nextPlatform.w,
            length: 0,
            rotation: 0,
          });
          this.phase = "waiting";
        }
        break;
      }
      case "falling": {
        if (this.sticks.last().rotation < 180)
          this.sticks.last().rotation +=
            (timestamp - this.lastTimestamp) / config.speeds.turning;

        this.heroY += (timestamp - this.lastTimestamp) / config.speeds.falling;
        const maxHeroY =
          config.platformHeight +
          100 +
          (window.innerHeight - config.canvasHeight) / 2;
        if (this.heroY > maxHeroY) {
          this.restartButton.style.display = "block";
          this.restartButton.innerText = `Restart (Score: ${this.score})`;
          return;
        }
        break;
      }

      default:
        throw Error("Wrong phase");
    }

    this.draw();
    window.requestAnimationFrame(this.animate.bind(this));

    this.lastTimestamp = timestamp;
  }

  draw() {
    this.ctx.save();
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    this.drawBackground();

    this.ctx.translate(
      (window.innerWidth - config.canvasWidth) / 2 - this.sceneOffset,
      (window.innerHeight - config.canvasHeight) / 2
    );

    this.drawPlatforms();
    this.drawHero();
    this.drawSticks();

    this.ctx.restore();
  }

  drawPlatforms() {
    this.platforms.forEach(({ x, w }) => {
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(
        x,
        config.canvasHeight - config.platformHeight,
        w,
        config.platformHeight + (window.innerHeight - config.canvasHeight) / 2
      );
    });
  }

  drawHero() {
    this.ctx.save();
    this.ctx.fillStyle = "black";
    this.ctx.translate(
      this.heroX - config.hero.width / 2,
      this.heroY +
        config.canvasHeight -
        config.platformHeight -
        config.hero.height / 2
    );

    this.drawRoundedRect(
      -config.hero.width / 2,
      -config.hero.height / 2,
      config.hero.width,
      config.hero.height - 4,
      5
    );

    const legDistance = 5;
    this.ctx.beginPath();
    this.ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.fillStyle = "white";
    this.ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
    this.ctx.fill();

    this.ctx.fillStyle = "red";
    this.ctx.fillRect(
      -config.hero.width / 2 - 1,
      -12,
      config.hero.width + 2,
      4.5
    );
    this.ctx.beginPath();
    this.ctx.moveTo(-9, -14.5);
    this.ctx.lineTo(-17, -18.5);
    this.ctx.lineTo(-14, -8.5);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.moveTo(-10, -10.5);
    this.ctx.lineTo(-15, -3.5);
    this.ctx.lineTo(-5, -7);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + radius);
    this.ctx.lineTo(x, y + height - radius);
    this.ctx.arcTo(x, y + height, x + radius, y + height, radius);
    this.ctx.lineTo(x + width - radius, y + height);
    this.ctx.arcTo(
      x + width,
      y + height,
      x + width,
      y + height - radius,
      radius
    );
    this.ctx.lineTo(x + width, y + radius);
    this.ctx.arcTo(x + width, y, x + width - radius, y, radius);
    this.ctx.lineTo(x + radius, y);
    this.ctx.arcTo(x, y, x, y + radius, radius);
    this.ctx.fill();
  }

  drawSticks() {
    this.sticks.forEach((stick) => {
      this.ctx.save();

      this.ctx.translate(stick.x, config.canvasHeight - config.platformHeight); // Continuing from the previous drawSticks method
      this.ctx.rotate((Math.PI / 180) * stick.rotation);

      this.ctx.beginPath();
      this.ctx.lineWidth = 2;
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(0, -stick.length);
      this.ctx.stroke();

      this.ctx.restore();
    });
  }

  drawBackground() {
    // Create a gradient background
    var gradient = this.ctx.createLinearGradient(0, 0, 0, window.innerHeight);
    gradient.addColorStop(0, "#BBD691");
    gradient.addColorStop(1, "#FEF1E1");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // Draw trees (if any)
    this.trees.forEach((tree) => this.drawTree(tree.x, tree.color));
  }

  drawTree(x, color) {
    // Placeholder method for drawing trees
    // You can implement a detailed tree drawing logic here if needed
    this.ctx.fillStyle = color || "#228B22";
    this.ctx.beginPath();
    this.ctx.moveTo(x, window.innerHeight);
    this.ctx.lineTo(x - 20, window.innerHeight - 50);
    this.ctx.lineTo(x + 20, window.innerHeight - 50);
    this.ctx.closePath();
    this.ctx.fill();
  }

  // Optional method to draw hills in the background
  drawHill(baseHeight, amplitude, stretch, color) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, window.innerHeight);
    this.ctx.lineTo(0, this.getHillY(0, baseHeight, amplitude, stretch));

    for (let i = 0; i < window.innerWidth; i++) {
      this.ctx.lineTo(i, this.getHillY(i, baseHeight, amplitude, stretch));
    }

    this.ctx.lineTo(window.innerWidth, window.innerHeight);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  // Helper method for hill calculation
  getHillY(x, baseHeight, amplitude, stretch) {
    const scaledX = x / stretch;
    return baseHeight + Math.sinus(scaledX) * amplitude;
  }
}

// Utility extension methods
if (!Array.prototype.last) {
  Array.prototype.last = function () {
    return this[this.length - 1];
  };
}

// Custom math method
if (!Math.sinus) {
  Math.sinus = function (degree) {
    return Math.sin((degree / 180) * Math.PI);
  };
}

// Initialize the game when the window loads
window.onload = function () {
  const game = new StickHeroGame();
};
