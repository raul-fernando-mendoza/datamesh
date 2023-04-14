import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComparisonEditComponent } from './comparison-edit/comparison-edit.component';
import { ComparisonExecuteComponent } from './comparison-execute/comparison-execute.component';
import { ComparisonListComponent } from './comparison-list/comparison-list.component';
import { DatasetCreateComponent } from './dataset-create/dataset-create.component';
import { DatasetListComponent } from './dataset-list/dataset-list.component';
import { DatasetgroupEditComponent } from './datasetgroup-edit/datasetgroup-edit.component';
import { WelcomeComponent } from './welcome/welcome.component';

const routes: Routes = [
  { path: 'Dataset-edit/:id', component:DatasetCreateComponent }, 
  { path: 'Comparison-edit', component: ComparisonEditComponent},
  { path: "Comparison-execute", component: ComparisonExecuteComponent},
  { path: "DatasetGroup-edit", component: DatasetgroupEditComponent},
  { path: '**', component: WelcomeComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
