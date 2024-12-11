# Stick Hero Game

This is a simple Stick Hero game implemented in JavaScript. The game allows the player to control a hero using either the mouse or the microphone. The objective is to stretch the stick to the right length to reach the next platform without falling.

## Features

- **Control Modes**: Switch between mouse and microphone control modes.
- **Dynamic Platforms**: Platforms are generated dynamically with varying gaps and widths.
- **Score Tracking**: Keep track of your score as you progress through the game.
- **Responsive Design**: The game canvas resizes based on the window size.

## How to Play

1. **Mouse Mode**:

   - Click and hold the mouse button to stretch the stick.
   - Release the mouse button to drop the stick and walk across it.

2. **Microphone Mode**:
   - Make a sound to start stretching the stick.
   - Stop making a sound to drop the stick and walk across it.

## Setup and Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/LTPPPP/Stick-voice
   ```

2. Navigate to the project directory:

   ```bash
   cd stick-hero-game
   ```

3. Open the `index.html` file in your browser to start the game.

## Customization

You can customize the game by modifying the `config` object and the game logic in the `StickHeroGame` class. Here are some examples:

- **Change Platform Colors**: Modify the `platformColor` property in the `config` object.
- **Adjust Hero Speed**: Change the `heroSpeed` property in the `StickHeroGame` class.
- **Alter Stick Growth Rate**: Update the `stickGrowthRate` property in the `config` object.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Acknowledgements

- Inspired by the original Stick Hero game.
- Uses the HTML5 Canvas API for rendering.
- Sound detection implemented using the Web Audio API.

Enjoy the game!
