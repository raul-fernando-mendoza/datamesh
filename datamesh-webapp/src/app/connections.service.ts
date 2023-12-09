import { Injectable } from '@angular/core';
import { UrlService } from './url.service';

@Injectable({
  providedIn: 'root'
})
export class ConnectionsService {

  connectionNames:Array<string> | undefined = undefined

  constructor(private urlService:UrlService) { }

  getConnectionNames():Promise<string[]>{
    return new Promise(( resolve, reject ) => {
      if( this.connectionNames == undefined){
        let param={}  
        this.urlService.post("getConnectionNames",param).subscribe({ 
          'next':(result)=>{
            if(result instanceof Array<string>){
              this.connectionNames = result
              resolve( this.connectionNames )
            }
          },
          'error':(reason)=>{
            let errorMessage = reason.message
            if( reason.error && reason.error.error ){
              errorMessage = reason.error.error
            }
            alert("ERROR:" + errorMessage)
            reject( reason )
          }
        })
    
      }
      else{
        resolve( this.connectionNames)
      }
    })  
  } 

}
