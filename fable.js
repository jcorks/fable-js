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
 
 *       
 */

// Fable targets IE 5 and up.




/// \brief Contains all Fable functions and attributes.
///
/// A namespace that encapsulates the state of Fable. All functions modify the state of 
/// Fable. The Fable interface is plit up into two sections: the \ref builder-interface "builder interface"
///
var Fable = {};
    Fable.compatability = {};
    Fable.internal = {};




// Handle compatability
if (String.prototype.trim === "function") {
    Fable.compatability.trim = function(string) {
        return string.trim();
    };
} else {
    Fable.compatability.trim = function(string) {
        return string.replace(/^\s+|\s+$/g, "");
    };
}


if (Array.prototype.indexOf === "function") {
    Fable.compatability.indexOf = function(arr, index) {
        return arr.indexOf(index);
    };
} else {
    // lifted from MDC
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf#Compatibility
    Fable.compatability.indexOf = function(arr, elt) {
        var len = arr.length >>> 0;

        var from = Number(arguments[1]) || 0;
        from = (from < 0)
             ? Math.ceil(from)
             : Math.floor(from);
        if (from < 0) {
          from += len;
        }
        
        while(from < len) {
          if (from in arr &&
              arr[from] === elt) {
            return from;
          }
          from+=1;
        }
        return -1;
        
    };
    
}






// A named object node.
Fable.ContextObject = function(name){
    this.name           = name;
    this.cb             = null;
    this.map            = {};
    this.defaultRef     = null;
    this.prompt         = null;
    this.parent         = null;
    this.instance       = {};
};


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
Fable.aliasListNeedsSort = false;
Fable.blacklist = [];


Fable.internal.TierToString = function(tier) {
    switch(tier) {
        case 0: return "Scene";
        case 1: return "Action";
        default:
            if (tier%2==0) {return "Object";     }
            else           {return "Preposition";}
    }
};


// Returns the associative array of the requested level.
// If the requested level does not yet exist, it will be created.
// If the requested level is unexpected, an error is thrown
Fable.internal.GetActiveTier = function(neededTier) {
    var tier = Fable.nameStack.length;
    
    // if the needed tier does not match the current tier level,
    // the context would be pretty vague, so we prevent it.
    if (neededTier > tier) {
        throw new Error("Context / action mismatch: Expected a " 
            + Fable.internal.GetActiveTier(neededTier) + ", but received a request for a "
            + Fable.internal.GetActiveTier(tier) + "!");
    }
    
    // wind down the stack until we reach the requested context
    while(neededTier != Fable.nameStack.length) {
        Fable.nameStack.pop(); tier--;
    }
    
    if (tier==0) {
        var out = [];
        out.push(Fable.root);
        return out;
    } else {
        return Fable.nameStack[Fable.nameStack.length-1];
    }
};


// splits and makes sure the name is clear of impurities
Fable.internal.ParseName = function(name) {
    if ((typeof name == "string") && name.length) {
        v = [];
        v.push(name);
        name = v;
    }
    
  
    for(i = 0; i < name.length; i+=1) {
        name[i] = Fable.compatability.trim(name[i].toLowerCase());
        if (name[i].search(" ") != -1 ||
            name[i].search("\n") != -1 ||
            name[i].search("\t") != -1 ||
            name[i].search("\r") != -1) {throw new Error("Names of objects are not allowed to have whitespace");} 
            
    }
  

  
    return name;

};

// Returns a ref to an array of ContextObjects that match members of the given namelist
// Each slot of the aray will either cntain null or a direct reference to the object 
// that exists.
// The output array will always be the number of members of nameList.

Fable.internal.RetrieveNodes = function(parent, nameList) {
    var out = [];
    /*
    if (nameList.length == 1 && nameList[0] == "*" && 
        parent.defaultRef) {
        
        return out;
    }
    */
    for(i = 0; i < nameList.length; i+=1) {
        if (nameList[i] == "*") {
            out.push(parent.defaultRef);
        } else { 
            out.push(parent.map[nameList[i]]);
        }
    }
   
    return out;
};



// Creates a new ContextObject and adds it to the parent map appropriately
Fable.internal.GenerateContextObject = function(name, parent) {
    var ref = new Fable.ContextObject(name);

    // if the name is the default tag, set it as the default entry
    if (name == "*") {
        parent.defaultRef = ref;
    } else {
        // Need to update new object for all of the names
        parent.map[name] = ref;
         
    }
    ref.parent = parent;
    
    return ref;
};


// Emplaces a new set of nodes into the Fable parsing tree
// nodeLevel specifies the tier of the nodes. For any node that doesn't 
// exist as a child node of the node level in the tree, a new one is created 
// An array of the nodes that are referred to by rawName are returned.
Fable.internal.CreateNodes = function(rawName, nodeLevel) {
    var nameList = Fable.internal.ParseName(rawName);
    var parents =  Fable.internal.GetActiveTier(nodeLevel);
    
    var allObjs = [];
    var ref;
    for(n = 0; n < parents.length; n+=1) {
        ref =      Fable.internal.RetrieveNodes(parents[n], nameList);    

      
        // For each missing object, create a new one and map it directly
        for(i = 0; i < ref.length; i+=1) {
            if (!ref[i]) {
                ref[i] = Fable.internal.GenerateContextObject(nameList[i], parents[n]);
            }
            allObjs.push(ref[i]);
        }
    }
        

    
    Fable.nameStack.push(allObjs);
    return allObjs;
};

