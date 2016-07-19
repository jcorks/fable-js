/*  

Fable-js: a simple text-adventure engine.

The MIT License (MIT)

Copyright (c) 2016 Johnathan Corkery
(jcorkery@umich.edu)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

       
 */






var Fable = {};

// A named object node.
Fable.ContextObject = function(name){
    this.name           = name;
    this.cb             = null;
    this.map            = {};
    this.defaultRef     = null;
    this.prompt         = null;
    this.parent         = null;
    this.instance       = {};
}


// Text stack organization:
// L0: Scene
// L1: Action 
// L2: Object 
// L3: Preposition 
// L4: Object 
// L5: Preposition 
// ....
Fable.root      = new Fable.ContextObject("< Root >");
Fable.nameStack = [];

Fable.stringStack = null;
Fable.currentScene = null;
Fable.aliasList = [];
Fable.blacklist = [];


Fable._TierToString = function(tier) {
    switch(tier) {
        case 0: return "Scene";
        case 1: return "Action";
        default:
            if (tier%2==0) return "Object";
            else return "Preposition";
    }
    // should never get here.
    return "";
}


// Returns the associative array of the requested level.
// If the requested level does not yet exist, it will be created.
// If the requested level is unexpected, an error is thrown
Fable._GetActiveTier = function(neededTier) {
    var tier = Fable.nameStack.length;
    
    // if the needed tier does not match the current tier level,
    // the context would be pretty vague, so we prevent it.
    if (neededTier > tier) {
        throw new Error("Context / action mismatch: Expected a " 
            + Fable._GetActiveTier(neededTier) + ", but received a request for a "
            + Fable._GetActiveTier(tier) + "!");
        return null;
    }
    
    // wind down the stack until we reach the requested context
    while(neededTier != Fable.nameStack.length) {
        Fable.nameStack.pop(); tier--;
    }
    
    if (tier==0) {
        var out = [];
        out.push(Fable.root);
        return out;;
    } else
        return Fable.nameStack[Fable.nameStack.length-1];
}


// splits and makes sure the name is clear of impurities
Fable._ParseName = function(name) {
    if ((typeof name == "string") && name.length) {
        v = [];
        v.push(name);
        name = v;
    }
    
  
    for(var i = 0; i < name.length; ++i) {
        name[i] = name[i].toLowerCase().trim();
        if (name[i].includes(" ") ||
                name[i].includes("\n") ||
                name[i].includes("\t") ||
                name[i].includes("\r")) throw new Error("Names of objects are not allowed to have whitespace"); 
            
    }
  

  
    return name;

}

// Returns a ref to an array of ContextObjects that match members of the given namelist
// Each slot of the aray will either cntain null or a direct reference to the object 
// that exists.
// The output array will always be the number of members of nameList.

Fable._RetrieveNodes = function(parent, nameList) {
    var out = [];
    /*
    if (nameList.length == 1 && nameList[0] == "*" && 
        parent.defaultRef) {
        
        return out;
    }
    */
    for(var i = 0; i < nameList.length; ++i) {
        if (nameList[i] == "*")
            out.push(parent.defaultRef);
        else 
            out.push(parent.map[nameList[i]]);
        
    }
   
    return out;
}



// Creates a new ContextObject and adds it to the parent map appropriately
Fable._GenerateContextObject = function(name, parent) {
    var ref = new Fable.ContextObject(name);

    // if the name is the default tag, set it as the default entry
    if (name == "*")
        parent.defaultRef = ref;
    else {
        // Need to update new object for all of the names
        parent.map[name] = ref;
         
    }
    ref.parent = parent;
    
    return ref;
}


// Emplaces a new set of nodes into the Fable parsing tree
// nodeLevel specifies the tier of the nodes. For any node that doesn't 
// exist as a child node of the node level in the tree, a new one is created 
// An array of the nodes that are referred to by rawName are returned.
Fable._CreateNodes = function(rawName, nodeLevel) {
    var nameList = Fable._ParseName(rawName);
    var parents =  Fable._GetActiveTier(nodeLevel);
    
    var allObjs = [];
    for(var n = 0; n < parents.length; ++n) {
        var ref =      Fable._RetrieveNodes(parents[n], nameList);    

      
        // For each missing object, create a new one and map it directly
        for(var i = 0; i < ref.length; ++i) {
            if (!ref[i]) {
                ref[i] = Fable._GenerateContextObject(nameList[i], parents[n]);
            }
            allObjs.push(ref[i]);
        }
    }
        

    
    Fable.nameStack.push(allObjs);
    return allObjs;
}

