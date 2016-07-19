// definition of the story




// Other notes:
// - when you select and the scene / object/ action already exists, 
//   then the scene/object/action is modified.



// you have the ability to completely ignore words when parsing.
// only be absolutely sure you want to do this, as sometimes the extraneousness of 
// a word is context-dependent.
Fable.Ignore(["the", "at", "I", "please", "would"]);


// you also have the ability to set aliases. Aliases are just words or groups of words that 
// always refer to a different word. The first argument is the word to map to, and the second is 
// the different ways of saying it. Aliases may have spaces and symbols.
// Just like ignoring words, there are some cases where aliases may be context-dependent 
// depeinding on what you want to express, so use with caution.
Fable.Alias("sword",     ["blade",      "weapon",  "pointy thing "]);
Fable.Alias("check",     ["look",       "examine", "go to",       "scrutinize", "examine", "inspect", "consider"]);
Fable.Alias("inventory", ["backpack",   "goods",   "stuff"]);
Fable.Alias("get",       ["take",       "pick",    "pick up",     "lift",       "lift up"]);
Fable.Alias("open",      ["unlock"]);
Fable.Alias("attack",    ["break",      "cut",     "slice",   "hit"]);
Fable.Alias("leave",     ["exit",       "depart"]);
Fable.Alias("light",     ["light bulb", "bulb"]);
Fable.Alias("place",     ["put",        "replace"]);
Fable.Alias("say",       ["yell",       "scream",  "exclaim"]);


 // The "*" scene is the default scene. In any context, if a parsed command does not 
 // match anything in the current scene, the default scene is tested against. The default scene 
 // is appropriate for general actions that are always available (i.e. "check inventory")
Fable.Scene("*")
    // * for the Scene, action, and subject will handle all the cases 
    // where the player types somethign unknown.
    .Action("*")
        .Object("*",
            function(){
                world.Print("....uhhh");
            })


    // inventory
    .Action("inventory")
        .Object("*",
            function() {
                world.backpack.Print();
            })
    .Action("check")
        .Object("inventory",
            function() {
                world.backpack.Print();
            })





;




