import { Component, OnDestroy, OnInit,  signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule} from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { MatMenuModule} from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { AuthService } from 'app/auth.service';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from 'environments/environment';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.css'],
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        RouterModule,
        MatMenuModule,
        MatToolbarModule
    ]
})
export class NavigationComponent implements OnInit, OnDestroy {
  isLoggedIn = signal(false)
  userEmail = signal<String|null>(null)
  authUnsubscribe = onAuthStateChanged( auth, (user) => {
    if( auth.currentUser ){
      this.isLoggedIn.set(true);
      this.userEmail.set(auth.currentUser.email)
    }
    else{
      this.isLoggedIn.set(false);
      this.userEmail.set(null)
    }
  })        




  constructor(
    private authService:AuthService,
    private router:Router
    ) { 
 
  }
  ngOnInit(): void {

  }
  ngOnDestroy() {
    this.authUnsubscribe()
  }
  onLogOut(){
    this.authService.logout().then( ()=>{
      this.router.navigate(["/"])
    })
  }

}
