class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
        this.count = 0;
        this.myScore = 0; 
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
    }
    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.waterLayer = this.map.createLayer("Water", this.tileset, 0, 0);
        this.objLayer = this.map.createLayer("Objects", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.waterLayer.setCollisionByProperty({
            collides: false
        });

        // TODO: Add createFromObjects here
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        // Plays animated coins
        this.anims.play('spin',this.coins);

        this.point = this.map.createFromObjects("Objects", {
            name: "point",
        });

        this.powerup = this.map.createFromObjects("Objects", {
            name: "powerup",
            key: "tilemap_sheet",
            frame: 67
        });

        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.powerup, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        // set up player avatar
        // Player is spawned at the given point object in Tiled
        my.sprite.player = this.physics.add.sprite(this.point[0].x, this.point[0].y, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        my.text.score = this.add.bitmapText(my.sprite.player.x, my.sprite.player.y-235, "minecraftia", "Score " + this.myScore);

        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            this.myScore+=1;
            obj2.destroy(); // remove coin on overlap
            my.text.score.setText("Score " + this.myScore);
        });


        //Power up function
        //Jump Velocity is increased temporarily
        this.physics.add.overlap(my.sprite.player, this.powerup, (obj1, obj2) => {
            obj2.destroy();
            this.JUMP_VELOCITY = -1000;
            this.count = 0;
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            random: true,
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            maxAliveParticles: 8,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
            gravityY: -400,
        });

        my.vfx.water = this.add.particles(0, 0, "kenny-particles", {
            frame: ['muzzle_04.png', 'muzzle_05.png'],
            scale: {start: 0.03, end: 0.1},
            lifespan: 350,
            maxAliveParticles: 8,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();
        my.vfx.water.stop();

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);



    }

    update() {
        this.count++;
        //Temporary timer for the powerup
        if (this.count % 500 == 0) {
            this.JUMP_VELOCITY = -600;
        }

        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }
        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }
        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
        if(this.physics.collide(my.sprite.player, this.waterLayer)){
            my.vfx.water.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.water.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.water.start();
            my.vfx.water.stop(); 
            this.scene.restart;
        }
    }
}
