import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComparisonEditComponent } from './comparison-edit/comparison-edit.component';
import { ComparisonExecuteComponent } from './comparison-execute/comparison-execute.component';
import { ComparisonGroupEditComponent } from './comparisongroup-edit/comparisongroup-edit.component';
import { DatasetEditComponent } from './dataset-edit/dataset-edit.component';
import { DatasetgroupEditComponent } from './datasetgroup-edit/datasetgroup-edit.component';
import { WelcomeComponent } from './welcome/welcome.component';

const routes: Routes = [
  { path: 'DatasetGroup-create', component:DatasetgroupEditComponent },    
  { path: 'DatasetGroup-edit/:id', component:DatasetgroupEditComponent },   
  { path: 'Dataset-create/:groupId', component:DatasetEditComponent },
  { path: 'Dataset-edit/:id', component:DatasetEditComponent }, 
  
  { path: 'ComparisonGroup-create', component: ComparisonGroupEditComponent},
  { path: 'ComparisonGroup-edit/:id', component: ComparisonGroupEditComponent},
  { path: 'Comparison-create/:groupId', component: ComparisonEditComponent},
  { path: 'Comparison-edit/:id', component: ComparisonEditComponent},
  { path: "Comparison-execute", component: ComparisonExecuteComponent},
  { path: "DatasetGroup-edit", component: DatasetgroupEditComponent},
  { path: '**', component: WelcomeComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes,{
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
