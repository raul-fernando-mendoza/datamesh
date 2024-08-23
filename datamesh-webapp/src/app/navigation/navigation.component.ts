import { Component, Query, QueryList, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSidenavModule} from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatTreeModule} from '@angular/material/tree';
import { DatasetTreeComponent } from 'app/dataset-tree/dataset-tree.component';
import {MatMenuModule} from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { TablesTreeComponent } from 'app/tables-tree/tables-tree.component';
import {CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropListGroup} from '@angular/cdk/drag-drop'
import {OverlayModule, Overlay, OverlayRef} from '@angular/cdk/overlay';
import {TemplatePortal} from '@angular/cdk/portal';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  standalone: true,
  imports:[ 
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
    TablesTreeComponent,
    CdkDropList, CdkDrag, CdkDropListGroup,
    OverlayModule
  ]   
})
export class NavigationComponent {
  @ViewChild(TemplateRef) _dialogTemplate!: TemplateRef<any> ;
  private _portal!: TemplatePortal ;
  private _overlayRef!: OverlayRef ;

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
    private _viewContainerRef: ViewContainerRef) {   
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
  }

  openDialog() {
    this._overlayRef.attach(this._portal);
  }  

}
