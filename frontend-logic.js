// Contains the inteactive logic for the demo


world = {}
world.backpack = []; //< inventory
world.backpack.powered = {};
world.text = "";     //< main text for the story
world.input = "";    //<text form the output only
world.door = {};
world.door.locked = true;


// Prints additional text to the main story board
world.Print = function(text){
    world.text += "* " + text; 
    world.text += "<br/>";
    world.Update();
}

// Handles what to do if the player wants to exit
world.LeavePrompt = function() {
    console.log("You have trouble leaving...");
}



// Adds an object to the inventory
world.backpack.Add = function(name) {
    world.Print("You put the " + name + " in your backpack.");
    world.backpack.push(name);    
    world.backpack.powered[name] = false;
}


// Returns whether the item is in the backpack
world.backpack.Has = function(item) {
    return world.backpack.indexOf(item) != -1;
}

// Powers up the item
world.backpack.PowerOn = function(item) {
    world.backpack.powered[item] = true;
}

// Returns whether the item is powered
world.backpack.IsPowered = function(item) {
    return world.backpack.powered[item];
}

// Prints the inventory of the player
world.backpack.Print = function(){
    world.Print("You fish through your backpack...");
    if (world.backpack.length == 0) {
        world.Print("Unfortunately, your pockets are empty.");
    } else {
        for(var n = 0; n < this.length; ++n) {
            world.Print("You find a(n) " + this[n]);
        }
    }
}

// Updates the display
world.Update = function() {
    document.getElementById("text").innerHTML = this.text + ">" + this.input;
    
}

// Enters the typed command
world.Enter = function() {
    world.text += ">" + world.input + "</br></br>"; 
    Fable.Parse(world.input);
    world.input = "";
    world.Update();
    window.scrollTo(0, 0);
}



//////////////////// Event handlers for the page



window.onload = function(){
    console.log("Loaded");
    Fable.GoToScene("Room");
}

document.onkeydown = function(evt) {
    var charCode = evt.keyCode || evt.which;   
    
    // charCode is deprecated,(TODO REMOVE), but 
    // in the meantime, delete and backspace are captured.
    if ((charCode == 8 || charCode == 49) && event.preventDefault) {
        evt.preventDefault(); 
    
        // Remove previous text
        if (world.input.length) {
            world.input = world.input.substring(0, world.input.length-1);
            world.Update();
        }
        
       
    }
}

document.onkeypress = function(evt) {
    evt = evt || window.event;
    var charCode = evt.keyCode || evt.which;
    var charStr = String.fromCharCode(charCode);


    
    world.input += charStr;
    if (charCode == 13)
        world.Enter();
    

    world.Update();
    
};









