Fable-js
========

Fable-js is a single script that allows you to easily get started on writing a 
text adventure-like game. Fable-js uses no dependencies, nor does it require any
special browser ability. All browsers newer and including Internet Explorer 5 (it's like ancient)
should be able to run this.

The aim of Fable-js is to provide an interface that naturally lends 
its code to reflect the structure of the text adventure, while keeping its source minimal and dependence-free.
As such, Fable-js is purely general: no other tools are given. (Though the example can get you started on a 
frontend that best suits your intentions).


[A live example](https://jcorks.github.io/fable-js/), [its story source](https://jcorks.github.io/fable-js/story.js), and [its driving logic](https://jcorks.github.io/fable-js/frontend-logic.js).

[Documentation](https://jcorks.github.io/fable-js/docs/html/namespaceFableJS.html)



Usage
-----

Once you include fable.js, you can write your story. Story writing 
is done through the builder interface. You may notice that how the user 
explores the text adventure is very closely related to how you as the developer 
specify story logic. 

We are going to write our own simple story as an example.
Here is what we have so far.


    Fable.Scene("Forest")
      .OnEnter(function(forest) {
        console.log("You enter the forest");
      })
        
      .Action("take")
        .Object("weapon", 
            function(forest){
                console.log("* You arm yourself.");
            })
        
        .Object("stone",
            function(){
                console.log("* You take the stone.");
            })
    ;
    Fable.GoToScene("Forest");


We create a scene "Forest" with an action and 2 objects that can receive the action:

    Fable.Parse("take weapon"); 
    >* You arm yourself.
    Fable.Parse("take stone");
    >* You take the stone.
    



Action(), Object(), and Scene() are part of the builder's interface. The behavior 
is a lot like a selector: you specify the context that should be modified. The behavior is 
always defined on the Object of the Action.

You can also specify aliases and ignored words to better approach general situations:

    Fable.Alias("weapon", ["sword", "axe", "sharp thing", "knife"]);
    Fable.Ignore(["at", "the", "please"]);

... allowing for natural and dynamic commands:

    Fable.Parse("Take the sharp thing, please.");
    >* You arm yourself.


