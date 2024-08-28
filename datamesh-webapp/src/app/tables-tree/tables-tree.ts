import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export const LOAD_MORE = 'LOAD_MORE';

export const SCHEMA_CLASS= "schema"
export const TABLE_CLASS= "table"


export interface IDbItem{
  get id():string
  get item():SchemaItem|TableItem
}

export class SchemaItem{
  private _schemaName:string

  constructor(schemaName:string){
    this._schemaName = schemaName;
  };
  get id():string{
    return this._schemaName;
  }
}
export class TableItem{
  private _schemaName:string
  private _tableName:string

  constructor(schemaName:string, tableName:string){
    this._schemaName = schemaName;
    this._tableName = tableName
  };
  get id():string{
    return this._schemaName + "." + this._tableName;
  }
}

export class MoreItem{
  private _schemaName:string
  private _tableName:string

  constructor(schemaName:string, tableName:string){
    this._schemaName = schemaName;
    this._tableName = tableName
  };
  get id():string{
    return this._schemaName + "." + this._tableName;
  }
}

interface IDbNode{
  childrenChange:BehaviorSubject< Array<SchemaNode|TableNode|MoreNode> >;

  get children(): Array<SchemaNode|TableNode|MoreNode> 

}
/** Nested node */
export class SchemaNode implements IDbNode {
  childrenChange = new BehaviorSubject< Array<SchemaNode|TableNode|MoreNode> >([]);

  get children(): Array<SchemaNode|TableNode|MoreNode>{
    return this.childrenChange.value;
  }

  constructor(
    public item: SchemaItem,
    public hasChildren = true
  ) {}
}

export class MoreNode implements IDbNode {
  childrenChange = new BehaviorSubject< Array<SchemaNode|TableNode|MoreNode> >([]);


  get children(): Array<SchemaNode|TableNode|MoreNode>{
    return this.childrenChange.value;
  }

  constructor(
    public item: SchemaItem|TableItem|MoreItem,
    public hasChildren = false
  ) {}
}


export class TableNode implements IDbNode {
  childrenChange = new BehaviorSubject< Array<SchemaNode|TableNode|MoreNode> >([]);


  get children(): Array<SchemaNode|TableNode|MoreNode>{
    return this.childrenChange.value;
  }

  constructor(
    public item: TableItem,
    public hasChildren = false
  ) {}
}


/** Flat node with expandable and level information */
export class DbFlatNode {
  constructor(
    public item: SchemaItem|TableItem|MoreItem,
    public level = 1,
    public expandable = false
  ) {}
}

/**
 * A database that only load part of the data initially. After user clicks on the `Load more`
 * button, more data will be loaded.
 */
@Injectable()
export class LoadmoreDatabase {
  batchNumber = 10;
  dataChange = new BehaviorSubject<Array<SchemaNode|TableNode>>([]);
  nodeMap = new Map<string, SchemaNode|TableNode>();

  /** The data */
  rootLevelNodes: Array<SchemaItem> = [];
  dataMap: Map<string, Array<TableItem>> = new Map<string, Array<TableItem>> ();

  initialize() {
    const data = this.rootLevelNodes.map(s => this._generateNode(s));
    this.dataChange.next(data);
  }

  /** Expand a node whose children are not loaded */
  loadChildren(item: SchemaItem|TableItem|MoreItem, onlyFirstTime = false) {
    if (!this.nodeMap.has(item.id) || !this.dataMap.has(item.id)) {
      return;
    }
    const parent = this.nodeMap.get(item.id)!;
    const children = this.dataMap.get(item.id)!;
    if (onlyFirstTime && parent.children!.length > 0) {
      return;
    }
    const newChildrenNumber = parent.children!.length + this.batchNumber;
    const nodes:Array<SchemaNode|TableNode|MoreNode> = children.slice(0, newChildrenNumber).map(n => this._generateNode(n));
    if (newChildrenNumber < children.length) {
      // Need a new load more node
      var schemaMoreNode = new MoreNode(new MoreItem(parent.item.id, "more"),false)
      nodes.push(schemaMoreNode);
    }

    parent.childrenChange.next(nodes);
    this.dataChange.next(this.dataChange.value);
  }

  appendMore(item: SchemaItem|TableItem|MoreItem) {

    var schema = item.id.split(".")[0]

    const parent = this.nodeMap.get(schema)!;
    const children = this.dataMap.get(schema)!;
    const newChildrenNumber = parent.children!.length + this.batchNumber;
    const nodes:Array<SchemaNode|TableNode|MoreNode> = children.slice(0, newChildrenNumber).map(n => this._generateNode(n));
    if (newChildrenNumber < children.length) {
      // Need a new load more node
      var schemaMoreNode = new MoreNode(new TableItem(parent.item.id, "more"),false)
      nodes.push(schemaMoreNode);
    }

    parent.childrenChange.next(nodes);
    this.dataChange.next(this.dataChange.value);
  }


  private _generateNode(item: SchemaItem|TableItem): SchemaNode|TableNode {
    if (this.nodeMap.has(item.id)) {
      return this.nodeMap.get(item.id)!;
    }
    var result!:SchemaNode|TableNode
    if( item instanceof(SchemaItem)){
      result = new SchemaNode(item, this.dataMap.has(item.id));
    }
    else{
      result = new TableNode(item, this.dataMap.has(item.id));
    }
    
    this.nodeMap.set(item.id, result);
    return result;
  }
}