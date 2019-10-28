let t = 0;
let targetFramerate = 60;
let canvas;

let started = false;
let debug = false;
let showFPS = false;

let smoke = false;

let playButton;

let skeleton, skeleton2, skeleton3, skeleton4;

let song, song_start; 
let analyser, spectrum, rms, fft;

function preload() {
	// Load images
	playButton = loadImage('https://i.imgur.com/c7oRbKU.png');

	// Load audio
	//song = loadSound('https://willangus.github.io/musicshare/sound/Peepee%20Session%20Demo%202018-11-02.wav');
	//song = loadSound('https://willangus.github.io/deepseavisual/assets/sound/SMONK 7.mp3');
	song = loadSound('https://willangus.github.io/deepseavisual/assets/sound/PATIENCE.mp3');
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
	
	// Initialise Skeletons : new Skeleton(origin x, origin y, size, range, frequency focus, follow threshold, show eyes)
	skeleton  = new Skeleton(width / 2, height / 2, 100, 0, 4000, 100, true);
	skeleton2 = new Skeleton(width / 2, height / 2, 100, 0, 5000, 100, true);
	skeleton3 = new Skeleton(width / 2, height / 2, 100, 0, 6000, 100, true);
	skeleton4 = new Skeleton(width / 2, height / 2, 100, 0, 6200, 100, true);
	
	// Song starting point (seconds) and playback speed
	song_start = 0;
	song.rate(1);

	// Initialise spectrum and amplitude analyser
	fft = new p5.FFT();
  analyser = new p5.Amplitude();

  // Input the audio track into the amplitude analyser
  analyser.setInput(song);

	randomSeed(99);
	
	// Set target frames per second
  frameRate(targetFramerate);
}

function draw() {
	background(10 + (fft.getEnergy(150)/10), 0, 10 + fft.getEnergy(50)/10);

	if (!started) {
		background(2, 0, 6);
		image(playButton, (width/2) - 100, (height/2) - 100);
	}

	if (started) {
  	run();
	}
}

function run() {
	// Analyse amplitude and frequency spectrum 
	rms = analyser.getLevel();
	spectrum = fft.analyze();
	
	// Run Skeletons : addBone(bone colour, bone health, damage-per-tick, show joints)
	skeleton.run();
	skeleton.addBone(color(fft.getEnergy(5000)*2, fft.getEnergy(500), fft.getEnergy(100)/2), skeleton.energy, 3, true);
	skeleton.target.set((width * sin(t)) + width/2, (height * cos(t) + height/2));
	
	skeleton2.run();
	skeleton2.addBone(color(fft.getEnergy(500)/2, fft.getEnergy(100), fft.getEnergy(5000)*2), skeleton2.energy, 3, true);
	skeleton2.target.set((width * sin(t)) + width/2, (height * cos(t) + height/2));
	
	skeleton3.run();
	skeleton3.addBone(color(fft.getEnergy(500)/2, fft.getEnergy(5000)*1.5, fft.getEnergy(100)/1.5), skeleton3.energy, 3, true);
	skeleton3.target.set((width * cos(t)) + width/2, (height * sin(t) + height/2));
	
	skeleton4.run();
	colorMode(HSB);
	// skeleton4.addBone(color(fft.getEnergy(700), fft.getEnergy(10000)*2, fft.getEnergy(100)/1.5), skeleton4.energy, 3, true);
	skeleton4.addBone(color(fft.getEnergy(700)*2, fft.getEnergy(10000)/2, fft.getEnergy(100)/2), skeleton4.energy, 3, true);
	skeleton4.target.set((width * cos(t)) + width/2, (height * sin(t) + height/2));
	colorMode(RGB);
	
	if (debug) {
		fill(255);
		//text('rms : ' + rms, 10, 10);
	}

	if (showFPS) {
		fill(0, 255, 0);
		textAlign(RIGHT);
		text('fps : ' + nf(frameRate(), 0, 2), width, 10);
	}
	
	// Time counter
	t = t + (0.01);
}