// The initial scene.
Fable.Scene("Room")
    .OnEnter(function(room){
        world.Print("You find yourself in an dimly-lit room.");

        room.doorLocked = true;
        room.hasSword   = true;
        room.hasLight   = true;
    })

    // "*" is the default handler. If the subject doesnt match, the default handler will be called instead
    .Action("check")         
        .Object("*", 
            function(room){
                world.Print("The room you're in is of little comfort, that's for sure.");
                world.Print("Scanning across the walls lit by a single bulb in the center of the ceiling,");
                world.Print("you find one door and a disturbing lack of windows.");
                    
                if (!world.backpack.Has("sword"))
                    world.Print("Something shimmers on the ground.");
                
                if (!room.doorLocked)
                    world.Print("The door is open. Light from the outside flows in the room.");
            })

            
            
        .Object(["shimmer","thing","ground","floor"],
            function(){
                world.Print("Upon closer examination, the shimmer on the ground appears to be a sword.");

            })
        
        
        .Object(["light", "ceiling"],
            function(){
                world.Print("The ceiling is pretty bare except for the incandescent bulb at");
                world.Print("its center. You listen to the bulb's low, electrical hum.");
            })
        
        
        .Object("door",
            function(){
                world.Print("The door doesn't appear to have any sort of handle.");
                world.Print("Actually, the door is effectively a slab of iron.");
                world.Print("The door appears to be impossible to open.");
                if (world.backpack.Has("sword")) {
                    world.Print("...until you remember you have a sword.");
                }
                
            })
            

    .Action(["open", "attack"])
        .Object("door",
            function(room){
                if (world.backpack.Has("sword") && world.backpack.IsPowered("sword")) {
                    world.Print("The energized blade cuts through the door with");
                    world.Print("great ease as you follow through your swing. The cleaved");
                    world.Print("door falls over.");
                    
                    room.doorLocked = false;
                    

                    
                    
                } else if (world.backpack.Has("sword")) {
                    world.Print("You swing the sword at the door.");
                    world.Print("Each swing you deliver results in a loud clang");
                    world.Print("and a lack of progress. The door is unaffected.");
                } else {
                    world.Print("You bang your fist on the door repeatedly while ");
                    world.Print("frantically kicking the door. It seems that ");
                    world.Print("being a slab of iron makes it harder to open.");
                }
        })

        
    .Action("attack")
        .Object("light",
            function(room){

                
                if (!room.doorLocked) {
                    world.Print("The light bulb shatters. The light from the outside fills the room.");
                } else {
                    world.Print("The light bulb shatters, and with it");
                    world.Print("your chance at survival, unfortunately.");
                    Fable.GoToScene("DarkRoom");
                }
                
                
                
                return function(){
                    world.Print("It's already broken.");
                }
            })
        

            
    .Action("get")
        .Object("sword", 
            function(){
                world.Print("You pick up the sword. Good thinking.");
                world.backpack.Add("sword");
                
                
                
                
                
                // remove callback
                Fable.Scene("Room").Action("check").Object(["shimmer","thing,","ground"], null);
                
                
                
                // Add check callback for sword in general context
                Fable.Scene("*").Action("check").Object("sword", 
                    function(){
                        world.Print("Well, it's definitely a sword... you think anyway. Though,");
                        world.Print("you admitedly find it rather short for a sword. You figure it's");
                        world.Print("pointy and swingable enough to be useful.");
                        world.Print("You notice a small button on the sword's hilt");
                    }
                );
                
                // Add special button thing 
                Fable.Scene("*").Action(["press","check"]).Object("button",
                    function(){
                        world.Print("You press the button in the sword's hilt.");
                        world.Print("The sword whirs for a few seconds and violently");
                        world.Print("shakes. Suddenly, a light shines out. An aura now covers");
                        world.Print("the sword's blade.");
                        world.backpack.PowerOn("sword");
                        
                        Fable.Scene("*").Action("check").Object("sword", 
                            function(){
                                world.Print("The sword's blade continues to shine with a blinding aura.");
                            }
                        );
                        
                    }
                );
                return function(){
                    world.Print("It looks like you already have the sword.");
                };
                
            })
            
        .Object("light",
            function(room){
                world.backpack.Add("light");
                if (room.doorLocked) {
                    Fable.GoToScene("DarkRoom");
                } else {
                    return function(){world.Print("You already took the light.");}
                }
            })
            
            
            
        .Object("*",
            function(){world.Print("There doesn't seem to be one nearby..");})
            
            

    .Action(["go","walk"])
        .Object("*",
            function(room){
                if (!room.doorLocked)
                    Fable.GoToScene("Outside");
                else {
                    world.Print("You pace around the room thing about how much");
                    world.Print("you dislike being in this room.");
                }
            })
    
    
    .Action(["leave"])
        .Object("*",
            function(room){
                if (!room.doorLocked)
                    Fable.GoToScene("Outside");
                else {
                    world.Print("As much as you'd like to leave this lovely room");
                    world.Print("(which you do), the door still blocks your way.");
                }
            })
    
    
    .Action(["say"])
        .Object("*")
;







Fable.Scene("Outside")
    .OnEnter(function(){
        world.Print("You exit the room and are blinded by the sunlight.");
        world.Print("[Demo end]");
    });
;








Fable.Scene("DarkRoom")
    .OnEnter(function(){
        world.Print("You find yourself in a non-lit room.");
    })
    

    .Action("*").Object("*", function(){
            world.Print("Unfortunately, it's too dark to see anything.");})
    
    
    .Action("place")
        .Object("light", function(){
            if (world.backpack.Has("light")) {
                world.Print("You fumble around in the darkness, yet");
                world.Print("manage to somehow get the bulb back in place");
                Fable.GoToScene("Room");
            } else {
                world.Print("The light is regretably still broken.");
            }
            
        });
;
    
    

   
    
