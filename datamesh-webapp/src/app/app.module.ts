import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavigationComponent } from './navigation/navigation.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatasetEditComponent } from './dataset-edit/dataset-edit.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import { ComparisonEditComponent } from './comparison-edit/comparison-edit.component';
import {MatTreeModule} from '@angular/material/tree';
import {MatDividerModule} from '@angular/material/divider';
import { HttpClientModule } from '@angular/common/http';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { ComparisonExecuteComponent } from './comparison-execute/comparison-execute.component';
import {MatTabsModule} from '@angular/material/tabs';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { DatasetTreeComponent } from './dataset-tree/dataset-tree.component';
import { WelcomeComponent } from './welcome/welcome.component';
import {MatCardModule} from '@angular/material/card';
import { DatasetgroupEditComponent } from './datasetgroup-edit/datasetgroup-edit.component';
import { ComparisonGroupEditComponent } from './comparisongroup-edit/comparisongroup-edit.component';
import {MatGridListModule} from '@angular/material/grid-list';
import { NgDragDropModule } from 'ng-drag-drop';
import {MatExpansionModule} from '@angular/material/expansion';
import { SqlJupiterDocComponent } from './sql-jupiter-doc/sql-jupiter-doc.component';
import { SqlJupiterEditComponent } from './sql-jupiter-edit/sql-jupiter-edit.component';
import { TextJupiterComponent } from './text-jupiter/text-jupiter.component'
import { QuillModule } from 'ngx-quill';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    DatasetEditComponent,
    ComparisonEditComponent,
    ComparisonExecuteComponent,
    DatasetTreeComponent,
    WelcomeComponent,
    DatasetgroupEditComponent,
    ComparisonGroupEditComponent,
    SqlJupiterDocComponent,
    SqlJupiterEditComponent,
    TextJupiterComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatSlideToggleModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,  
    MatProgressSpinnerModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    MatTreeModule,
    MatDividerModule,
    MatCheckboxModule,
    MatTabsModule,
    MatProgressBarModule,
    MatCardModule,
    MatGridListModule,
    MatExpansionModule,
    NgDragDropModule.forRoot(),
    QuillModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
