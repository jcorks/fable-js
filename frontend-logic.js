// Contains the inteactive logic for the demo


world = {}
world.backpack = {}; //< inventory
world.backpack.powered = {};
world.backpack.contents = [];
world.text = "";     //< main text for the story
world.input = "";    //<text form the output only


// Prints additional text to the main story board
world.Print = function(text){
    world.text += "* " + text; 
    world.text += "<br/>";
    world.Update();
}




///////// Inentory //////////////////////

// Adds an object to the inventory
world.backpack.Add = function(name) {
    world.Print("You put the " + name + " in your backpack.");
    world.backpack.contents.push(name);    
    world.backpack.powered[name] = false;
}

world.backpack.Remove = function(name) {
    if (!world.backpack.Has(name)) return;
    var newArr = [];
    for(var i = 0; i < world.backpack.contents.length; ++i) {
        if (world.backpack.contents[i] != name)
            newArr.push(world.backpack.contents[i]);
    }
    world.backpack.contents = newArr;
}

// Returns whether the item is in the backpack
world.backpack.Has = function(item) {
    for(var i in world.backpack.contents) {
        if (world.backpack.contents[i] == item) return true;
    }
    return false;
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
    if (world.backpack.contents.length == 0) {
        world.Print("Unfortunately, your pockets are empty.");
    } else {
        for(var n = 0; n < world.backpack.contents.length; ++n) {
            world.Print("You find a(n) " + world.backpack.contents[n]);
        }
    }
}











// Updates the display
world.Update = function() {
    document.getElementById("text").innerHTML = this.text;// + ">" + this.input;
    
}

// Enters the typed command
world.Enter = function() {
    world.text += ">" + world.input + "</br></br>"; 
    Fable.Parse(world.input);
    world.input = "";
    world.Update();
}



//////////////////// Event handlers for the page



window.onload = function(){
    console.log("Loaded");
    Fable.GoToScene("Room");
}


world.SubmitCommand = function() {
    world.input = document.getElementById("command").value; 
    document.getElementById("command").value = "";
    world.Update();
    world.Enter();
    window.scrollTo(0, document.body.scrollHeight);
    
}

/*
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
*/









