//start fireworks animation using a timer to simulate our heartbeat and have it run repeatedly at our framerate until user leaves 
//the page.

window.requestAnimationFrame = (function() {
    
    return  window.requestAnimationFrame || 
            window.mosRequestAnimationFrame || 
            window.webkitRequestAnimationFrame || 
            window.msRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000/60);
            };
    
})();

var canvas = document.querySelector("#myCanvas"),
    ctx = canvas.getContext("2d"),
    
    // full screen dimensions
    
    canvasWidth = window.innerWidth, 
    canvasHeight = window.innerHeight,
    
    fireworks = [],
    particles = [],
    smokePuffs = [],
    
    maxSmokeVelocity = 1,
    
    hue = 120,
    
    //when launching fireworks with a click, too many will get launched at once without a limiter.
    limiterTotal = 5,
    limiterTick = 0,
    
    //these will be used to time the auto launches of fireworks at one launch per 80 loop ticks
    timerTotal = 80,
    timerTick = 0,
    
    mousedown = false,
    mx,
    my,
    
    smokeImage = new Image();

smokeImage.src = "images/smoke.png";

canvas.width = canvasWidth;
canvas.height = canvasHeight;

function randRange(min, max) {
    
    return Math.random() * (max-min) + min;
    
}

//calculate the distance between two points

function calculateDistance(point1X, point1Y, point2X, point2Y) {
    var xDistance = point1X - point2X,
        yDistance = point1Y - point2Y;
    
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
    
    
}

//create a firework particle object - constructor

function Firework(startX, startY, targetX, targetY) {
    
    this.x = startX;
    this.y = startY;
    
    this.startX = startX;
    this.startY = startY;
    
    this.targetX = targetX;
    this.targetY = targetY;
    
    //distance between starting point and target points
    this.distanceToTarget = calculateDistance(startX, startY, targetX, targetY);
    this.distanceTraveled = 0;
    
    //track the past coordinates of each firework to create a trail effect.
    //(increase the coordinate count to create more prominent trails).
    this.coordinates = [];
    this.coordinateCount = 3;
    
    //populate the inital coordiante collection with the current coordinates
    while (this.coordinateCount--) {
        this.coordinates.push([this.x, this.y]);
    }
    
    //set other various properties.
    this.angle = Math.atan2(targetY - startY, targetX - startX);
    this.speed = 2;
    this.acceleration = 1.05;
    this.brightness = randRange(50, 70);
    
    //circle target indicator radius
    this.targetRadius = 1;
    
}

//draw firework - method of Firework Class
Firework.prototype.draw = function() {
    
    ctx.beginPath();
    
    //move to the last tracked coordinate in the set, then draw a line to the current x and y coordinates of the firework.
    //use the length property to avoid hard coding a value in case of changes.
    ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    
    ctx.lineTo(this.x, this.y);
    
    ctx.strokeStyle = "hsl(" + hue + ", 100%, " + this.brightness + "%)";
    
    ctx.stroke();
    
    //draw the target for this firework with a pulsing circle. 
    ctx.beginPath();
    
    ctx.arc(this.targetX, this.targetY, this.targetRadius, 0, Math.PI * 2);
    
    ctx.stroke();
    
}

Firework.prototype.update = function(index) {
    
    //remove the last item in the coordinates array
    this.coordinates.pop();
    
    //add current coordinates of firework to the start of the array
    this.coordinates.unshift([this.x, this.y]);
    
    //cycle the target radius for the target
    if (this.targetRadius < 8) {
        
        this.targetRadius += 0.3;
        
    } else {
        
      this.targetRadius = 1;  
        
    }
    
    // get the current velocities based on 
    var vX = Math.cos(this.angle) * this.speed,
        vY = Math.sin(this.angle) * this.speed;
    
    //how far will the firework have traveled with velocities applied?
    this.distanceTraveled = calculateDistance(this.startX, this.startY, this.x + vX, this.y + vY);
    
    //if the distance traveled, including velocities, is greater than the initial distance
    // to the target, then the target has been reached
    if (this.distanceTraveled >= this.distanceToTarget){
        
        //explode firework and create smoke
        createExplosionParticles(this.targetX, this.targetY);
        createSmoke(this.targetX, this.targetY);
        
        //remove the Firework particle using the passed in index. 
        fireworks.splice(index, 1)
        
    } else {
        
        //target has not been reached. 
        this.x += vX;
        this.y += vY;
        
    }
    
}

// Create particle group for explosion
function createExplosionParticles(x, y) {
    
    var particleCount = 80;
    
    while (particleCount--) {
        particles.push(new ExplosionParticle(x, y));
    }
    
}

