import { MatTreeNestedDataSource } from "@angular/material/tree"

export interface TreeNode {
    obj:any
    opened:boolean
    children:TreeNode[] | null
    nodeClass:string
    isLeaf:boolean
    parentNode:TreeNode | null
    isLoading:boolean
}
  
  // TODO: replace this with real data from your application
export const TREENODE_EXAMPLE_DATA: TreeNode[] = [
  {
    obj:{label:"loading"},
    opened:false,
    children:[{
        obj:{label:"Please wait"},
        opened:false,
        children:[],
        nodeClass:"Child",
        isLeaf:true,
        parentNode:null,
        isLoading:false
      }],
    nodeClass:"TreeNode",
    isLeaf:false,
    parentNode:null,
    isLoading:false 
  }
]

export class TreeNestedDataSource extends MatTreeNestedDataSource<TreeNode> {

  getPath(node:TreeNode | null | undefined):string{
    var path:string = ""
    if( node ){
      path = node.nodeClass + "/" + node.obj.id
      while( node && node.parentNode != null ){
        node = node.parentNode 
        path = node.nodeClass + "/" + node.obj.id + "/" + path
      }
    }
    return path
  }
  getNodePath(node:TreeNode | null | undefined):TreeNode[]{
    var pathNodes:TreeNode[] = []
    if( node ){
      pathNodes.push( node ) 
      while( node && node.parentNode != null ){
        node = node.parentNode 
        pathNodes.push( node ) 
      }
    }
    return pathNodes.reverse()
  }  
}
