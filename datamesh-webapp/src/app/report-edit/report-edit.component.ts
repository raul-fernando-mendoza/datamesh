import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder,  FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FirebaseService } from 'app/firebase.service';
import { StringUtilService } from 'app/string-util.service';
import { UrlService } from 'app/url.service';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../environments/environment'
import * as uuid from 'uuid';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTreeModule} from '@angular/material/tree';
import { MatMenuModule } from '@angular/material/menu';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPlaceholder, CdkDragPreview, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DaoService } from 'app/dao.service';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { AuthService } from 'app/auth.service';
import { AngularSplitModule, SplitAreaComponent, SplitComponent } from 'angular-split';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule} from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';



interface FoodNode {
  label: string;
  collection: string
  children?: any[];
}
const EXAMPLE_DATA: FoodNode[] = [
  {
    label: 'report',
    collection:"Report",
    children: [
      { 
        label: 'Metrics', 
        collection:"ReportComponent",
        children:[
          {
            label:"CustomerChargeback",
            collection:"Entity",
            children:[
              {
                id:uuid.v4(),
                label:"CustomersChargeback",
                collection:"Metric",
                columns: ["customer_id",],
                aggColumns: ["chargeback_date"]                
              },
              {
                id:uuid.v4(),
                label:"CustomersWithPTCount",
                collection:"Metric",
                columns: ["customer_id","customer_name"],
                aggColumns:["cnt_pts"]                  
              },
            ]
          },
          {
            label:"Subscription",
            collection:"Entity",
            children:[
              {
                id:uuid.v4(),
                label:"SubscriptionCurrentStatus",
                collection:"Metric",
                columns:["subscription_id"],
                aggColumns:["last_status"]                
              },
              {
                id:uuid.v4(),
                label:"SubscriptionLastCheckin",
                collection:"Metric",
                columns:["subscription_id"],
                aggColumns:["last_checkin"]
              },
            ]
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

//this is single metric
class Metric{
  id:String =  uuid.v4()
  collection = "Metric"
  label!:String
  columns!:String[]
  aggColumns!:string[]
}
//a widget contains a Metric or multiple metrics
//when adding more than one metric to a widget the metrics are merged
class Widget{
  id = uuid.v4()
  metrics:Metric[] = []
  columns:String[] = []
  aggColumns:String[] = []
}
//a section can add more than one Widget
class Section {
  id = uuid.v4()
  widgets:Widget[] = [] 
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
        CdkDropListGroup, CdkDrag, CdkDropList,  CdkDragPlaceholder, CdkDragPreview,  CdkDragHandle,
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

  m1:Metric = {
    id: uuid.v4(),
    collection:"Metric",
    label: "Clubs",
    columns: ["club_id","club_name"],
    aggColumns: ["cnt"]
  }
  m2:Metric = {
    id: uuid.v4(),
    collection:"Metric",
    label: "Members",
    columns: ["member_id","club_id"],
    aggColumns: ["cnt"]
  }
  
  w:Widget = {
    id: uuid.v4(),
    metrics: [this.m1, this.m2],
    columns: [],
    aggColumns: []
  }
  

  s:Section = {
    id: uuid.v4(),
    widgets: [this.w]
  }
  sections = signal<Section[]>([this.s]); 
  
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
  dropMetric(event: CdkDragDrop<Metric[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      event.container.data.splice( event.currentIndex, 0, event.item.data)
    } 
    //this.done.push( event.item.data )
  }


  acceptMetric(drag: CdkDrag, drop: CdkDropList) {
    let item = drag.data
    if( item && item["collection"] == "Metric"){
      let arr:Metric[] = drop.data as Metric[] 
      let i = arr.findIndex( e => item.id == e.id)
      if( i < 0  ){
        return true  
      }
      
    }
    return false //drag.data.startsWith("G") ;
  } 
  
  deleteMetric(w:Widget, m:Metric){
    let idx = w.metrics.findIndex( e => e.id == m.id)
    w.metrics.splice( idx, 1)
  }

  onAddSection(){

    let w:Widget = {
      id: uuid.v4(),
      metrics: [],
      columns: [],
      aggColumns: []
    } 
    let s:Section = {
      id: uuid.v4(),
      widgets: [w]
    }

    let sections:Section[] = this.sections()
    sections.push(s)
    this.sections.set(sections)
  }
  deleteSection(s:Section){
    let sections:Section[] = this.sections()
    let idx = sections.findIndex( e => e.id = s.id)
    sections.splice( idx, 1)
    this.sections.set( sections )
  }

  getWidgetCols(w:Widget){
    // Final array to store all elements
    const mergedArray: String[] = [];

    // Append each array's elements using forEach
    w.metrics.forEach(metric => {
      mergedArray.push( ... metric.columns);
    });    

    // Append each array's elements using forEach
    w.metrics.forEach(metric => {
      mergedArray.push( ... metric.aggColumns);
    });    
    return [...new Set(mergedArray.flat())];
  }
}
