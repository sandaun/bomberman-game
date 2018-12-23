# Bomberman

## Description
The game consists in destroy obstacles by to find the key that will get us to the next level and, at the same time, avoid getting killed by the enemies.

The game screen will be a board with fixed (non-destroyable) obstacles and random obstacles (destroyable). The player will move through the board by click events. Enemies will also appear and move randomly.

The game finishes when the player gets the key.


## MVP
### Technique
Html5 __Canvas__ and Vanilla __Javascript__

### Game
* Create states (start screen, game screen and game over screen states)
* Create the board
* Create a player in the board
* Create key obstacle
* Move player
* If player collisions with key -> Game Over

## Backlog
### Player can throw bombs
* Player will be able to throw bombs
* Bombs will only destroy random obstacles at their immediate side
### Add bonus items
* Flames: each one will increase bomb power
* Bombs: Player will be able to throw more bombs
### Add random obstacles
* Random obstacles will hide items and the key
### Add enemies
* Create fix enemies
* Enemies move randomly
* Bombs thrown by player will kill enemies
### Info panel
* Will be showing number of bombs that player can throw
* Each enemy killed will give points to player and will be shown to the info panel
* Each screen won will add points to the panel
### Star Wars edition
* Add imagery to game, player and enemies from Star Wars
### Add new characters in Start Screen
### Levels
* Each level will increase number of enemies and their speed

## Data structure
* Class Game
* Class Player
* Class Enemy
* Class Obstacles
* Class Bomb
* Class Flame

## States y States Transitions
* __Start Screen__

  * Title
  * Play button

* __Game Screen__

  * Canvas

* __Game Over Screen__

  * Play again button
  * Go to start screen button


## Links


### Trello
[https://trello.com/b/WxcJSFZn/ironhack-bomberman-game]


### Git
URls for the project repo and deploy
[https://github.com/sandaun/bomberman-game]
[https://sandaun.github.io/bomberman-game/]


### Slides
URls for the project presentation (slides)
[https://slides.com/oriolcarbo/oriol-carbo#/]