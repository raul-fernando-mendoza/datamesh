import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Observable, Subject } from 'rxjs';
import { User, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, signInAnonymously, createUserWithEmailAndPassword, UserCredential,sendEmailVerification,getIdToken,getIdTokenResult, sendPasswordResetEmail, signOut, setPersistence, browserSessionPersistence, onAuthStateChanged} from "firebase/auth";
import { auth } from '../environments/environment';





@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loginSubject : Subject<any>;
  constructor(
  ) { 
    this.loginSubject = new Subject<any>();
  }
  
  register(email:string,password:string):Promise<User> {
    return new Promise( (resolve, reject) =>{
      
      setPersistence(auth, browserSessionPersistence).then(() => {
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential:UserCredential) => {
          // Signed in 
          var user = userCredential.user;
          console.log(user.uid)
          
          sendEmailVerification(userCredential.user).then(() => {
            alert("Un email de verificacion ha sido enviado a su email:" + user.email)
            resolve(user)
            })
          .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            alert("error sending the confirmation email:" + errorCode + " " + errorMessage)
            reject(error)
          });      
        })
        .catch((error) => {
          var errorCode = error.code;
          var errorMessage = error.message;
          alert("ERROR registering user:" + error)
          reject(error)
        });
      })
    })  
  }  

  getUserInfo(userCredentials:UserCredential):Promise<{}>{
    var _resolve:any
    var _reject:any
    return new Promise<User>((resolve, reject) => {
      _resolve = resolve
      _reject = reject
    
      let user = userCredentials.user;
      
      if( user != null ){
        console.log("user.email" + user.email)
        console.log("user.uid:" + user.uid)
        
    
        //now get the id token
        getIdToken(user, true).then(idToken => {
          //now get the roles
          getIdTokenResult(user).then((idTokenResult) => {
            console.log(idTokenResult.claims)

            var claims = JSON.parse(JSON.stringify(idTokenResult.claims))
            _resolve(claims)
          })
          .catch((error) => {
          console.error("error retriving claims"+ error);
          _reject(error)
          });         
        }).catch(function(error) {
          console.error("the id token could not be retrieved")
          _reject(error)
        });
      }
      else{
        _reject("user not found")
      }
    });
  }

  loginAnonymously():Promise<User>{
    return new Promise<User>((resolve, reject) => {
      setPersistence(auth, browserSessionPersistence).then(() => {

        signInAnonymously(auth).then(userCredentials => {
          return this.getUserInfo(userCredentials)
      
        })
        .catch( error =>{
          alert("Error in loging:" + error.code + " " + error.message)
        })
      })
    })
  }


  loginWithEmail(email:string, password:string):Promise<User>{
    return new Promise<User>((resolve, reject) => {

      setPersistence(auth, browserSessionPersistence).then(() => {
        signInWithEmailAndPassword(auth, email, password).then(userCredentials => {
          resolve(userCredentials.user)
        })
        .catch( error =>{
          console.error("Error in loging:" + error.code + " " + error.message)
          reject(error)
        })
      })
  
    })
     


  }  

  


  signInWithPopup():Promise<User>{
    return new Promise<User>((resolve, reject)=>{
   
      var provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      signInWithPopup(auth, provider).then(userCredentials => {
        return this.getUserInfo(userCredentials)
      })
      .catch( error =>{
        alert("Error in loging with popup:" + error)
      })
    })  
  }



  sendEmailLink(){
    if( auth.currentUser ){
      sendEmailVerification(auth.currentUser).then(function(result) {
        alert("email sent")
      },
      function(reason:any){
        alert("ERROR send email de verificacion:" + reason)
      });
    }
  }

  sendPasswordResetEmail(email:string):Promise<void>{
    return sendPasswordResetEmail(auth, email)
  }

  logout():Promise<void>{
    return new Promise( (resolve, reject)=>{
/*
      let unsubscribe = auth.onAuthStateChanged( user =>{
        auth.currentUser
        if( !user ){
          unsubscribe()
          resolve()
        }
      })
*/
      signOut(auth).then( ()=>{
        auth.currentUser
        resolve()
      },
      reason=>{
        reject(reason)
      })
    })
  }

  LoginEvent(user: any): void {
    this.loginSubject.next(user);
  }

  onLoginEvent(): Observable<any> {
      return this.loginSubject;
  } 

  isAnonymous(): boolean{
    if( auth.currentUser && auth.currentUser.isAnonymous ){
      return true;
    }
    else return false
  }

  hasRole(role:string):Promise<boolean>{
    return new Promise<boolean>((resolve, reject)=>{
      if( auth.currentUser != null){
        getIdTokenResult(auth.currentUser).then((idTokenResult) => {
          console.log(idTokenResult.claims)

          var claims = JSON.parse(JSON.stringify(idTokenResult.claims))
          if ( claims["role"] = true )
            resolve(true)
          else
            resolve(false)
        },
        reason =>{
          alert("error obtaining claims")
        })
      }
      else{
        resolve(false)
      }
    })
  }
  getUserUid():string|null{
    return (auth.currentUser)?auth.currentUser.uid:null
  }  
  getUserEmail():string|null{
    return (auth.currentUser)?auth.currentUser.email:null
  }
  getClaims():Promise<{[key: string]: any}>{
    return new Promise<{[key: string]: any}>((resolve, reject)=>{
      if( auth.currentUser ){
        getIdTokenResult(auth.currentUser).then((idTokenResult) => {
          console.log(idTokenResult.claims)
          var claims = JSON.parse(JSON.stringify(idTokenResult.claims))
          resolve(claims)
        },
        reason =>{
          reject("ERROR")
        })
      }
    })
  }
  getDisplayNameForUser(user:User):Promise<string>{
    return new Promise<string>((resolve, reject)=>{
      if(user!=null){
        this.getClaims().then( claims =>{
          if(claims && claims["displayName"]){

            if( typeof(claims["displayName"]) == 'string'){
              var displayName = claims["displayName"]
              resolve(displayName)
            }
            
          } 
          else if( user.displayName ){
            resolve( user.displayName )
          }
          else if( user.email != null ) {
            resolve( user.email )
          }
        })
      }
    })
  }
  getDisplayName():Promise<string>{
    return new Promise<string>((resolve, reject)=>{
      if( auth.currentUser ){
        this.getDisplayNameForUser( auth.currentUser ).then( 
          userName =>{
            resolve(userName)
          }
          ,reason=>{
            alert("error retriving display name")
        })
      }
      else resolve("unknown")
    })
  }



  isloggedIn(){
    return (auth.currentUser != null)?true:false
  }   

  isEmailVerified(){
    return (auth.currentUser)?auth.currentUser.emailVerified:false
  }


}
