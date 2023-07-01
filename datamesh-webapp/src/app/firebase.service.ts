import { Injectable } from '@angular/core';
import { db } from '../environments/environment'
import {  collection, doc, addDoc, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc, DocumentData, QuerySnapshot, Unsubscribe, DocumentSnapshot, FirestoreError, where, FieldPath, WhereFilterOp, DocumentReference} from "firebase/firestore"; 
import { Directionality } from '@angular/cdk/bidi';
import { MatSelectChange } from '@angular/material/select';


@Injectable({ 
  providedIn: 'root'
})
export class FirebaseService {

  constructor() { }


  setDoc(collectionPath:string, id:string, obj:{ [key: string]: any }):Promise<void>{
    return setDoc( doc(db, collectionPath , id), obj)
  }
  getdoc( collectionPath:string, id:string):Promise<DocumentSnapshot>{
    return getDoc( doc( db,collectionPath, id ))
  }
  updateDoc( collectionPath:string, id:string, obj:{ [key: string]: any }):Promise<void>{
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
  onsnapShotQuery(collectionPath:string, fieldPath: string | FieldPath | null, opStr: WhereFilterOp | null, value: unknown | null
    ,observer: {
      next?: (snapshot: any) => void;
      error?: (error: FirestoreError) => void;
      complete?: () => void;
    }
      ):Unsubscribe{

     
    if ( fieldPath != null && opStr!=null && value!=null){
      var q = query(collection(db, collectionPath), where(fieldPath, opStr, value));    
      return onSnapshot(q, observer ) 
    }
    else{
      var q = query(collection(db, collectionPath)); 
      return onSnapshot(q, observer )    
    }
     
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
    if( id ){
      updateDoc( doc( db, collectionPath, id), values ).then( ()=>{
        console.log("update property")
      })
    }
  }
  onCheckboxChange(event:any, collectionPath:string, id:string|null, propertyName:string){
    var value:boolean = event.checked     
    var values:any = {}
    values[propertyName]=value   
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
    if( id ){
      updateDoc( doc( db, collectionPath, id), values ).then( ()=>{
        console.log("update property")
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
}
