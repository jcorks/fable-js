/// \mainpage FableJS Documentation

/// \brief The text adventure building tool.
///
namespace FableJS {

///\name Builder Interface
///
/// When using Fable, the builder interface will be what you use to formuate your story.
/// It is builting under the assumption that users will provide input in the form of a sentence or 
/// fragment where they, the seubject, are commanding an action. For example, commands such as "I walk to the store." or 
/// more simply, "walk store", would be considered fairly typical kinds of input from the user. As you can probably note, 
/// there are many ways to express the same command. This interface will help manage the complexity 
/// introduced form this observation.
///
/// The builder interface focuses on breaking down what the user is trying to communicate with their commands.
/// The basic command in Fable consists of at least an Action and an Object within the context 
/// of a Scene. 
/// 
/// A scene is a context by which the words are interpreted. Actions, Objects, and other blocks
/// are unique to the context. The action is what the user wants to do. As such, it is usually 
/// represented by a verb. The object is what the action applies to.
///
/// Wildcards
/// ---------
///
/// In a lot of situations, you may find that your action may not need an object, or that 
/// your action applies no matter what scene your in. In this situation, you may find it useful 
/// to use the wildcard "*" as the name. The wildcard name is interpreted as "anything", so defining an action 
/// of "look" and an object "*" will match any object if 'look' is used as the action by the user.
/// Usage of wildcards also introduces the concept of match strength. Wildcard matches are more vague 
/// than direct matches, so if a commands with more direct word matches will be prioritized over
/// one with more wildcards. As such, wildcards are extremely useful for specifying handlers for 
/// unknown words. 
///

///\{

/// Begins a new scene context.
/// @param nameRaw The name of the scene to modify. You can also just pass a string.
/// 
Fable Scene(ArrayOrString nameRaw);


/// \brief Adds a prompt to the scene
/// @param cb A callback to run when the Scene context is changed to it (via GoToScene()) 
///
Fable OnEnter(Function cb);

/// \brief Adds an action to be valid for the scene
/// @param verb An array or string containing what action to modify.
///
Fable Action(ArrayOrString verb);

/// \brief Adds an object to which the verb refers
/// @param name An array or string containing what object to modify.
/// @param cb A function to run when a match occurs up to this object. The function is passed an Object. The Object is unique to each scene.
///
Fable Object(ArrayOrString name, Function cb);

/// \brief Adds a preposition to further detail the verb
/// @param name An array or string containing a preposition to modify.
///
Fable Preposition(ArrayOrString name);

///\}



/// \brief Tries to come up with a match to the input.
///
/// The input string is always parsed as follows
///
///      [action] [object] [preposition] [object] [preposition] ...
///
/// If the input string matches either partiolly or in its entirety, the last callback-weilding 
/// component has its callback called (the only non-callback components 
/// are [prepositions]).
///
null Parse(String input);



/// \brief Changes the scene context.
///
/// Most actions scene to provide context for how the command 
/// should be interpreted. GoToScene provides the mechanism to choose what 
/// built scenes should serve as the new context. Successfully changing to the scene
/// calls the scene's callback.
/// @param name Name of the scene to change to. If the scene does not exist, no action is taken.
null GoToScene(String name);



///\name Input Tweaking
///
/// Usually, there will be many ways to say the same phrase or communicate the same idea, 
/// As such, these functions will help boil down extra, non-essential words to make it easier to parse 
/// complex thoughts into their base ideas. Effectively using these tools will allow for very natural speech 
/// to be interpreted correctly. As powerful as these functions are, it should be used with caution.
/// Often words that are synonyms or extraneous in one situation may not be in another.
/// Choose these very carfully.
///
///\{

/// \brief Specifies the list of words that should be ignored in parsing contexts.
///
/// There are many words that, in most contexts of a text adventure, are not necessary. 
/// This will help trim some of those words. A more robust text adventure will be able to 
/// interpret natural speech and structures. Calling this function tells Fable to ignore 
/// the given word(s) when interpreting input. from Parse().
null Ignore(ArrayOrString exWord);

/// \brief identifies an exact string as an alias.
///
/// Aliases may include spaces and special characters, and 
/// may refer to other aliases. Aliases are resolved 
/// before anything else.
null Alias(String name, ArrayOrString alias);

///\}




};