// Explosion particle constructor
function ExplosionParticle(x, y) {
    
    this.x = x;
    this.y = y;
    
    this.coordinates = [];
    this.coordinateCount = Math.round(randRange(10, 20));
    
    // populate the initial coordinate collection with the current coordinates
    while (this.coordinateCount--) {
        this.coordinates.push([this.x, this.y]);
    }
    
    this.angle = randRange(0, Math.PI*2);
    this.speed = randRange(1, 10);
    this.friction = 0.95;
    
    this.gravity = 1;
    
    this.hue = randRange(hue - 20, hue + 20);
    this.brightness = randRange(50, 80);
    this.alpha = 1;
    
    this.decay = randRange(0.015, 0.03);
    
}


ExplosionParticle.prototype.draw = function() {
    
    ctx.beginPath();
    
    ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    
    ctx.quadraticCurveTo(this.x + 1, this.y - Math.round(randRange(5, 10)), this.x, this.y);
    
    ctx.strokeStyle = "hsla(" + this.hue + ", 100%, " + this.brightness + "%, " + this.alpha + ")";
    
    ctx.stroke();
    
}

ExplosionParticle.prototype.update = function(index) {
    
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);
    
    this.speed *= this.friction;
    
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    
    this.alpha -= this.decay;
    
    if (this.alpha <= this.decay) {
        
        particles.splice(index, 1);
        
    }
    
}

// Create smoke particles
function createSmoke(x, y) {
    
    var puffCount = 1;
    
    for (var i = 0; i < puffCount; i++) {
        smokePuffs.push(new SmokeParticle(x, y));
    }
    
}

// SmokeParticle constructor
function SmokeParticle(x, y) {
    
    this.x = randRange(x - 25, x + 25);
    this.y = randRange(y - 15, y + 15);
    
    this.xVelocity = randRange(.2, maxSmokeVelocity);
    this.yVelocity = randRange(-.1, -maxSmokeVelocity);
    
    this.alpha = 1;
 
}


SmokeParticle.prototype.draw = function() {
        
    if (smokeImage) {

        ctx.save();

        ctx.globalAlpha = 0.3;

        ctx.drawImage(smokeImage, this.x - smokeImage.width / 2, this.y - smokeImage.height / 2);

        ctx.restore();

    }

}


SmokeParticle.prototype.update = function(index) {
    
    this.x += this.xVelocity;
    this.y += this.yVelocity;
    
    this.alpha -= .001;
    
    if (this.alpha <= 0) {
        smokePuffs.splice(index, 1);
    }
    
}

//main heartbeat (ticker) loop
function heartBeat() {
    
    // call this function recursively framerate times per second
    requestAnimationFrame(heartBeat);
    
    //increase the hue value to get different firework colors over time
    hue += 0.5;
    
    //normally, clearRect() would be used to clear the canvas, but we want to create a trail effect so...
    //setting the composite operation to "destination-out" will allow us to clear the canvas at a specific opacity, rather
    //than wiping it completely.
    ctx.globalCompositeOperation = "destination-out";
    
    //decrease the alpha property to create more prominent trails
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    //change the composite operation to our main mode of "lighter
    //lighter creates bright highlight points as the fireworks and particles overlap each other.
    ctx.globalCompositeOperation = "lighter";
    
    //loop over each Firework particle, draw it and update it.
    var i = fireworks.length;
    
    while (i--){
        
        fireworks[i].draw();
        fireworks[i].update(i);
        
    }
    
    //loop over each ExplosionParticle particle, draw it and update it.
    i = particles.length;
    
    while (i--){
        
        particles[i].draw();
        particles[i].update(i);
        
    }
    
    //loop over each smoke particle, draw it and update it.
    i = smokePuffs.length;
    
    while (i--){
        
        smokePuffs[i].draw();
        smokePuffs[i].update(i);
        
    }
    
    //limit the rate at which fireworks get launched when the mouse is pressed down.
    if (limiterTick >= limiterTotal){
        if (mousedown) {
            //launch a firework from bottom-middle of the screen, then set random target coordinates
            //Note: the target y coordinate should always be in the top half of the screen.
            fireworks.push(new Firework(canvasWidth/2, canvasHeight, mx, my));

            limiterTick = 0; //reset
        }
        
    }else{
        
        limiterTick++;
        
    }
    
}


//update the mouse coordinates on mousemove
canvas.addEventListener("mousemove", function(e) {
    
    mx = e.pageX - canvas.offsetLeft;
    my = e.pageY - canvas.offsetTop;
    
});

//toggle mousedown state and also prevent canvas from being selected
canvas.addEventListener("mousedown", function(e){
    
    e.preventDefault();
    mousedown = true;
    
});

canvas.addEventListener("mouseup", function(e){
    
    e.preventDefault();
    mousedown = false;
    
});

//once the page loads, start our heartBeat...
window.onload = heartBeat;