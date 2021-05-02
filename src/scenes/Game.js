import Phaser from "../lib/phaser.js";
import Carrot from "../game/Carrot.js";

export default class Game extends Phaser.Scene {
  constructor() {
    super("game");
  }
  preload() {
    this.load.image("background", "src/assets/bg_layer1.png");
    this.load.image("platform-b", "src/assets/ground_grass.png");
    this.load.image("platform-s", "src/assets/ground_grass_small.png");
    this.load.image("bunny-stand", "src/assets/bunny1_stand.png");
    this.load.image("carrot", "src/assets/carrot.png");
  }

  // added here so we can later use him on update() and create()
  /** @type {Phaser.Physics.Arcade.Sprite} */
  player;

  /** @type {Phaser.Physics.Arcade.StaticGroup} */
  platforms;

  /** @type {Phaser.Physics.Arcade.Groud} */
  carrots;

  /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
  cursors;

  carrotsCollected = 0;

  /** @type {Phaser.GameObjects.Text} */
  carrotsCollectedText;

  /*** @param {Phaser.GameObjects.Sprite} sprite */
  horizontalWrap(sprite) {
    const halfWidth = sprite.displayWidth * 0.5;
    const gameWidth = this.scale.width;
    if (sprite.x < -halfWidth) {
      sprite.x = gameWidth + halfWidth;
    } else if (sprite.x > gameWidth + halfWidth) {
      sprite.x = -halfWidth;
    }
  }

  /**
   * * @param {Phaser.GameObjects.Sprite} sprite
   * this function positions a carrot above a sprite using its height
   * */
  addCarrotAbove(sprite) {
    const y = sprite.y - sprite.displayHeight;

    /** @type {Phaser.Physics.Arcade.Sprite} */
    const carrot = this.carrots.get(sprite.x, y, "carrot");

    carrot.setActive(true);
    carrot.setVisible(true);
    this.add.existing(carrot);

    // update the physics body size, so it doesn't fall off the platform
    carrot.body.setSize(carrot.width, carrot.height);
    this.physics.world.enable(carrot);
    return carrot;
  }

  /**
   * @param {Phaser.Physics.Arcade.Sprite} player
   * @param {Carrot} carrot
   */
  handleCollectCarrot(player, carrot) {
    this.carrots.killAndHide(carrot);

    this.physics.world.disableBody(carrot.body);

    this.carrotsCollected++;

    const value = `Carrots: ${this.carrotsCollected}`;
    this.carrotsCollectedText.text = value;
  }

  findBottomPlatform() {
    const platforms = this.platforms.getChildren();
    let bottomPlatform = platforms[0];

    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      if (platform.y < bottomPlatform.y) {
        continue;
      }
      bottomPlatform = platform;
    }
    return bottomPlatform;
  }

  create() {
    // BACKGROUND, STYLES

    this.add.image(240, 320, "background").setScrollFactor(1, 0);

    /**
    resize, make it smaller
    staticGroup adds a bunch of platforms, makes it stay where they are
    the for loop creates 5 platforms at a given random x position that's between 80 and 400, with y pixels distance between each
    */

    this.platforms = this.physics.add.staticGroup();

    for (let i = 0; i < 5; ++i) {
      const rand = Phaser.Math.Between(0, 1);
      const x = Phaser.Math.Between(80, 400);
      const y = 150 * i;

      /** @type {Phaser.Physics.Arcade.Sprite} */
      const platform =
        rand === 0
          ? this.platforms.create(x, y, "platform-b")
          : this.platforms.create(x, y, "platform-s");
      platform.scale = 0.5;

      /** @type {Phaser.Physics.Arcade.StaticBody} */
      const body = platform.body;
      body.updateFromGameObject();
    }

    const style = {
      color: "#000",
      fontSize: 24,
    };

    this.carrotsCollectedText = this.add
      .text(240, 10, "Carrots: 0", style)
      .setScrollFactor(0)
      .setOrigin(0.5, 0);

    // PLAYER

    this.player = this.physics.add
      .sprite(240, 320, "bunny-stand")
      .setScale(0.5);

    // CARROT
    this.carrots = this.physics.add.group({
      classType: Carrot,
    });

    // COLLISIONS

    this.physics.add.collider(this.platforms, this.player);
    this.physics.add.collider(this.platforms, this.carrots);
    this.physics.add.overlap(
      this.player,
      this.carrots,
      this.handleCollectCarrot,
      undefined,
      this
    );

    this.player.body.checkCollision.up = false;
    this.player.body.checkCollision.left = false;
    this.player.body.checkCollision.right = false;

    // MOVING

    this.cameras.main.startFollow(this.player);
    this.cameras.main.setDeadzone(this.scale.width * 1.5);
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  // these functions are constantly getting called
  update() {
    const touchingDown = this.player.body.touching.down;

    touchingDown ? this.player.setVelocityY(-300) : null;

    // left and right movement when jumping
    if (this.cursors.left.isDown && !touchingDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown && !touchingDown) {
      this.player.setVelocityX(200);
    } else {
      // no movement if no key down
      this.player.setAccelerationX(0);
    }

    this.platforms.children.iterate((child) => {
      /** @type {Phaser.Physics.Arcade.Sprite} */
      const platform = child;

      const scrollY = this.cameras.main.scrollY;

      if (platform.y >= scrollY + 700) {
        platform.y = scrollY - Phaser.Math.Between(50, 100);
        platform.body.updateFromGameObject();

        this.addCarrotAbove(platform);
      }
    });

    this.horizontalWrap(this.player);

    const bottomPlatform = this.findBottomPlatform();
    bottomPlatform.y + 200 c< this.player.y
      ? this.scene.start("game-over")
      : null;
  }
}