// returns a list of tokens representing a clean version of 
// what the user had given to the parse command. Resolves:
//  - all aliases
//  - any ignored words 
//  - normalizes capitalization
Fable._CleanInput = function(input) {
    for(var i = 0; i < input.length; ++i) {
        if (input[i] == '.' ||
            input[i] == ',' ||
            input[i] == '|' ||
            input[i] == '[' ||
            input[i] == ']' ||
            input[i] == '|' ||
            input[i] == '<' ||
            input[i] == '>' ||
            input[i] == '!' ||
            input[i] == ';' ||
            input[i] == ':') input[i] = ' ';
    }
    input = input.trim();
    input = input.toLowerCase();
    var pair = null;
    // resolve all aliases
    for(i = 0; i < Fable.aliasList.length; ++i) {
        pair = Fable.aliasList[i];
        if (input.includes(pair.key)) {
            input = input.replace(pair.key, pair.value);
            i = 0;
        }
    }
    
    var list = input.split(" ");
    var realList = [];
    for(n in list) {
        if (Fable.blacklist.indexOf(list[n]) == -1) {
            realList.push(list[n]);
        }
    }
    
    return realList;
}


// returns the closest matching ContextObject
// and a rating. THe rating is an amount that reflects 
// how close of a match it is. THere is no defined metric, but 
// the higher the rating, the closer the match
Fable._ParseGroup = function(input, root) {
    // lets first normalize characters
    var out = {};
    out.rating = 0;
    out.object = null;
    
    if (!root) 
        return out;
        
        
        
    var tokens = Fable._CleanInput(input);
    var cb = null;
    var i = 0;
    var ref = null;
    var currentObject = root;
    var earlyRef = null;
    for(; i < tokens.length; ++i) { 
        // direct name from current context map
        if (currentObject.map[tokens[i]]) {
            ref = currentObject.map[tokens[i]];
            out.rating += 3;
        // default handler from the current context
        } else if (currentObject.defaultRef != null) {
            ref = currentObject.defaultRef;
            out.rating += 2;
        } else {
            break;   
        }
        

        currentObject = ref;
        if (ref.cb) {
            earlyRef = ref;
        }
    }

    out.object = currentObject;
    
    // now since we're out of tokens,
    // lets make sure we can actually map to a callback thats available    

    // We'll start looking up the tree from where we are.
    // we'll prioritize default handlers 
    while(!currentObject.cb && currentObject.defaultRef) {
        if (currentObject.defaultRef) {
            currentObject = currentObject.defaultRef;
        }
    }
    
    // if we went up the tree and found garbage on the way, reset
    if (!currentObject.cb) {
        currentObject = out.object;
    } else {
        // else we found a ref, return
        out.object = currentObject;
        return out;
    }
    
    
    // if there wasnt a suitable object,
    // lets get the last one we came across.
    // We'll backtrack up the tree. If the current node 
    // has a callback, use that one. If it doesn't,
    // check its default handler(s). If none in the default handler's chain matches 
    // go up to the next node and repeat. If there are no other nodes, we're done and there 
    // is no match
    currentObject = currentObject.parent;
    while(currentObject) {
        
        // the base node has a stronger association than its 
        // handlers
        if (currentObject.cb) {
            out.object = currentObject;
            return out;
        }
        
        var dr = currentObject.defaultRef;
        while(dr) {
            if (dr.cb) {
                out.object = dr;
                return out;
            }
            dr = dr.defaultRef;
        }
        currentObject = currentObject.parent;
    }
    
    
    // if we're here, there is no match at all :( 
    return out;
}


////////////////////////////////////////////////////////////////////////
/////////////////// BUILDERS INTERFACE /////////////////////////////////
////////////////////////////////////////////////////////////////////////

