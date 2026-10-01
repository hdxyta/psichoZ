import { config } from "./config.js";

class Food {
  constructor() {
    this.location = null;
  }

  generateFood(snake) {
    let attempts = 0;
    const maxAttempts = config.grid_size * config.grid_size;

    do {
      this.location = {
        x: Math.floor(Math.random() * config.grid_size) + 1,
        y: Math.floor(Math.random() * config.grid_size) + 1,
      };
      attempts++;
    } while (snake.checkCollision(this.location) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      console.log("You win! Grid is full!");
    }
  }
}

export default Food;
