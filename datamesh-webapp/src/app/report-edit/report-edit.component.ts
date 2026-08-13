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
        label: 'model', 
        collection:"ReportComponent",
        children:[
          {
            label:"CustomerChargeback",
            collection:"Entity",
            children:[
              {
                id:uuid.v4(),
                label:"CustomersChargeback",
                collection:"model",
                columns: ["club_id", "customer_id",],
                aggColumns: ["chargeback_date"]                
              },
              {
                id:uuid.v4(),
                label:"CustomersWithPTCount",
                collection:"model",
                columns: ["club_id","club_name"],
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
                collection:"model",
                columns:["subscription_id"],
                aggColumns:["last_status"]                
              },
              {
                id:uuid.v4(),
                label:"SubscriptionLastCheckin",
                collection:"model",
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
  sections?:any[]
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

//this is single model
class model{
  id:string =  uuid.v4()
  collection = "model"
  label!:string
  columns!:string[]
  aggColumns!:string[]
}

class Column{
  id!:string
  selected:boolean = false
}

//a widget contains a model or multiple model
//when adding more than one model to a widget the model are merged
class Widget{
  id = uuid.v4()
  model:model[] = []
  columns:string[] = []
  columnsSelected:string[] = []
  aggColumns:string[] = []
  filterActive:boolean = false
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

  m1:model = {
    id: uuid.v4(),
    collection:"model",
    label: "Clubs",
    columns: [],
    aggColumns: []
  }
  m2:model = {
    id: uuid.v4(),
    collection:"model",
    label: "Members",
    columns: [],
    aggColumns: []
  }
  
  w:Widget = {
    id: uuid.v4(),
    model: [this.m1, this.m2],
    columns: [],
    columnsSelected: [],
    aggColumns: [],
    filterActive: false
  }
  

  s:Section = {
    id: uuid.v4(),
    widgets: [this.w]
  }
  sections = signal<Section[]>([]);
  private sectionsLoaded = false;
  
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
    this.sectionsLoaded = false;

    if( this.id && this.id != 'new' ){
      this.unsubscribe = onSnapshot( doc( db, this.collection, this.id ),
          (docRef) =>{
                if( docRef.exists()){
                  let report = docRef.data() as IReport

                  this.report.set(report as Report)
                  this.FG.controls.label.setValue( report.label!)

                  if (!this.sectionsLoaded) {
                    this.sectionsLoaded = true;
                    if (report.sections && report.sections.length > 0) {
                      this.sections.set(report.sections as Section[]);
                    }
                  }
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
  addmodelColumns(w:Widget, m:model){
    if (w.model.length === 1) {
      // m is the first model: copy all its columns and aggColumns
      w.columns = [...m.columns];
      w.aggColumns = [...m.aggColumns];
      w.columnsSelected = [...m.columns, ...m.aggColumns];
    } else {
      // Multiple model: keep only columns shared by all model in the widget
      w.columns = w.model.reduce((shared, model) => {
        return shared.filter(col => model.columns.includes(col));
      }, [...w.model[0].columns]);

      const allAggColumns: string[] = [];
      w.model.forEach(model => {
        model.aggColumns.forEach(col => {
          if (!allAggColumns.includes(col)) {
            allAggColumns.push(col);
          }
        });
      });
      w.aggColumns = allAggColumns;
      w.columnsSelected = [...w.columns, ...w.aggColumns];
    }
  }

  toggleFilter(w: Widget) {
    w.filterActive = !w.filterActive;
    this.sections.set([...this.sections()]);
  }

  visibleColumns(w: Widget): string[] {
    return w.filterActive ? w.columns.filter(c => w.columnsSelected.includes(c)) : w.columns;
  }

  visibleAggColumns(w: Widget): string[] {
    return w.filterActive ? w.aggColumns.filter(c => w.columnsSelected.includes(c)) : w.aggColumns;
  }

  toggleColumn(w: Widget, col: string) {
    const idx = w.columnsSelected.indexOf(col);
    if (idx >= 0) {
      w.columnsSelected.splice(idx, 1);
    } else {
      w.columnsSelected.push(col);
    }
    this.sections.set([...this.sections()]);
    this.saveSections();
  }

  saveSections() {
    if (this.id && this.id !== 'new') {
      this.firebaseService.updateDoc(this.collection, this.id, { sections: this.sections() });
    }
  }  
  dropColumns(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }   
  }

  findWidgetFormodel(m:model):Widget|null{
    let widget:Widget|null = null 
    this.sections().forEach(s => {
      s.widgets.forEach( w =>{
        w.model.forEach( e => {
          if( e.id == m.id ){
            widget = w
          }
        });
      })
    })
    return widget
  }

  dropmodel(event: CdkDragDrop<model[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
     event.container.data.splice( event.currentIndex, 0, event.item.data)
      let w = this.findWidgetFormodel( event.item.data )  
      if( w ){
        let m:model = event.item.data as model
        this.addmodelColumns( w, m)
      }      
    } 
    //this.done.push( event.item.data )
  }


  acceptmodel(drag: CdkDrag, drop: CdkDropList) {
    let item = drag.data
    if( item && item["collection"] == "model"){
      let arr:model[] = drop.data as model[] 
      let i = arr.findIndex( e => item.id == e.id)
      if( i < 0  ){
        return true  
      }
      
    }
    return false //drag.data.startsWith("G") ;
  } 
  
  deletemodel(w:Widget, m:model){
    let idx = w.model.findIndex( e => e.id == m.id)
    w.model.splice( idx, 1)

    if (w.model.length === 0) {
      w.columns = [];
      w.columnsSelected = [];
      w.aggColumns = [];
    } else {
      this.addmodelColumns(w, w.model[0]);
      w.columnsSelected = w.columnsSelected.filter(col => w.columns.includes(col));
    }
  }

  onAddSection(){

    let w:Widget = {
      id: uuid.v4(),
      model: [],
      columns: [],
      columnsSelected: [],
      aggColumns: [],
      filterActive: false
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


}
