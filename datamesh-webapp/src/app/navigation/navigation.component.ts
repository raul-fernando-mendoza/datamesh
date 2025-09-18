import { Component, OnDestroy, OnInit, Query, QueryList, signal, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSidenavModule} from '@angular/material/sidenav';
import { Router, RouterModule } from '@angular/router';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatTreeModule} from '@angular/material/tree';
import { DatasetTreeComponent } from 'app/dataset-tree/dataset-tree.component';
import {MatMenuModule} from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import {CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropListGroup} from '@angular/cdk/drag-drop'
import {OverlayModule, Overlay, OverlayRef} from '@angular/cdk/overlay';
import {TemplatePortal} from '@angular/cdk/portal';
import { MatListModule } from '@angular/material/list';
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
        MatToolbarModule,
        MatSidenavModule,
        RouterModule,
        MatExpansionModule,
        MatTreeModule,
        DatasetTreeComponent,
        MatMenuModule,
        OverlayModule,
        MatListModule
    ]
})
export class NavigationComponent implements OnInit, OnDestroy {
  @ViewChild(TemplateRef) _dialogTemplate!: TemplateRef<any> ;
  private _portal!: TemplatePortal ;
  private _overlayRef!: OverlayRef ;

  isLoggedIn = signal(false)
  authUnsubscribe = onAuthStateChanged( auth, (user) => {
    if( auth.currentUser ){
      this.isLoggedIn.set(true);
    }
    else{
      this.isLoggedIn.set(false);
    }
  })        

  isOpen = false;

  todo = [
    'Get to work',
    'Pick up groceries',
    'Go home',
    'Fall asleep'
  ];

  done = [
    'Get up',
    'Brush teeth',
    'Take a shower',
    'Check e-mail',
    'Walk dog'
  ];

   isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver, 
    private _overlay: Overlay, 
    private _viewContainerRef: ViewContainerRef,
    private authService:AuthService,
    private router:Router
    ) {   
  }
  ngOnInit(): void {

  }

  drop(event: CdkDragDrop<string[]>) {
   
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }
  }

  dragStarted(event: any) {
      console.log(event)
    }
    
    dragStopped(event: any) {
      console.log(event)
    }

  ngAfterViewInit() {
    this._portal = new TemplatePortal(this._dialogTemplate, this._viewContainerRef);
    this._overlayRef = this._overlay.create({
      positionStrategy: this._overlay.position().global().centerHorizontally().centerVertically(),
      hasBackdrop: true
    });
    this._overlayRef.backdropClick().subscribe(() => this._overlayRef.detach());
  }

  ngOnDestroy() {
    this._overlayRef.dispose();
    this.authUnsubscribe()
  }

  openDialog() {
    this._overlayRef.attach(this._portal);
  }  

  onLogOut(){
    this.authService.logout().then( ()=>{
      this.router.navigate(["/"])
    })
  }

}
