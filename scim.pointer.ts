import {Pointer} from "./pointer"

export class ScimPointer extends Pointer {
    constructor(public tokens: string[]) {
        super(tokens);
    }

  toString(): string {
      let l = this.tokens.length;
      if(l > 1) {
          let str = this.tokens[0];
          for(let i =1; i < this.tokens.length; i++) {
              let nextToken: string = this.tokens[i];
              if(nextToken[0] != '[') {
                  str += '.';
              }

              str += nextToken;
          }
        return str;
      } else if(l < 1) {
          return '';
      }

      return this.tokens[0];
  }

  add(token: string): Pointer {
    var tokens = this.tokens.concat(String(token));
    var p = new ScimPointer(tokens);
    p.rt = this.rt
    return p
  }  
}