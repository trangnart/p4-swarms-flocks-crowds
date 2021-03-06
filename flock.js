let flock;
let foods = [];

function setup() {
  createCanvas(640, 360);
  createP("Click mouse to feed");

  flock = new Flock();
  // Add an initial set of boids into the system
  for (let i = 0; i < 20; i++) {
    let b = new Boid(width / 2,height / 2);
    flock.addBoid(b);
  }
}

function draw() {
  background(0,138,188);
  flock.run();

  seaweed((width/2), height/2);

  for (let i = 0; i < foods.length; i++) {
    fill("#964b00");
    circle(foods[i].x, foods[i].y, 5);
  }

  for (let b = 0; b < flock.boids.length; b++) {
    boid = flock.boids[b];
    for (let j = 0; j < foods.length; j++) {
      boid.attract(j);
    }
  }
}

function seaweed(x, y){
  fill("#918644");
  ellipse(x+270, y-55, 11, 80);
  ellipse(x+270, y-5, 20, 100);
  ellipse(x+270, y+50, 30, 120);
  ellipse(x+270, y+140, 45, 220);

  fill("#54764b");
  ellipse(x+235, y+130, 50, 170);
  ellipse(x+235, y+45, 30, 130);
  ellipse(x+235, y, 15, 90);

  fill("#2f4c1c");
  ellipse(x+300, y-20, 15, 100);
  ellipse(x+300, y+40, 30, 150);
  ellipse(x+300, y+120, 50, 200);

  ellipse(x+200, y-80, 20, 150);
  ellipse(x+200, y, 35, 200);
  ellipse(x+200, y+100, 60, 250);

  fill("#6e8234");
  ellipse(x+255, y+60, 10, 30);
  ellipse(x+255, y+90, 20, 60);
  ellipse(x+255, y+130, 35, 80);

  fill("#5b3e31");
  ellipse(x+250, y+180, 200, 80);
}

function mousePressed() {
  foods.push(createVector(mouseX, mouseY));
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids

function Flock() {
  // An array for all the boids
  this.boids = []; // Initialize the array
}

Flock.prototype.run = function() {
  for (let i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually
  }
}

Flock.prototype.addBoid = function(b) {
  this.boids.push(b);
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(x, y);
  this.r = 3.0;
  this.maxspeed = 3;    // Maximum speed
  this.maxforce = 0.05; // Maximum steering force
}

Boid.prototype.run = function(boids) {
  this.flock(boids);
  this.update();
  // this.borders();
  this.render();
}

Boid.prototype.applyForce = function(force) {
  // We could add mass here if we want A = F / M
  this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function(boids) {
  let sep = this.separate(boids);   // Separation
  let ali = this.align(boids);      // Alignment
  let coh = this.cohesion(boids);   // Cohesion
  let avo = this.avoid(boids);      // Avoid walls
  // Arbitrarily weight these forces
  sep.mult(10.0);
  ali.mult(2.0);
  coh.mult(1.0);
  avo.mult(3.0);
  // Add the force vectors to acceleration
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
  this.applyForce(avo);
}

// Method to update location
Boid.prototype.update = function() {
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target) {
  let desired = p5.Vector.sub(target,this.position);  // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  let steer = p5.Vector.sub(desired,this.velocity);
  steer.limit(this.maxforce);  // Limit to maximum steering force
  return steer;
}

Boid.prototype.render = function() {
  // Draw a triangle rotated in the direction of velocity
  noStroke();
  let theta = this.velocity.heading() + radians(90);
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);
  stroke(229, 113, 67);
  fill(186,60,48);
  ellipse(this.r-3.5, this.r-17, 15, 30);
  fill(0);
  noStroke();
  circle(this.r-2, this.r-24, 3);
  fill(4,40,104);
  stroke(88, 99, 162);
  arc(this.r-5, this.r-3, 30, 30, 0, 5);
  fill(0)
  pop();
}

// Wraparound
Boid.prototype.borders = function() {
  if (this.position.x < -this.r)  this.position.x = width + this.r;
  if (this.position.y < -this.r)  this.position.y = height + this.r;
  if (this.position.x > width + this.r) this.position.x = -this.r;
  if (this.position.y > height + this.r) this.position.y = -this.r;
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function(boids) {
  let desiredseparation = 20.0;
  let steer = createVector(0, 0);
  let count = 0;
  // For every boid in the system, check if it's too close
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation)) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function(boids) {
  let neighbordist = 40;
  let sum = createVector(0,0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    let steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function(boids) {
  let neighbordist = 10;
  let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].position); // Add location
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    return this.seek(sum);  // Steer towards the location
  } else {
    return createVector(0, 0);
  }
}

Boid.prototype.avoid = function(boids) {
  let steer = createVector(0, 0);
  if (this.position.x <= 0) {
    steer.add(createVector(1, 0));
  }
  if (this.position.x > 480) { // width of canvas
    steer.add(createVector(-1, 0));
  }
  if (this.position.y <= 0) {
    steer.add(createVector(0, 1));
  }
  if (this.position.y > 360) { // height of canvas
    steer.add(createVector(0, -1));
  }
  return steer;
}

function inVicinity(coord, area) {
  return (coord > area - 20 && coord < area + 20);
}

Boid.prototype.attract = function(index) {
  this.applyForce(this.seek(foods[index]));

  const {x,y} = foods[index];

  if (inVicinity(x,Math.trunc(this.position.x))
  && inVicinity(y,Math.trunc(this.position.y))) {
    foods.splice(index, 1);
  }
}