// Begins a new scene context
Fable.Scene = function(nameRaw) {

    Fable._CreateNodes(nameRaw, 0);
    return Fable;
}

// Adds a prompt to the scene
Fable.OnEnter = function(cb) {
    Fable._GetActiveTier(1);
    
    ref = Fable.nameStack[Fable.nameStack.length-1];
    for(var i = 0; i < ref.length; ++i)
        ref[i].prompt = cb;
    

    return Fable;
}

// Adds an action to be valid for the scene
Fable.Action = function(verb) {
    Fable._CreateNodes(verb, 1);
    return Fable;
}

// Adds an object to which the verb refers
Fable.Object = function(name, cb) {
    var node  = Fable._CreateNodes(name, 2);
    for(var i = 0; i < node.length; ++i)
        node[i].cb   = cb;    
    
    return Fable;
}


// Adds a preposition to further detail the verb
Fable.Preposition = function(name) {
    var node  = Fable._CreateNodes(name, 3);
    return Fable;
}






////////////////////////////////////////////////////////////////////////
/////////////////// GENERAL  INTERFACE /////////////////////////////////
////////////////////////////////////////////////////////////////////////




// Tries to come up with a match to the input.
// The input string is always parsed as follows
//
//      [action] [object] [preposition] [object] [preposition] ...
//
// If the input string matches either partiolly or in its entirety, the last callback-weilding 
// component has its callback called (the only non-callback components 
// are [prepositions]).

//TODO add "match priority": each input must go through the curent scene and the default scene ad attempt to find a match 

Fable.Parse = function(input) {
    var normalContextResult = Fable._ParseGroup(
        input, Fable.currentScene
    ); 
    
    
    var generalContextResult = Fable._ParseGroup(
        input, Fable.root.defaultRef
    ); 
    
    
    var currentObject = (normalContextResult  .rating >= 
                         generalContextResult .rating ? 
                            normalContextResult.object :
                            generalContextResult.object
                        );
    
    /*
    console.log("normal  context match: " + (normalContextResult.object ? 
                                            normalContextResult.object.name : "<no object>")
                                         + "-> rating: " + normalContextResult.rating
                );

    console.log("general context match: " + (generalContextResult.object ? 
                                            generalContextResult.object.name : "<no object>")
                                         + "-> rating: " + generalContextResult.rating
                ); */               

    // we found something, call its cb
    if (currentObject == null ||
        currentObject.cb == null) return;
        
    var replacement = currentObject.cb(Fable.currentScene.instance);
    if (replacement != null) {
        if (typeof replacement === 'function')
            currentObject.cb = replacement;
        else 
            throw new Error("Cannot replace event callback with non-function");
    }
    
}
    


Fable.GoToScene = function(name) {
    name = name.trim().toLowerCase();
    if (Fable.root.map[name] == null)
        throw new Error(name + " does not exist as a scene.");
    
    var scene = Fable.root.map[name];
    Fable.currentScene = scene;
    if (scene.prompt)
        scene.prompt(scene.instance);
}


// ignores the specified word in parsing contexts
Fable.Ignore = function(exWord) {
    
    if (typeof exWord == "string")
        Fable.blacklist.push(exWord.trim().toLowerCase());
    for(var i = 0; i < exWord.length; ++i) {
        Fable.blacklist.push(exWord[i].trim().toLowerCase());
    }
}

// identifies an exact string as an alias.
// Aliases may include spaces and special characters, and 
// may refer to other aliases. Aliases are resolved 
// before anything else.
Fable.Alias = function(name, alias) {

    if (typeof alias == "string") {
        var pair = new Object();
        pair.value = name. trim().toLowerCase();
        pair.key   = alias.trim().toLowerCase();
        Fable.aliasList.push(pair);
    } else {
        if (!alias.length) return;
        for(var i = 0; i < alias.length; ++i) {
            var pair = new Object();
            pair.value = name. trim().toLowerCase();
            pair.key = alias[i].trim().toLowerCase();
            Fable.aliasList.push(pair);
        }    
    }

}