// Bone class : new Bone(new x pos, new y pos, previous x pos, previous y pos, colour, health, damage-per-tick, toggle joints)
class Bone {
	constructor(x, y, px, py, colour, health, dpt, showJoint) {
		this.x = x;
		this.y = y;
		this.px = px;
		this.py = py;
		this.colour = colour || 'rgb(255, 255, 255)';
		this.health = health;
		if (this.health < 50) this.health = 50;
		this.dpt = dpt;
		this.showJoint = showJoint || false;
		this.alive = true;
	}
	run() {
		this.update();
		this.display();
	}
	display() {
		if (!smoke) {
			stroke(this.colour);
			strokeWeight(this.health/10);
			line(this.x, this.y, this.px, this.py);
		}
		if (this.showJoint) {
			noStroke();
			fill(this.colour);
			circle(this.x, this.y, this.health/5);
			circle(this.px, this.py, this.health/5);
		}
		if (debug) text(this.health, this.x, this.y)
	}
	update() {
		this.health -= this.dpt;
	}
	isDead() {
		return this.health < 0;
	}
}

// Skeleton class : new Skeleton(origin x, origin y, size, range, frequency focus)
//									(objName).addBone(bone colour, bone health, show joints)
class Skeleton {
	constructor(x, y, size, range, focus, threshold, showEyes) {
		this.location = createVector(x, y);
		this.target = createVector(x, y);
		this.ax = [];
		this.ay = [];
		this.size = size;
		this.range = range;
		this.step = range;
		this.focus = focus;
		this.threshold = threshold;
		this.showEyes = showEyes || false;
		this.follow = true;
		this.energy = 0;
		for ( let i = 0; i < this.size; i++ ) {
			this.ax[i] = x;
			this.ay[i] = y;
		}
		this.bones = [];
	}
	run() {

		// Assign location to skeleton current position
		this.location.set(this.ax[this.size - 1], this.ay[this.size - 1]);

		// Assign location to target destination
		//this.target.set((width * sin(t)) + width/2, (height * cos(t) + height/2));

		// Calculate distance between the two points
		this.distance = this.target.dist(this.location);
		this.mappedDistance = map(this.distance, 100, 0, 1, 0.75);

		// Calculate direction of target towards skeleton
		this.target.sub(this.location);

		// Normalise length of vector to 1
		this.target.normalize();

		this.target.mult(this.mappedDistance);
		this.location.add(this.target);

		// Calculate step size based on current amplitude of given audio and frequency focus
		this.energy = fft.getEnergy(this.focus)
		this.step = rms * (this.range + this.energy);

		if (this.energy < this.threshold) {
			this.follow = true;
		} else {
			this.follow = false;
		}
		
		// Add new position to array
		if (this.follow) {
			// Wander towards the target
			this.ax.push(this.ax[this.size - 1] += random(-this.step / 5 - rms, this.step / 5 + rms) + this.target.x);
			this.ay.push(this.ay[this.size - 1] += random(-this.step / 5 - rms, this.step / 5 + rms) + this.target.y);
		} else {
			// Move around aimlessly
			this.ax.push(this.ax[this.size - 1] += random(-this.step + sin(t) - rms, this.step + sin(t) + rms));
		  this.ay.push(this.ay[this.size - 1] += random(-this.step + cos(t) - rms, this.step + cos(t) + rms));
		}
		
		// Remove bones once the size limit is reached
		if (this.ax.length > this.size) this.ax.splice(1, 1);
		if (this.ay.length > this.size) this.ay.splice(1, 1);

		// Constrain all points to the screen
		this.ax[this.size - 1] = constrain(this.ax[this.size - 1], 0, width);
		this.ay[this.size - 1] = constrain(this.ay[this.size - 1], 0, height);
		
		// Cycle through bones array to render and splice
		for (let i = this.bones.length-1; i >= 0; i--) {
			let b = this.bones[i];
			b.run();
			if (b.health <= 2) {
				this.bones.splice(i, 1);
			}
			if (this.bones.length >= this.size) {
				this.bones.splice(0, 1);
			}
		}

		if (this.showEyes) {
			fill(255);
			ellipse(this.ax[this.size - 1], this.ay[this.size - 1], 10);
			fill(0);
			ellipse(this.ax[this.size - 1], this.ay[this.size - 1], 5);
		}

	}
	addBone(bc, bh, dpt, sj) {
		this.bones.push(new Bone(this.ax[this.size-1], this.ay[this.size-1], this.ax[this.size-5], this.ay[this.size-5], bc, bh, dpt, sj));
	}
}

// Allow audio after initiating touch
function touchStarted() {
	getAudioContext().resume();
	if (!started) {
		song.play();
		song.jump(song_start);
	}
	started = true;
}

// Resize the canvas when viewport adjusted
function windowResized() {
	canvas.resize(windowWidth, windowHeight);
}

/*audio_file.onchange = function(){
    var files = this.files;
    var file = URL.createObjectURL(files[0]); 

    song = loadSound(file);
    song.play();
    /*audio_player.src = file; 
    audio_player.play();*/