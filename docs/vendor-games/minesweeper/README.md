# 🎮 GameBox — Classic Browser Games

> A beginner-friendly, open-source collection of **20+ classic browser games** built entirely with **vanilla HTML5, CSS3, and JavaScript**. No frameworks. No build tools. Just pure code you can learn from.

**Play now:** [https://saiuttejr.github.io/GameBox/](https://saiuttejr.github.io/GameBox/) | **Code quality:** Run `npm install && npm run lint` to check JavaScript style

---

## ✨ Key Features

- 🎮 **19 playable games** (20+ including test games) ready to play immediately
- 📱 **Progressive Web App (PWA)** — install as an app on mobile devices for offline play
- 🚀 **Zero dependencies** — vanilla JavaScript only (no frameworks, no build step)
- 🎓 **Perfect for learning** — clean, readable source code with consistent patterns
- 🌐 **Offline-ready** — service worker enabled for full offline capability
- 📱 **Mobile-optimized** — responsive design works on all screen sizes
- 🎨 **Modern dark theme** — smooth, accessible UI with teal accents
- 🔍 **Searchable hub** — filter and search games by name or category

---

## 🎯 Play All the Games

| # | Game | Style | Category |
|---|------|-------|----------|
| 1 | [**Tic-Tac-Toe**](tic-tac-toe/) | `tic-tac-toe/` | 2 Player |
| 2 | [**Hangman**](hangman/) | `hangman/` | Solo |
| 3 | [**Rock, Paper, Scissors**](rock-paper-scissors/) | `rock-paper-scissors/` | vs Computer |
| 4 | [**Memory Match**](memory-match/) | `memory-match/` | Solo |
| 5 | [**Simon Game**](simon-game/) | `simon-game/` | Solo |
| 6 | [**BlackJack**](BlackJack/) | `BlackJack/` | Solo |
| 7 | [**Snake**](snake/) | `snake/` | Solo |
| 8 | [**Minesweeper**](minesweeper/) | `minesweeper/` | Solo |
| 9 | [**Whack-a-Mole**](whack-a-mole/) | `whack-a-mole/` | Solo |
| 10 | [**Typing Speed Test**](typing-test/) | `typing-test/` | Solo |
| 11 | [**Connect Four**](connect-four/) | `connect-four/` | 2 Player |
| 12 | [**2048**](2048/) | `2048/` | Solo |
| 13 | [**Wordle**](wordle/) | `wordle/` | Solo |
| 14 | [**Breakout**](breakout/) | `breakout/` | Solo |
| 15 | [**Sudoku**](sudoku/) | `sudoku/` | Solo |
| 16 | [**Chess Clock**](chess-clock/) | `chess-clock/` | 2 Player |
| 17 | [**Checkers**](checkers/) | `checkers/` | vs Computer |
| 18 | [**Tetris**](tetris/) | `tetris/` | Solo |
| 19 | [**Flappy Bird**](flappy-bird/) | `flappy-bird/` | Solo |

**Categories:** 12 Solo Games | 4 Two-Player Games | 2 vs Computer Games | 1 Utility Game

---

## 🚀 Quick Start

### Play Online
Just visit [https://saiuttejr.github.io/GameBox/](https://saiuttejr.github.io/GameBox/) — no installation needed! Search, filter by category, and start playing immediately.

### Run Locally

```bash
# Clone the repository
git clone https://github.com/Sai-Uttej-R/GameBox.git
cd GameBox

# Open in your browser (no build step required!)
# On Windows:
start index.html

# On macOS:
open index.html

# On Linux:
xdg-open index.html
```

### Optional: Code Quality Check
```bash
# Install dev dependencies and run ESLint
npm install
npm run lint
```

---

## 📁 Project Structure

Each game is **completely self-contained** in its own folder with the same consistent structure:

```
GameBox/
│
├── 📄 index.html              # Landing page (hub for all games)
├── 🎨 style.css               # Hub page styling
├── ⚙️  script.js               # Hub page logic (search & filtering)
├── 🔄 sw.js                   # Service Worker (offline support)
├── 📦 manifest.json           # PWA configuration
├── 📋 package.json            # Project metadata & dev tools
│
├── 2048/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── hangman/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── snake/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── simon-game/
│   ├── index.html
│   ├── game.js
│   ├── styles.css
│   └── sounds/               # Audio files (blue.mp3, green.mp3, etc.)
│
└── [17 more games following the same pattern...]
```

### Design System
- **Color Scheme:** Dark theme (#0f1117) with teal accents (#38b2ac)
- **Typography:** Inter font (Google Fonts)
- **Responsive:** Mobile-first design, optimized for 640px+ screens
- **Accessibility:** Semantic HTML, keyboard support where applicable

---

## 🛠️ Technologies Used

- **HTML5** — Semantic markup
- **CSS3** — Flexbox, CSS Grid, animations
- **Vanilla JavaScript (ES6+)** — No frameworks, no build tools
- **Service Workers** — Offline capability
- **PWA APIs** — Web app installation
- **Web Audio API** — Sound effects (select games)

**One external dependency:**
- jQuery (Simon Game only, via CDN) — can be replaced with vanilla JS

---

## 📚 Learn by Exploring

This project is designed for **learning game development**. Each game includes:
- ✅ Clean, readable code with meaningful variable names
- ✅ Consistent indentation (4 spaces)
- ✅ No unnecessary console.log statements
- ✅ Modern ES6 JavaScript (`const`/`let`, arrow functions)
- ✅ Responsive mobile-first CSS
- ✅ Comments explaining complex logic

**Perfect for:**
- Beginners learning JavaScript game development
- Understanding DOM manipulation and event handling
- Exploring game mechanics and algorithms
- Contributing your first open-source project

---

## 🤝 Contributing

We welcome contributions of all kinds! Add a new game, improve existing ones, or fix bugs — you're helping beginners learn.

### How to Contribute

1. **Fork** this repository
2. **Create a branch** for your feature:
   ```bash
   git checkout -b add-my-game
   ```
3. **Add your game** in a new folder following the existing pattern:
   ```
   my-game/
   ├── index.html
   ├── script.js
   └── style.css
   ```
4. **Add a link** to your game in the main [`index.html`](index.html)
5. **Open a Pull Request** with a clear description

### Contribution Guidelines
See [**CONTRIBUTING.md**](CONTRIBUTING.md) for detailed requirements:
- Follow the file structure pattern
- Use vanilla JavaScript only
- Mobile-friendly design required
- Use `const`/`let` (not `var`)
- No external CDN libraries (except when necessary)
- 4-space indentation
- Clean code (no console.log, meaningful names)

---

## 📜 License

This project is licensed under the **[MIT License](LICENSE.md)** — use it freely in your projects!

---

## 👨‍💻 Contributors

Thanks to everyone who has helped build GameBox!

| [![Sai Uttej R](https://avatars.githubusercontent.com/u/95533451?v=4&s=80)](https://github.com/Sai-Uttej-R) | [![Saketh Valakatla](https://avatars.githubusercontent.com/u/144155780?v=4&s=80)](https://github.com/sakethvalakatla) |
|:---:|:---:|
| [Sai Uttej R](https://github.com/Sai-Uttej-R) | [Saketh Valakatla](https://github.com/sakethvalakatla) |

---

## 🎯 Getting Help & Support

- 🐛 Found a bug? [Open an issue](https://github.com/Sai-Uttej-R/GameBox/issues)
- 💡 Have a suggestion? [Start a discussion](https://github.com/Sai-Uttej-R/GameBox/discussions)
- 📖 Want to learn more? Check out the individual game folders and read the source code!

---

**Happy coding and gaming!** 🎮✨

If you found this project helpful, please consider giving it a ⭐ on GitHub!