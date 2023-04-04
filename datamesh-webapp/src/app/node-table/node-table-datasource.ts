import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { Observable, of as observableOf, merge } from 'rxjs';

// TODO: Replace this with your own data model type
export interface NodeTableRow {
  obj:any
  opened:boolean
  children:NodeTableRow[]
  nodeClass:string
  isLeaf:boolean
}

// TODO: replace this with real data from your application
export const EXAMPLE_DATA: NodeTableRow[] = [
  {
    obj:{label:"loadding"},
    opened:true,
    children:[
      {
        obj:{label:"Please wait"},
        opened:true,
        children:[],
        nodeClass:"root",
        isLeaf:false
      }      
    ],
    nodeClass:"root",
    isLeaf:false
  }
];

/**
 * Data source for the MateriaCertificates view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class NodeTableDataSource extends DataSource<NodeTableRow> {
  data: NodeTableRow[] = EXAMPLE_DATA;
  paginator: MatPaginator ;
  sort: MatSort;
  flattened_data:Array<NodeTableRow>

  constructor(customized_data:NodeTableRow[], paginator:MatPaginator , sort:MatSort) {
    super();
    this.flattened_data = Array<NodeTableRow>()
    this.NodeFlattener( customized_data ,this.flattened_data)
    this.data = this.flattened_data   
    this.paginator = paginator
    this.sort =  sort 
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<NodeTableRow[]> {
    // Combine everything that affects the rendered data into one update
    // stream for the data-table to consume.
    const dataMutations = [
      observableOf(this.data),
      this.paginator.page,
      this.sort.sortChange
    ];

    return merge(dataMutations).pipe(map(() => {
      return this.getPagedData(this.getSortedData([...this.data]));
    }));
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect() {}

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getPagedData(data: NodeTableRow[]) {
    return data
  }

  /**
   * Sort the data (client-side). If you're using server-side sorting,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getSortedData(data: NodeTableRow[]) {
      return data;
  }
  
  NodeFlattener(node_array:NodeTableRow[]|null, result:Array<NodeTableRow>){
    for(var idx=0; node_array!=null && idx<node_array.length; idx++){
      var node = node_array[idx]
      result.push(node)
      var list = this.NodeFlattener( node.children, result)     
    };
  }
  getPathNode(node:NodeTableRow):NodeTableRow[]{
    var path:NodeTableRow[] = [node]
    var parentFound:boolean = true
    while( parentFound ){
      parentFound = false
      for( let i=0; this.data!=null && i<this.data.length; i++){
        let item:NodeTableRow = this.data[i]
        for( let j=0; item.children!=null && j<item.children.length; j++){
          if( item.children[j].obj.id == node.obj.id){
            parentFound = true
            node = item
            path.push(node)
            break
          }
        }
        if( parentFound ){
          break
        }
      }
    }
    return path.reverse()
  }

  getPath(node:NodeTableRow):string{
    let path = this.getPathNode(node)

    let collectionPath:string = ""
    for( let i =0; i<path.length; i++){
      let item:NodeTableRow=path[i]
      collectionPath += item.nodeClass + "/" + item.obj.id
    }  
    return collectionPath  
  }

}

/** Simple sort comparator for example ID/Name columns (for client-side sorting). */
function compare(a: string | number, b: string | number, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
