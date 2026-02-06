import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, signal, ViewChild } from '@angular/core';
import {  FormBuilder,  FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JoinNode,    InfoNode, JoinNodeObj } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';
import { StringUtilService } from 'app/string-util.service';
import { UrlService } from 'app/url.service';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../environments/environment'
import * as uuid from 'uuid';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTree, MatTreeModule} from '@angular/material/tree';
import { MatMenuModule } from '@angular/material/menu';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDragPreview, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DaoService } from 'app/dao.service';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { AuthService } from 'app/auth.service';
import { AngularSplitModule, SplitAreaComponent, SplitComponent } from 'angular-split';
import { TablesTreeComponent } from 'app/tables-tree/tables-tree.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule} from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { uuidv4 } from '@firebase/util';
import {MatButtonToggleModule} from '@angular/material/button-toggle';



interface FoodNode {
  name: string;
  collection: string
  children?: FoodNode[];
}
const EXAMPLE_DATA: FoodNode[] = [
  {
    name: 'Entities',
    collection:"EntityGroup",
    children: [
      { 
        name: 'Subscription', 
        collection:"Entity",
        children:[
          {
            name:"Active",
            collection:"Slice"
          },
          {
            name:"Unpaid",
            collection:"Slice"
          }          
        ]  
      }, 
    ],
  }
];

interface IReport{
  id?:string
  reportGroupId?:string
  label?:string
  description?:string
  indexWords?:string[]
  
  owner?:string
  deleted?:boolean
  createon?:Date
  updateon?:Date  
}
class Report implements IReport{
  public static collection = "Report"
  id!:string
  reportGroupId!:string 
  label!:string 
  description:string=""
  owner!:string
  deleted:boolean = false
  indexWords:string[] = []
  createon:Date = new Date()
  updateon:Date = new Date()
}



@Component({
    selector: 'app-report-edit',
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTreeModule,
        MatMenuModule,
        CdkDropListGroup, CdkDrag, CdkDropList,  CdkDragPlaceholder, CdkDragPreview,
        MatProgressBarModule,
        MatExpansionModule,
        MatProgressSpinnerModule,
        RouterModule,
        AngularSplitModule,
        SplitComponent,
        SplitAreaComponent,
        MatSidenavModule,
        MatTabsModule,
        MatListModule,
        MatCheckboxModule,
        MatButtonToggleModule        
    ],
    templateUrl: './report-edit.component.html',
    styleUrl: './report-edit.component.css'
})
export class ReportEditComponent implements OnInit, AfterViewInit{
  
  isLoading = false

  collection = Report.collection
  report = signal<Report>(new Report())
  id:string | null = null
  groupId:string|null = 'default'

  unsubscribe:Unsubscribe | null = null

  FG = this.fb.group({
    label:['',[Validators.required]],
    description:['']
  })  


  dataSource = EXAMPLE_DATA;

  childrenAccessor = (node: FoodNode) => node.children ?? [];

  hasChild = (_: number, node: FoodNode) => !!node.children && node.children.length > 0;

  todo = ['Get to work', 'Pick up groceries', 'Go home', 'Fall asleep'];
  done = ['Get up', 'Brush teeth', 'Take a shower', 'Check e-mail', 'Walk dog'];
  

  movies = [
    'Episode I - The Phantom Menace',
    'Episode II - Attack of the Clones',
    'Episode III - Revenge of the Sith',
    'Episode IV - A New Hope',
    'Episode V - The Empire Strikes Back',
    'Episode VI - Return of the Jedi',
    'Episode VII - The Force Awakens',
    'Episode VIII - The Last Jedi',
    'Episode IX - The Rise of Skywalker',
  ];

  constructor( 
    private fb:FormBuilder 
   ,private stringUtilService:StringUtilService
   ,private activatedRoute:ActivatedRoute
   ,private router:Router
   ,public firebaseService:FirebaseService
   ,private urlService:UrlService
   ,private dao:DaoService
   ,private dialog: MatDialog
   ,private authService:AuthService
   ){
     this.activatedRoute.params.subscribe(res => {
      if("groupId" in res){
          this.groupId = res["groupId"]
      }      
      if("id" in res){
        if( this.id && this.id != res["id"]){
         this.id = res["id"]
         if( this.unsubscribe )
          this.unsubscribe()
         this.update()
        }
        else{
          this.id = res["id"]
        }
      }  
     }) 
    
  }  
  ngAfterViewInit(): void {
    console.log("after view init")
  }
  ngOnInit() {

    this.update()
  }    

  update(){
    if( this.unsubscribe ){
      this.unsubscribe()
    }
    
    if( this.id && this.id != 'new' ){
      this.unsubscribe = onSnapshot( doc( db, this.collection, this.id ),
          (docRef) =>{
                if( docRef.exists()){
                  let report=docRef.data() as Report

                  this.report.set(report)

                  this.FG.controls.label.setValue( report.label!)
                  
                }
          },
          (reason:any) =>{
              alert("ERROR update comparison list:" + reason)
          }  
      )
    }
  }
   
  onDelete(){
    if(this.id && this.report()){
      if( confirm("are you sure to delete:" + this.report()!.label) ){
        this.firebaseService.deleteDoc(this.collection, this.id ).then( ()=>{
          this.router.navigate(["/"])
        })
      }
    }
  }  
  onSubmit(){
    if( this.id == 'new' ){
      this.onNew()
    }
    else{
      this.save()
    }
  }
  onNew():Promise<void>{
    //create new
    let report:Report = {
      id: uuid.v4(),
      reportGroupId:this.groupId!,
      label: this.FG.controls.label.value!,
      description: '',
      owner: this.authService.getUserUid()!,
      deleted: false,
      indexWords: [],
      updateon: new Date(),
      createon: new Date(),      
    }
    return this.firebaseService.setDoc( this.collection, report.id, report).then( () =>{
      this.id = report.id
      this.router.navigate(['ReportGroup',this.groupId,"Report",this.id])
    },
    error=>{
      alert("Error: model new" + error)
    })
  }
  save(){
    if( this.report() ){
      this.firebaseService.updateDoc( this.collection, this.report()!.id, this.report())
    }
  }

  onCancel(){
    this.router.navigate(["/"])
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
  dropTarget(event: CdkDragDrop<string[]>) {

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      event.container.data.splice( event.currentIndex, 0, event.item.data)
    } 
    //this.done.push( event.item.data )
  }


  acceptPredicate(drag: CdkDrag, drop: CdkDropList) {
    return true //drag.data.startsWith("G") ;
  }    

}
