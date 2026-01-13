// RDBMS Core Types

export type DataType = 'INTEGER' | 'TEXT' | 'BOOLEAN' | 'REAL' | 'DATE';

export interface ColumnDefinition {
  name: string;
  type: DataType;
  primaryKey?: boolean;
  unique?: boolean;
  notNull?: boolean;
  defaultValue?: unknown;
  autoIncrement?: boolean;
}

export interface TableSchema {
  id: string;
  tableName: string;
  columns: ColumnDefinition[];
  indexes: IndexDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

export interface Row {
  id: string;
  tableId: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Token Types for Lexer
export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'
  | 'OPERATOR'
  | 'PUNCTUATION'
  | 'WHITESPACE'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// AST Node Types
export type ASTNodeType =
  | 'CREATE_TABLE'
  | 'DROP_TABLE'
  | 'INSERT'
  | 'SELECT'
  | 'UPDATE'
  | 'DELETE'
  | 'CREATE_INDEX'
  | 'SHOW_TABLES'
  | 'DESCRIBE';

export interface CreateTableNode {
  type: 'CREATE_TABLE';
  tableName: string;
  columns: ColumnDefinition[];
  ifNotExists?: boolean;
}

export interface DropTableNode {
  type: 'DROP_TABLE';
  tableName: string;
  ifExists?: boolean;
}

export interface InsertNode {
  type: 'INSERT';
  tableName: string;
  columns?: string[];
  values: unknown[][];
}

export interface SelectNode {
  type: 'SELECT';
  columns: string[] | '*';
  tableName: string;
  joins?: JoinClause[];
  where?: WhereClause;
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
}

export interface UpdateNode {
  type: 'UPDATE';
  tableName: string;
  set: Record<string, unknown>;
  where?: WhereClause;
}

export interface DeleteNode {
  type: 'DELETE';
  tableName: string;
  where?: WhereClause;
}

export interface CreateIndexNode {
  type: 'CREATE_INDEX';
  indexName: string;
  tableName: string;
  columns: string[];
  unique?: boolean;
}

export interface ShowTablesNode {
  type: 'SHOW_TABLES';
}

export interface DescribeNode {
  type: 'DESCRIBE';
  tableName: string;
}

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT';
  tableName: string;
  alias?: string;
  on: {
    leftColumn: string;
    rightColumn: string;
  };
}

export interface WhereClause {
  operator: 'AND' | 'OR' | 'COMPARISON';
  left?: WhereClause | string;
  right?: WhereClause | unknown;
  comparison?: '=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE' | 'IS NULL' | 'IS NOT NULL';
}

export interface OrderByClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

export type ASTNode =
  | CreateTableNode
  | DropTableNode
  | InsertNode
  | SelectNode
  | UpdateNode
  | DeleteNode
  | CreateIndexNode
  | ShowTablesNode
  | DescribeNode;

// Query Result Types
export interface QueryResult {
  success: boolean;
  message?: string;
  rows?: Record<string, unknown>[];
  rowCount?: number;
  columns?: string[];
  executionTime?: number;
}

// B-Tree Index Types
export interface BTreeNode<K, V> {
  keys: K[];
  values: V[];
  children: BTreeNode<K, V>[];
  isLeaf: boolean;
}

export interface BTreeIndex {
  name: string;
  column: string;
  root: BTreeNode<unknown, string[]>;
}