import { AfterViewInit, Component, Query, ViewChild } from '@angular/core';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTree, MatTreeNestedDataSource} from '@angular/material/tree';
import { TreeNestedDataSource, TreeNode, TREENODE_EXAMPLE_DATA } from '../tree-nested-data-source';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { UrlService } from '../url.service';
import { db } from '../../environments/environment'
import { collection, doc, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc} from "firebase/firestore"; 
import { ChiildJoinRequest,  Comparison, Dataset, Port, PortListResponse, SnowFlakeDataset } from '../datatypes/datatypes.module';
import { StringUtilService } from '../string-util.service';
import { SelectionChange } from '@angular/cdk/collections';
import { Call, splitNsName } from '@angular/compiler';
import { DatasetEditComponent } from '../dataset-edit/dataset-edit.component';
import { firstValueFrom } from 'rxjs';


interface ComparisonRequest extends Comparison{
  leftQry:string,
  rightQry:string,
  joinColumns:string[]
}

@Component({
  selector: 'app-comparison-execute',
  templateUrl: './comparison-execute.component.html',
  styleUrls: ['./comparison-execute.component.css']
})
export class ComparisonExecuteComponent implements AfterViewInit{
  @ViewChild(MatTree) tree!: MatTree<TreeNode> ; 
 
  treeControl = new NestedTreeControl<TreeNode>(node => 
    node.children
    );
  dataSource = new TreeNestedDataSource();
  id:string | null = null 
  comparison:Comparison | null = null
  comparisonList:TreeNode[] = []

  submmiting=false

  
  req:ComparisonRequest | null = null


  comparisonChilds:TreeNode[] = []

  hasPathChilds = new Map();

  constructor(
     private router:Router
    ,private route: ActivatedRoute    
    ,private urlService:UrlService
    ,private stringUtilService:StringUtilService
    ) {
    this.dataSource.data = TREENODE_EXAMPLE_DATA;
    if( this.route.snapshot.paramMap.get('id') != 'null'){
      this.id = this.route.snapshot.paramMap.get('id') 
    }      
  }
  ngAfterViewInit(): void {

    this.tree.treeControl.expansionModel.changed.subscribe(change => {
      if ( (change as SelectionChange<TreeNode>).added ){
        change.added.map( node =>{
          if( node.children == null){
            this.loadChilds( node )
          }
        })
      }
      else{
        console.log("handling open")
      }
    });

    this.update()
  }
  reload(){
    var oldData = this.dataSource.data
    this.dataSource.data = TREENODE_EXAMPLE_DATA
    this.dataSource.data = oldData
  }

  loadHasPathChild(collectionPath:string):Promise<void>{
    return new Promise<void>((resolve, reject) =>{
      /*
      var transaction = getDocs( collection(db, collectionPath + "/Child" ) ).then( docSet =>{
        if( docSet.docs.length > 0 ){
          this.hasPathChilds.set(collectionPath,true)
          var transactions = docSet.docs.map( doc =>{
            var child:Child = doc.data() as Child
            return this.loadHasPathChild( collectionPath + "/Child/" + child.id)
          })
          Promise.all( transactions ).then( ()=>{
            resolve()
          },
          reason =>{
            alert("ERROR:" + reason)
            reject(reason)
          })
        }
        else{
          this.hasPathChilds.set(collectionPath,false)
          resolve()
        }
      })
      */
    })

  }

  getNodeChildPath( node:TreeNode ){
    var treeNodePath:TreeNode[] = this.dataSource.getNodePath(node)
    var collectionPath = ""

    treeNodePath.map( treeNode =>{
      if( treeNode.nodeClass == 'Comparison' || treeNode.nodeClass == 'Child'){
        if( collectionPath != ""){
          collectionPath +="/"
        }
        collectionPath += treeNode.nodeClass + "/" + treeNode.obj.id
      }
    }) 
    return collectionPath  
  }
  hasChild = (_: number, node: TreeNode) => {
    var b:boolean = !!node.children && node.children.length > 0
    if( node.nodeClass == 'Child' || node.nodeClass == 'Comparison'){
      b = true
    }
    else if( node.nodeClass == 'Data'){
      
      if( node.children == null){
        var collectionPath = this.getNodeChildPath( node )
        if( collectionPath.split("/").length > 2){
          console.log("collectionPath:" + collectionPath)
        }
        var b:boolean = this.hasPathChilds.get(collectionPath);
        return b
      }
    }
    return b
  };

