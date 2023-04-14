
import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';
import { Comparison, ComparisonGroup, Dataset, DatasetGroup, FileDataset, SnowFlakeDataset } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { FirestoreError } from 'firebase/firestore';


/**
 * Node for to-do item
 */
export interface ComparisonNode {
  children: ComparisonNode[];
  item: Comparison | ComparisonGroup;
}




/** Flat to-do item node with expandable and level information */
export interface ComparisonFlatNode {
  item: Comparison | ComparisonGroup
  level: number
  expandable: boolean
}


/**
 * @title Tree with checkboxes
 */
@Component({
  selector: 'app-comparison-tree',
  templateUrl: './comparison-tree.component.html',
  styleUrls: ['./comparison-tree.component.css']
})
export class ComparisonTreeComponent implements OnInit, OnDestroy {
  unsubscribeMap:Map<string, any> = new Map<string,any>()
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeToNode = new Map<ComparisonFlatNode, ComparisonNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nodeToFlatNode = new Map<ComparisonNode, ComparisonFlatNode>();

  treeControl: FlatTreeControl<ComparisonFlatNode>;

  treeFlattener: MatTreeFlattener<ComparisonNode, ComparisonFlatNode>;

  dataSource: MatTreeFlatDataSource<ComparisonNode, ComparisonFlatNode>;

  _database = new BehaviorSubject<ComparisonNode[]>([]);
  constructor(
    private firebaseService:FirebaseService,
    private router:Router,
    private route: ActivatedRoute
  ) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren,
    );
    this.treeControl = new FlatTreeControl<ComparisonFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this._database.subscribe(data => {
      this.dataSource.data = []
      this.dataSource.data = data;
    });
  }
  ngOnDestroy(): void {
    this.unsubscribeMap.forEach( (key:string, unsubscribe:any) =>{
      unsubscribe();
    })
  }
  ngOnInit(): void {
    this.update()
  }

  getLevel = (node: ComparisonFlatNode) => node.level;

  isExpandable = (node: ComparisonFlatNode) => node.expandable;

  getChildren = (node: ComparisonNode): ComparisonNode[] => node.children!;

  hasChild = (_: number, _nodeData: ComparisonFlatNode) => _nodeData.expandable;

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: ComparisonNode, level: number) => {
    const existingNode = this.nodeToFlatNode.get(node);
    if( existingNode && existingNode.item.id === node.item.id ){
      var flatNode:ComparisonFlatNode = existingNode
    }
    else{
      var flatNode:ComparisonFlatNode = {
        item: node.item,
        level: level,
        expandable: ( node.item instanceof ComparisonGroup)
      }
    }
    this.flatNodeToNode.set(flatNode, node);
    this.nodeToFlatNode.set(node, flatNode);
    return flatNode;
  };


  addGroup() {
    this.router.navigate(["/ComparisonGroup-edit"])
  }

  onAddComparison(node:ComparisonNode){
    let comparisonGroup = node.item as ComparisonGroup

    this.router.navigate(["/Comparison-create",comparisonGroup.id])
  }

  isComparisonGroup(node:ComparisonNode){
    if( node.item instanceof ComparisonGroup ){
      return true
    }
    else{
      return false
    }
  }
  update(){
    this.unsubscribeMap.forEach( (key:string,unsubscribe:any) =>{
      unsubscribe()
    })
    this.unsubscribeMap.clear()    
    let unsubscribe = this.firebaseService.onsnapShotQuery("ComparisonGroup",null, null, null,{
      "next":( (set:any)=>{
        var comparisonGroupNodes:ComparisonNode[] = []

        var transactions = set.docs.map( (item:any) =>{
          var comparisonGroup = item.data() as ComparisonGroup
          let datasetNode:ComparisonNode = {
            children: [],
            item: comparisonGroup
          }
          comparisonGroupNodes.push( datasetNode )
          return this.loadComparisonForGroup( datasetNode )
        })
        Promise.all( transactions ).then( ()=>{
          comparisonGroupNodes.sort( (a,b) => a.item.label.toUpperCase() >= b.item.label.toUpperCase() ? 1:-1 )
          this._database.next(comparisonGroupNodes);
        })
      }),
      "error":( (error: FirestoreError) =>{
          alert("ERROR:" + error)
      })
    })
    this.unsubscribeMap.set( "/", unsubscribe )
  }  
  loadComparisonForGroup(comparisonGroupNode:ComparisonNode):Promise<void>{
    return new Promise<void>((resolve, reject) =>{
      
      let unsubscribe = this.firebaseService.onsnapShotQuery("Comparison","comparisonGroupId","==",comparisonGroupNode.item.id, {
        "next":( (set:any) =>{
          comparisonGroupNode.children.length = 0
          set.docs.map( (doc:any) =>{
            let comparison:Comparison = doc.data() as Comparison
            let newComparisonNode:ComparisonNode = {
              children: [],
              item: comparison
            }
            comparisonGroupNode.children.push( newComparisonNode )
          })
          comparisonGroupNode.children.sort( (a,b)=> a.item.label > b.item.label ? 1:-1)
          if( !this.unsubscribeMap.get( comparisonGroupNode.item.id) ){
            this.unsubscribeMap.set( comparisonGroupNode.item.id, unsubscribe)
          }
          else{
            this.reload(this.nodeToFlatNode.get( comparisonGroupNode ) )
          }
          resolve()
        }),
        "error":( (error:any) =>{
          alert("ERROR:" +error)
          reject()
        })          
      })
    })
  }

  isComparison( node:ComparisonNode ){
    if( "type" in node.item ){
      return true
    }
    else{
      return false
    }
  }

  editComparison( node:ComparisonNode ){
    this.router.navigate(["/Comparison-edit/",  node.item.id]);
    
  }

  reload( node:ComparisonFlatNode|null = null ){
    let temp=this.dataSource.data
    this.dataSource.data = []
    this.dataSource.data = temp;    
    if( node ){ 
      this.treeControl.expand( node )
    }
  }

  onEditComparisonGroup( node:ComparisonFlatNode ){
    this.router.navigate(["/ComparisonGroup-edit/",  node.item.id]);
  }
}
