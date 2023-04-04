import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StringUtilService {

  constructor() { }

  encodeNonPrintable( str:string | null):string{
    var strEncoded = ""
    for(let i=0;str && i<str.length; i++){ 
      let c =  str.charCodeAt(i)
      let matches = c.toString().match("/[\x00-\x08\x0E-\x1F]/")
      if( matches && matches.length > 0 ){
        var hex:string
        if( c < 16){
          hex = "\x000"+c.toString(16);
        }
        else{
          hex = "\x000"+c.toString(16);
        }
        strEncoded += hex

      }
      else{
        strEncoded += c.toString()
      }
    }
    return strEncoded
  }
  removeNonPrintable( str:string  ):string{
    var strEncoded = ""
    for(let i=0;str && i<str.length; i++){ 
      let c =  str.charCodeAt(i)
      if( c == 10 || c==13){
        strEncoded += " "
      }
      else{
        strEncoded += String.fromCharCode(c)
      }
    }
    // 
    return strEncoded
  }
  
}
