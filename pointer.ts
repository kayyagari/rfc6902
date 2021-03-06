/**
Unescape token part of a JSON Pointer string

`token` should *not* contain any '/' characters.

> Evaluation of each reference token begins by decoding any escaped
> character sequence.  This is performed by first transforming any
> occurrence of the sequence '~1' to '/', and then transforming any
> occurrence of the sequence '~0' to '~'.  By performing the
> substitutions in this order, an implementation avoids the error of
> turning '~01' first into '~1' and then into '/', which would be
> incorrect (the string '~01' correctly becomes '~1' after
> transformation).

Here's my take:

~1 is unescaped with higher priority than ~0 because it is a lower-order escape character.
I say "lower order" because '/' needs escaping due to the JSON Pointer serialization technique.
Whereas, '~' is escaped because escaping '/' uses the '~' character.
*/
function unescape(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~')
}

// custom interface from Sparrow
export interface ResourceType {
  schemas: any;
  isComplexMultiValAt: any;
  getAt: any;
  createPathExpr: any;
}

/** Escape token part of a JSON Pointer string

> '~' needs to be encoded as '~0' and '/'
> needs to be encoded as '~1' when these characters appear in a
> reference token.

This is the exact inverse of `unescape()`, so the reverse replacements must take place in reverse order.
*/
function escape(token: string): string {
  return token.replace(/~/g, '~0').replace(/\//g, '~1')
}

export interface PointerEvaluation {
  parent: any
  key: string
  value: any
}

/**
JSON Pointer representation
*/
export class Pointer {
  // below two fields are only applicable for ScimPointer but added here to minimize changes in all the function signatures
  /** the attribute that is being diffed at the moment */
  public curAt: string = ''
  /** the resourcetype of objects */
  public rt: ResourceType = null

  constructor(public tokens = ['']) { }
  /**
  `path` *must* be a properly escaped string.
  */
  static fromJSON(path: string): Pointer {
    var tokens = path.split('/').map(unescape)
    if (tokens[0] !== '') throw new Error(`Invalid JSON Pointer: ${path}`)
    return new Pointer(tokens)
  }
  toString(): string {
    return this.tokens.map(escape).join('/')
  }
  /**
  Returns an object with 'parent', 'key', and 'value' properties.
  In the special case that pointer = "", parent and key will be null, and `value = obj`
  Otherwise, parent will be the such that `parent[key] == value`
  */
  evaluate(object: any): PointerEvaluation {
    var parent: any = null
    var token: string = null
    for (var i = 1, l = this.tokens.length; i < l; i++) {
      parent = object
      token = this.tokens[i]
      // not sure if this the best way to handle non-existant paths...
      object = (parent || {})[token]
    }
    return {parent, key: token, value: object}
  }
  get(object: any): any {
    return this.evaluate(object).value
  }
  set(object: any, value: any): void {
    for (var i = 1, l = this.tokens.length - 1, token = this.tokens[i]; i < l; i++) {
      // not sure if this the best way to handle non-existant paths...
      object = (object || {})[token]
    }
    if (object) {
      object[this.tokens[this.tokens.length - 1]] = value
    }
  }
  push(token: string): void {
    // mutable
    this.tokens.push(token)
  }
  /**
  `token` should be a String. It'll be coerced to one anyway.

  immutable (shallowly)
  */
  add(token: string): Pointer {
    var tokens = this.tokens.concat(String(token))
    return new Pointer(tokens)
  }
}
