User requested to modify the loadConnectionSchemas function in tables-tree.ts to use SchemaTableService to load schemas for a given connectionName.

Changes made:
1. Updated tables-tree.ts to import SchemaTableService and SchemaTableData.
2. Added private schemaTableService parameter to LoadmoreDatabase constructor.
3. Rewrote loadConnectionSchemas method to:
   - Call schemaTableService.getSchemaAndTableData(connectionName)
   - Clear existing nodes and maps
   - Store the data map in _schemaMap for later use
   - Create schema nodes with proper hasChildren flags based on whether schema has tables
   - Emit schema nodes via dataChange
4. Updated TableNode class to properly store and expose the TableItem
5. Updated tables-tree.component.ts to handle the new node types (SchemaNode, TableNode, MoreNode) in the tree
6. Fixed various type errors and method signatures to maintain compatibility

The function now properly uses the SchemaTableService to fetch schema and table data for the given connection name, processes it, and updates the tree data structure accordingly.