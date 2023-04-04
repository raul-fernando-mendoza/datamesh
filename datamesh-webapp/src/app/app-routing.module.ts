import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComparisonEditComponent } from './comparison-edit/comparison-edit.component';
import { ComparisonExecuteComponent } from './comparison-execute/comparison-execute.component';
import { ComparisonListComponent } from './comparison-list/comparison-list.component';
import { DatasetListComponent } from './dataset-list/dataset-list.component';

const routes: Routes = [
  { path: 'Datasets', component: DatasetListComponent },
  { path: 'Comparison-list', component: ComparisonListComponent },
  { path: 'Comparison-edit', component: ComparisonEditComponent},
  { path: "Comparison-execute", component: ComparisonExecuteComponent},
  { path: '**', component: ComparisonListComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
