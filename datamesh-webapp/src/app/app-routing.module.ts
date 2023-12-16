import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComparisonEditComponent } from './comparison-edit/comparison-edit.component';
import { ComparisonExecuteComponent } from './comparison-execute/comparison-execute.component';
import { ComparisonGroupEditComponent } from './comparisongroup-edit/comparisongroup-edit.component';
import { ConnectionEditComponent } from './connection-edit/connection-edit.component';
import { DatasetEditComponent } from './dataset-edit/dataset-edit.component';
import { DatasetgroupEditComponent } from './datasetgroup-edit/datasetgroup-edit.component';
import { SqlJupiterDocComponent } from './sql-jupiter-doc/sql-jupiter-doc.component';
import { WelcomeComponent } from './welcome/welcome.component';

const routes: Routes = [ 
  
  { path: 'datasetgroup/:groupCollection/create', component:DatasetgroupEditComponent }, 
  { path: 'datasetgroup/:groupCollection/edit/:id', component:DatasetgroupEditComponent }, 

  { path: 'SqlJupiterDoc/create/:groupId', component:SqlJupiterDocComponent },
  { path: 'SqlJupiterDoc/edit/:id', component:SqlJupiterDocComponent },
  
  { path: 'Dataset/create/:groupId', component:DatasetEditComponent },
  { path: 'Dataset/edit/:id', component:DatasetEditComponent }, 
  
  { path: 'Comparison/create/:groupId', component: ComparisonEditComponent},
  { path: 'Comparison/edit/:id', component: ComparisonEditComponent},

  { path: "Comparison/execute/:id", component: ComparisonExecuteComponent},
  { path: "DatasetGroup-edit", component: DatasetgroupEditComponent},

  { path: 'Connection/create/:groupId', component: ConnectionEditComponent},
  { path: 'Connection/edit/:id', component: ConnectionEditComponent},

  //this should be the last one
  { path: '**', component: WelcomeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
