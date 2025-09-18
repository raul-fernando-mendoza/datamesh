import { inject, NgModule } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterModule, RouterStateSnapshot, Routes } from '@angular/router';
import { AuthService } from './auth.service';
import { ComparisonEditComponent } from './comparison-edit/comparison-edit.component';
import { ComparisonExecuteComponent } from './comparison-execute/comparison-execute.component';
import { ComparisonGroupEditComponent } from './comparisongroup-edit/comparisongroup-edit.component';
import { ConnectionEditComponent } from './connection-edit/connection-edit.component';
import { ConnectionList } from './connection-list/connection-list';
import { DatasetEditComponent } from './dataset-edit/dataset-edit.component';
import { DatasetgroupEditComponent } from './datasetgroup-edit/datasetgroup-edit.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { ModelEditComponent } from './model-edit/model-edit.component';
import { ModelList } from './model-list/model-list';
import { SqlJupiterDocComponent } from './sql-jupiter-doc/sql-jupiter-doc.component';
import { TablesTreeComponent } from './tables-tree/tables-tree.component';
import { WelcomeComponent } from './welcome/welcome.component';

export function loginGuard(
  redirectRoute: string
): CanActivateFn {
  return () => {
    const oauthService: AuthService = inject(AuthService);
    const router: Router = inject(Router);
    
    const isFlagEnabled = oauthService.isloggedIn()
    let val = isFlagEnabled || router.createUrlTree([redirectRoute]);
    console.log("Can activate:" + val)
    return isFlagEnabled || router.createUrlTree([redirectRoute]);
  };
}

export function loginGuard2(
  redirectRoute: string
): CanActivateFn {
  return (route:ActivatedRouteSnapshot,state:RouterStateSnapshot) => {
    route.url
    state.url

    const oauthService: AuthService = inject(AuthService);
    const router: Router = inject(Router);
    
    const isloggedIn = oauthService.isloggedIn()      

    if( isloggedIn ){
      return true
    }

    if( route.url.length > 1){
      let parameter1 = route.url[1]
      return router.createUrlTree([redirectRoute + "/" + parameter1])
    }
    else{
      return false
    }      
    
    
  };
}  

const routes: Routes = [ 


  { path:"loginForm/:intendedPath",pathMatch:'full',component:LoginFormComponent},
  { path:"loginForm",pathMatch:'full',component:LoginFormComponent},

  { path: 'connection/list', component:ConnectionList, canActivate: [loginGuard('/loginForm/connection-list')] },

  { path: 'connection/edit/:id', component:ConnectionEditComponent },
  { path: 'connection/new', component:ConnectionEditComponent },
  
  { path: 'model/list', component:ModelList, canActivate: [loginGuard('/loginForm/connection-list')] },
  { path: 'model/edit/:id', component:ModelEditComponent },
  { path: 'model/new', component:ModelEditComponent },

  { path: 'datasetgroup/:groupCollection/create', component:DatasetgroupEditComponent }, 
  
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

  { path: 'Model/create/:groupId', component: ModelEditComponent},
  { path: 'Model/edit/:id', component: ModelEditComponent},
  
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
