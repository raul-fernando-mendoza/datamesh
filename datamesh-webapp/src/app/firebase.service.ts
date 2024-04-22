import { Injectable } from '@angular/core';
import { db } from '../environments/environment'
import { Timestamp as FirebaseTimeStamp, collection, doc, limit, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc, DocumentData, QuerySnapshot, Unsubscribe, DocumentSnapshot, FirestoreError, where, FieldPath, WhereFilterOp, orderBy, QueryConstraint, Query, QueryNonFilterConstraint, startAt, OrderByDirection} from "firebase/firestore"; 
import { Directionality } from '@angular/cdk/bidi';
import { MatSelectChange } from '@angular/material/select';


export interface QryPar {
  collectionPath:string,
  fieldPath?:string|null,
  opStr?:WhereFilterOp|null,
  value?:unknown|null,
  orderByField?:FieldPath|string,
  orderDirection?:OrderByDirection |undefined,
  startAtPage?:number|null,  
  pageSize?:number|null
}

@Injectable({ 
  providedIn: 'root'
})
export class FirebaseService {
  

  constructor() { }


  setDoc(collectionPath:string, id:string, obj:{ [key: string]: any }):Promise<void>{
    obj["createon"] = new Date()
    obj["updateon"] = new Date()
    return setDoc( doc(db, collectionPath , id), obj)
  }
  getdoc( collectionPath:string, id:string):Promise<DocumentSnapshot>{
    return getDoc( doc( db,collectionPath, id ))
  }
  updateDoc( collectionPath:string, id:string, obj:{ [key: string]: any }):Promise<void>{
    obj["updateon"] = new Date()
    return updateDoc( doc(db, collectionPath , id), obj)
  }
  getDocs( collectionPath:string ):Promise<QuerySnapshot<DocumentData>>{
    return new Promise<QuerySnapshot<DocumentData>>((resolve, reject) =>{
      getDocs( query( collection(db, collectionPath) ) ).then( docs =>{
        resolve( docs )
      },
      reason =>{
        alert("ERROR:" + reason)
      })
    })
     
  }

  unique(collectionPath:string,property:string):Promise<Set<string>>{
    return new Promise<Set<string>>((resolve, reject)=>{
      getDocs( collection(db, collectionPath  ) ).then( docSet =>{
        var result = new Set<string>()
        docSet.docs.map( item =>{
          var obj = item.data()
          result.add( obj[property] )
        })
        resolve( result )
      })
    })
  }



  onsnapShotQuery({
    collectionPath,
    fieldPath,
    opStr,
    value,
    orderByField,
    orderDirection,
    startAtPage,
    pageSize
  }:QryPar
    ,observer: {
      next?: (snapshot: any) => void;
      error?: (error: FirestoreError) => void;
      complete?: () => void;
    }
      ):Unsubscribe{

    var q :Query<DocumentData> 
    var queryFilterConstraints: QueryNonFilterConstraint[]  = []
    
    if( orderByField != null ){
      queryFilterConstraints.push(  orderBy(orderByField , orderDirection) )
    }
    if( pageSize != null){
      queryFilterConstraints.push(  limit(pageSize ) )
    }    
    if( startAtPage != null && pageSize != null){
      queryFilterConstraints.push( startAt( (startAtPage-1) * pageSize ) )
    }

    if ( fieldPath != null && opStr!=null && value!=null){
      q = query(collection(db, collectionPath), where(fieldPath, opStr, value), ...queryFilterConstraints)
    }      
    else{
      q = query(collection(db, collectionPath),...queryFilterConstraints); 
    }

    return onSnapshot(q, observer )
     
  }

  onsnapShot(collectionPath:string, id:string, observer: {
    next?: ((snapshot: DocumentSnapshot<DocumentData>) => void) | undefined;
    error?: ((error: FirestoreError) => void) | undefined;
    complete?: (() => void) | undefined;
  }):Unsubscribe{
    return onSnapshot( doc( db,collectionPath, id), observer )  
  }

  onChange(event:any, collectionPath:string, id:string|null, propertyName:string){
    var value:any = event.target.value      
    var values:any = {}
    values[propertyName]=value 
    values["updateon"] = new Date()
    if( id ){
      updateDoc( doc( db, collectionPath, id), values ).then( ()=>{
        console.log("update property")
      },
      error => {
        alert("Error: updating document:" + collectionPath + "/" + id)
      })
    }
  }
  onCheckboxChange(event:any, collectionPath:string, id:string|null, propertyName:string){
    var value:boolean = event.checked     
    var values:any = {}
    values[propertyName]=value   
    values["updateon"] = new Date()
    if( id ){
      updateDoc( doc( db, collectionPath, id), values ).then( ()=>{
        console.log("update property")
      })
    }
  }  
  onArrayCheckboxChange(event:any, collectionPath:string, id:string|null, array:any, propertyName:string, index:number, key:string){
    var value:boolean = event.checked     
    var values:any = {}
    array[index][key] = value
    values[propertyName]=array   
    values["updateon"] = new Date()
    if( id ){
      updateDoc( doc( db, collectionPath, id), values ).then( ()=>{
        console.log("update property")
      },
      reason =>{
        alert("ERROR update arraycheckbox:" + reason)
      })
    }
  }   
  onSelectionChange(event:MatSelectChange, collectionPath:string, id:string|null, propertyName:string){
    var value = event.source.ngControl.value  
    var values:any = {}
    if( value == undefined ){
      values[propertyName]=null     
    }
    else values[propertyName]=value  
    values["updateon"] = new Date() 
    if( id ){
      updateDoc( doc( db, collectionPath, id), values ).then( ()=>{
        console.log("update property")
      },
      reason=>{
        alert("ERROR:" + reason)
      })
    }
  }  

  deleteDoc(collectionPath:string, id:string):Promise<void>{
    return deleteDoc( doc( db, collectionPath, id )).then( () =>{
      console.log("remove successful")
    },
    reason =>{
      alert("ERROR removing:" + reason)
    })
  }

  getDate( t:FirebaseTimeStamp ):Date{
   let d:Date = t.toDate()
    return d
  }  
   
}