// returns a list of tokens representing a clean version of 
// what the user had given to the parse command. Resolves:
//  - all aliases
//  - any ignored words 
//  - normalizes capitalization
Fable.internal.CleanInput = function(input) {
    //replace with regexp
    input = input.replace(".", " ");
    input = input.replace(",", " ");
    input = input.replace("|", " ");
    input = input.replace("[", " ");
    input = input.replace("]", " ");
    input = input.replace("|", " ");
    input = input.replace("<", " ");
    input = input.replace(">", " ");
    input = input.replace("!", " ");
    input = input.replace(";", " ");
    input = input.replace(":", " ");
    
    input = Fable.compatability.trim(input);
    input = input.toLowerCase();
    var pair = null;
    
    // re-sort alias list. We always want 
    // the bigger ones first so that search strings will replace compount 
    // phrases before sub words.
    if (Fable.aliasListNeedsSort) {
        Fable.aliasList.sort(function(a, b){
            if (a.key.length < b.key.length) {return 1; }
            if (a.key.length > b.key.length) {return -1;}
            return 0;            
        });
        Fable.aliasListNeedsSort = false;
    }
    
    // resolve all aliases
    for(i = 0; i < Fable.aliasList.length; i+=1) {
        pair = Fable.aliasList[i];
        if (input.search(pair.key)!=-1) {
            input = input.replace(pair.key, pair.value);
            i = 0;
        }
    }
    
    var list = input.split(" ");
    var realList = [];
    for(n in list) {
        if (Fable.compatability.indexOf(Fable.blacklist, list[n]) == -1) {
            realList.push(list[n]);
        }
    }
    
    return realList;
};


// returns the closest matching ContextObject
// and a rating. THe rating is an amount that reflects 
// how close of a match it is. THere is no defined metric, but 
// the higher the rating, the closer the match
Fable.internal.ParseGroup = function(input, root) {
    // lets first normalize characters
    var out = {};
    out.rating = 0;
    out.object = null;
    
    if (!root) {
        return out;
    }
        
        
    var tokens = Fable.internal.CleanInput(input);
    var cb = null;
    var i = 0;
    var ref = null;
    var currentObject = root;
    var earlyRef = null;
    for(; i < tokens.length; i+=1) { 
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
};


////////////////////////////////////////////////////////////////////////
/////////////////// BUILDERS INTERFACE /////////////////////////////////
////////////////////////////////////////////////////////////////////////


// Begins a new scene context.
Fable.Scene = function(nameRaw) {

    Fable.internal.CreateNodes(nameRaw, 0);
    return Fable;
};

// Adds a prompt to the scene
Fable.OnEnter = function(cb) {
    Fable.internal.GetActiveTier(1);
    
    ref = Fable.nameStack[Fable.nameStack.length-1];
    for(i = 0; i < ref.length; i+=1)
        ref[i].prompt = cb;
    

    return Fable;
};


// Adds an action to be valid for the scene
Fable.Action = function(verb) {
    Fable.internal.CreateNodes(verb, 1);
    return Fable;
};


// Adds an object to which the verb refers
Fable.Object = function(name, cb) {
    var node  = Fable.internal.CreateNodes(name, 2);
    for(i = 0; i < node.length; i+=1)
        node[i].cb   = cb;    
    
    return Fable;
};


// Adds a preposition to further detail the verb
Fable.Preposition = function(name) {
    var node  = Fable.internal.CreateNodes(name, 3);
    return Fable;
};




////////////////////////////////////////////////////////////////////////
/////////////////// GENERAL  INTERFACE /////////////////////////////////
////////////////////////////////////////////////////////////////////////



// Tries to come up with a match to the input.
Fable.Parse = function(input) {
    var normalContextResult = Fable.internal.ParseGroup(
        input, Fable.currentScene
    ); 
    
    
    var generalContextResult = Fable.internal.ParseGroup(
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
        currentObject.cb == null) {return};
        
    var replacement = currentObject.cb(Fable.currentScene.instance);
    if (replacement != null) {
        if (typeof replacement === 'function')
            currentObject.cb = replacement;
        else 
            throw new Error("Cannot replace event callback with non-function");
    }
    
};
    

// Changes the scene context.
Fable.GoToScene = function(name) {
    name = Fable.compatability.trim(name.toLowerCase());
    if (Fable.root.map[name] == null)
        throw new Error(name + " does not exist as a scene.");
    
    var scene = Fable.root.map[name];
    Fable.currentScene = scene;
    if (scene.prompt)
        scene.prompt(scene.instance);
};




// Specifies the list of words that should be ignored in parsing contexts.
Fable.Ignore = function(exWord) {
    Fable.blacklist = [];
    if (typeof exWord == "string")
        Fable.blacklist.push(Fable.compatability.trim(exWord.toLowerCase()));
    for(i = 0; i < exWord.length; i+=1) {
        Fable.blacklist.push(Fable.compatability.trim(exWord[i].toLowerCase()));
    }
};

// identifies an exact string as an alias.
Fable.Alias = function(name, alias) {

    if (typeof alias == "string") {
        var pair = new Object();
        pair.value = Fable.compatability.trim(name .toLowerCase());
        pair.key   = Fable.compatability.trim(alias.toLowerCase());
        Fable.aliasList.push(pair);
    } else {
        if (!alias.length) {return};
        for(i = 0; i < alias.length; i+=1) {
            var pair = new Object();
            pair.value = Fable.compatability.trim(name    .toLowerCase());
            pair.key   = Fable.compatability.trim(alias[i].toLowerCase());
            Fable.aliasList.push(pair);
        }    
    }
    Fable.aliasListNeedsSort = true;
    
};
///\}