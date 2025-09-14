import { AfterViewInit, APP_INITIALIZER, Component, ElementRef, Injectable, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule} from '@angular/material/divider'; 
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { onAuthStateChanged, Unsubscribe } from 'firebase/auth';
import { auth } from '../../environments/environment';

declare var grecaptcha: any;

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule
  ]    
  ,providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
  ]
})
export class LoginFormComponent implements OnInit,OnDestroy{

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  loginForm = this.fb.group({
    username: ['raul_fernando_mendoza@hotmail.com', Validators.required],
    password: [null, Validators.required]
  });
  
  isRegister = false
  hide = true;

  token: string|undefined;

  intendedPath
 
  unsubscribe:Unsubscribe | undefined

  private subscription: Subscription|null = null;

 

  addedStyle:HTMLStyleElement|null = null

  constructor(
    private breakpointObserver: BreakpointObserver,
    private fb: UntypedFormBuilder, 
    private route: ActivatedRoute, 
    private router: Router, 
    private authSrv:AuthService,
    ) {
      
      this.isRegister = ( this.route.snapshot.paramMap.get('isRegister') == "true" )
      this.token = undefined;
      if( this.route.snapshot.paramMap.get('intendedPath') ){
        this.intendedPath = this.route.snapshot.paramMap.get('intendedPath')
      }
      
  }
  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }    
  }

  ngOnInit() {
    this.unsubscribe = onAuthStateChanged( auth, (user) => {
      if( auth.currentUser ){
        console.log("login current user:" + auth.currentUser)
        if( this.intendedPath ) {
          this.navigateIntended()
        }
        else{
          this.router.navigate(["/"])
        }
      }
    })  
  }
  navigateIntended(){
    if( this.intendedPath ){
      let url:string = decodeURIComponent( this.intendedPath )
      this.router.navigate(["/" + url]);    
    }
  }
  onLoginWithEmail(){
    if( this.loginForm.valid ){
      var user = this.loginForm.controls["username"].value
      var password = this.loginForm.controls["password"].value

      this.authSrv.loginWithEmail(user, password).then( (user) =>{
        console.log( "email:" + user.email )
      },
      reason => {
        alert("ERROR: onLoginWithEmail " + reason)
      })
    }
    else{
      let msg =  "ERROR: usuario o password son incorrectos"
      alert( msg )
    }
      
  }

  onRegister(){
    if( this.loginForm.valid ){
      var userName = this.loginForm.controls["username"].value
      var password = this.loginForm.controls["password"].value
      this.authSrv.register(userName, password).then( user =>{
        //do not navigate here use the listener 
        console.log("email:" + user.email)
      })  
    }
    else{
      let msg =  "ERROR: usuario o password son incorrectos"
      alert( msg )
    }        
  }
  onLogout(){
    //alert("going to call login with Logout")
    this.authSrv.logout()
  }
  onPasswordResetEmail(){
    this.router.navigate(['/password-reset-email']);
  }
  signInWithPopup() {
    //alert("going to call login with Login popup")
    this.authSrv.signInWithPopup().then( (User) =>{
      console.log("signed out completed")
    })
  } 
  Register(){
    if( this.intendedPath ){
      this.router.navigate(['/registerForm',this.intendedPath, {"isRegister":true}])
    }
    else{
      this.router.navigate(['/registerForm', {"isRegister":true}])  
    }
    
  }        
}
