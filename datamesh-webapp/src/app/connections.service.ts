import { Injectable } from '@angular/core';
import { Connection } from './datatypes/datatypes.module';
import { FirebaseService } from './firebase.service';
import { UrlService } from './url.service';

@Injectable({
  providedIn: 'root'
})
export class ConnectionsService {

  connections:Array<Connection> | undefined = undefined

  constructor(private urlService:UrlService,
    private firebase:FirebaseService) { }

  getConnections():Promise<Array<Connection>>{
    return new Promise(( resolve, reject ) => {
      if( this.connections == undefined){
        let param={}  
        this.firebase.getDocs("Connection").then(result=>{
            this.connections = []
            result.docs.map( doc=>{
              let conn:Connection = doc.data() as Connection
              this.connections!.push( conn )
              
            })
            resolve( this.connections )
          },
          reason=>{
            let errorMessage = reason.message
            if( reason.error && reason.error.error ){
              errorMessage = reason.error.error
            }
            alert("ERROR:" + errorMessage)
            reject( reason )
        })
      }
      else{
        resolve( this.connections)
      }
    })  
  } 

}