  isLoading = (_: number, node: TreeNode) => { return node.isLoading}


  update(){

    getDoc( doc( db,"Comparison", this.id! )).then( docSnap =>{
      this.comparison = docSnap.data() as Comparison
      this.req = docSnap.data() as ComparisonRequest

      var joinColumns = []
      //calculate join 
      for( var i =0; i< this.comparison.keyLeftRight.length; i++){
        let keyLeftRight = this.comparison.keyLeftRight[i]

        if( keyLeftRight.isSelected == true ){
          joinColumns.push( keyLeftRight.leftPortName )
        }
      }
       
      this.req.joinColumns=joinColumns       
      

      //add the first node 
      var node:TreeNode = {
        obj:this.comparison,
        opened:false,
        children:[],
        nodeClass:"Comparison", 
        isLeaf:true,
        parentNode:null,
        isLoading:false
      }

      this.comparisonList.length=0
      this.comparisonList.push( node )
    })
    .then( ()=>{
      if( this.comparison?.leftDatasetId ){
        return getDoc( doc( db,"Dataset", this.comparison.leftDatasetId )).then( docSnap =>{
          let dataset = docSnap.data() as SnowFlakeDataset
          this.req!.leftQry = this.stringUtilService.removeNonPrintable((dataset.sql!))
        })
      }
      else{
        return null
      }
    })
    .then( ()=>{
      if( this.comparison?.rightDatasetId ){
        return getDoc( doc( db,"Dataset", this.comparison.rightDatasetId )).then( docSnap =>{
          let dataset = docSnap.data() as SnowFlakeDataset
          this.req!.rightQry = this.stringUtilService.removeNonPrintable((dataset.sql))
        })
      }
      else{
         return null;
      }
    })
    //.then( ()=>{
    //  return this.loadHasPathChild("Comparison/" + this.comparison!.id )
    //})
    .then( ()=>{
      this.submmiting = true

       this.urlService.post("executeJoin",this.req!).subscribe({ 
        'next':(result)=>{
          this.submmiting = false
          console.log( result )
          let strJson:string =  String(result) 
          var resultList:[] = JSON.parse( strJson ) 

          let nodeList:TreeNode[] = []

          resultList.map( item =>{
            var node:TreeNode = {
              obj:item,
              opened:false,
              children:null,
              nodeClass:"Data", 
              isLeaf:false,
              parentNode:this.comparisonList[0],
              isLoading:false
            }  
            nodeList.push( node ) 
          })

          this.comparisonList[0].children = nodeList

          this.dataSource.data =  this.comparisonList  
        },
        'error':(reason)=>{
          this.submmiting = false
          alert( reason.error.error )
        }
      })         
    })
  
  }
  loadChilds( node:TreeNode){
    return null
    /*
    node.isLoading = true
    var collectionPath = this.getNodeChildPath(node)
    if( node.nodeClass == 'Data'){
      getDocs( collection( db, collectionPath + "/Child") ).then( set =>{
        node.children=[]
        set.docs.map( doc =>{
          var child:Child = doc.data() as Child
          let newTreeNode:TreeNode = {
            obj: child,
            opened: false,
            children: null,
            nodeClass: 'Child',
            isLeaf: false,
            parentNode: node,
            isLoading: false
          }
          node.children!.push( newTreeNode )
        })
        node.isLoading = false
        this.reload()
      })
    }
    else if( node.nodeClass == "Child"){
      //prepare Call
      var _localNode = node
      
      let child:Child = node.obj
      
     
      let leftQry=""
      let rightQry=""
      let leftColumns:Port[]=[]
      let rightColumns:Port[]=[]
   
      

      //first get the right and left querys
      getDoc( doc(db, "Dataset" , child.leftDatasetId) ).then( doc =>{
        let dataset:Dataset = doc.data() as Dataset
        console.log( "loading data")
        leftQry = this.stringUtilService.removeNonPrintable(dataset.sql!)
        return leftQry
      })
      .then( (qry)=>{
        var observable = this.urlService.post("getFielsForQuery",{"qry":qry})
        return firstValueFrom(observable).then( result =>{
            var data:PortListRequest = result as PortListRequest 
            leftColumns = data["fields"]          
          }
          ,(reason) =>{
              alert("ERROR:" + reason)            
        })
      })
      .then( ()=>{
        return getDoc( doc(db, "Dataset" , child.rightDatasetId) ).then( (doc)=>{
          let dataset:Dataset = doc.data() as Dataset
          //rightQry = this.stringUtilService.removeNonPrintable(dataset.sql!)
        })        
      })
      .then( ()=>{
        var observable = this.urlService.post("getFielsForQuery",{"qry":rightQry})
        return firstValueFrom(observable).then((result)=>{
            var data:PortListRequest = result as PortListRequest 
            rightColumns = data["fields"]          
          }
          ,(reason) =>{
              alert("ERROR:" + reason)            
        })
      })      
      .then( ()=>{
        var parentData : { [key: string]: any } = {}
        for(let key in node.parentNode!.obj){
          parentData[key]=node.parentNode!.obj[key] 
        }
        let joinColumns:string[] = []
        leftColumns.map( lcol =>{
          rightColumns.filter( rcol =>{
            if( lcol.name == rcol.name){
              joinColumns.push( lcol.name )
            }
          })
        })

        var req:ChiildJoinRequest = {
         parentData:parentData,
         leftQry:leftQry,
         rightQry:rightQry,
         leftColumns:leftColumns,
         rightColumns:rightColumns,
        }
        this.urlService.post("executeChildJoin",req).subscribe({ 
          'next':(result)=>{
            console.log( result )
            
            let strJson:string =  String(result) 
            var resultList:[] = JSON.parse( strJson ) 
  
            let nodeList:TreeNode[] = []
  
            resultList.map( item =>{
              var node:TreeNode = {
                obj:item,
                opened:false,
                children:null,
                nodeClass:"Data", 
                isLeaf:false,
                parentNode:_localNode,
                isLoading:false
              }  
              nodeList.push( node ) 
            })
            _localNode.children = nodeList
            _localNode.isLoading = false
            this.reload()
  
          },
          'error':(reason)=>{
            alert("ERROR:" + reason)
          }
        })      
      })
    }
    */
  }
  joinPort( left:Port[], right:Port[], keyLeftRight:any[]):Port[]{


    var allPorts:Port[] = []
    left.map( p => allPorts.push( p ) )
    right.map( rport =>{


      let isKey = keyLeftRight.find( key => key.leftPortName == rport.name && key.isSelected == true)
      if( isKey == undefined ){
        let exists:Port|undefined = undefined
        exists = left.find( lport => lport.name === rport.name)
        if( exists == undefined ){
          allPorts.push( rport )
        }
        else{
          var newPort:Port = { 
            name:rport.name + "_RIGHT", 
            type:rport.type
          }
          allPorts.push( newPort )
        }
      } 
      
    })
    allPorts.sort( (a, b) =>{
      let a_left=left.indexOf(a)>0
      let b_left=left.indexOf(b)>0
      //if both ports are in the same array just compare the name
      if( a_left == b_left ){
        return a.name > b.name ? 1:-1
      }
      else{ //they are in different arrays pick the left one
        if(  a.name == b.name && a_left && b_left==false ){
          return -1
        }
        else{
          return a.name > b.name ? 1:-1
        }
      }
    }) 
    return allPorts
  }
  getChildrenIndex( node:TreeNode ):number{
    return node.parentNode!.children!.findIndex(x => x == node )
  }
  onDownload( node:TreeNode ){
    var strArray:string[] = []
    node.children?.forEach( child =>{
      let data = child.obj as {[key: string | symbol]: any};
      let strValues:string = ""

      //first do the headers
      if( strArray.length == 0){
        let strValues:string = ""
        for(const key in data){
          if( strValues.length > 0 ){
            strValues += ","
          }
          strValues += key
        }
        if( strArray.length > 0){
          strArray.push("\n")
        }
        strArray.push( strValues)
      }  

      strValues = ""
      for(const key in data){
        if( strValues.length > 0 ){
          strValues += ","
        }
        strValues += data[key] 
      }
      if( strArray.length > 0){
        strArray.push("\n")
      }
      strArray.push( strValues)
    })

    let file = new Blob(strArray, {type: '.txt'});


    let a = document.createElement("a"),
            url = URL.createObjectURL(file);
    a.href = url;
    a.download = "myFile.csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);  
    }, 0);     
  }
}
