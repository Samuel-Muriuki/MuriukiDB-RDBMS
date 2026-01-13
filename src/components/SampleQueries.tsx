import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Play, Search, X } from 'lucide-react';
import { highlightSQL } from '@/lib/rdbms';

const SAMPLE_QUERIES = [
  {
    category: '📊 Schema',
    queries: [
      { name: 'Show all tables', sql: 'SHOW TABLES' },
      { name: 'Create users table', sql: 'CREATE TABLE users (name TEXT NOT NULL, email TEXT UNIQUE, age INTEGER)' },
      { name: 'Create orders table', sql: 'CREATE TABLE orders (user_id INTEGER, product TEXT, amount INTEGER, order_date TEXT)' },
      { name: 'Describe table', sql: 'DESCRIBE contacts' },
    ],
  },
  {
    category: '📝 Data',
    queries: [
      { name: 'Insert a user', sql: "INSERT INTO users (name, email, age) VALUES ('John Doe', 'john@example.com', 25)" },
      { name: 'Insert an order', sql: "INSERT INTO orders (user_id, product, amount, order_date) VALUES (1, 'Laptop', 1200, '2026-01-13')" },
      { name: 'Select all', sql: 'SELECT * FROM users' },
      { name: 'Select with filter', sql: "SELECT name, email FROM users WHERE age > 20" },
    ],
  },
  {
    category: '🔗 Joins',
    queries: [
      { name: 'Inner Join', sql: 'SELECT users.name, orders.product, orders.amount FROM users INNER JOIN orders ON users.id = orders.user_id' },
      { name: 'Left Join', sql: 'SELECT users.name, orders.product FROM users LEFT JOIN orders ON users.id = orders.user_id' },
      { name: 'Join with filter', sql: "SELECT u.name, o.product FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE o.amount > 500" },
    ],
  },
  {
    category: '📈 Aggregations',
    queries: [
      { name: 'Count all users', sql: 'SELECT COUNT(*) AS total_users FROM users' },
      { name: 'Count by condition', sql: "SELECT COUNT(*) AS adults FROM users WHERE age >= 18" },
      { name: 'Sum of amounts', sql: 'SELECT SUM(amount) AS total_revenue FROM orders' },
      { name: 'Average age', sql: 'SELECT AVG(age) AS average_age FROM users' },
      { name: 'Min/Max values', sql: 'SELECT MIN(amount) AS cheapest, MAX(amount) AS most_expensive FROM orders' },
    ],
  },
  {
    category: '📦 Grouping & Sorting',
    queries: [
      { name: 'Group by product', sql: 'SELECT product, COUNT(*) AS order_count, SUM(amount) AS total FROM orders GROUP BY product' },
      { name: 'Group with HAVING', sql: 'SELECT product, SUM(amount) AS total FROM orders GROUP BY product HAVING total > 1000' },
      { name: 'Order ascending', sql: 'SELECT * FROM users ORDER BY age ASC' },
      { name: 'Order descending', sql: 'SELECT * FROM orders ORDER BY amount DESC' },
      { name: 'Multiple sorting', sql: 'SELECT * FROM users ORDER BY age DESC, name ASC' },
      { name: 'Top 5 expensive', sql: 'SELECT * FROM orders ORDER BY amount DESC LIMIT 5' },
    ],
  },
  {
    category: '🔧 Advanced',
    queries: [
      { name: 'Update record', sql: "UPDATE users SET age = 26 WHERE name = 'John Doe'" },
      { name: 'Delete record', sql: "DELETE FROM users WHERE age < 18" },
      { name: 'Create index', sql: 'CREATE INDEX idx_users_email ON users (email)' },
    ],
  },
];

interface SampleQueriesProps {
  onSelectQuery: (query: string) => void;
}

export const SampleQueries = ({ onSelectQuery }: SampleQueriesProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQueries = useMemo(() => {
    if (!searchTerm.trim()) return SAMPLE_QUERIES;
    
    const term = searchTerm.toLowerCase();
    return SAMPLE_QUERIES.map(category => ({
      ...category,
      queries: category.queries.filter(
        q => q.name.toLowerCase().includes(term) || q.sql.toLowerCase().includes(term)
      ),
    })).filter(category => category.queries.length > 0);
  }, [searchTerm]);

  const clearSearch = () => setSearchTerm('');

  return (
    <Card className="glass-card border-primary/30 h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm font-mono flex items-center gap-2">
          <Code className="w-4 h-4" />
          Sample Queries
        </CardTitle>
        {/* Search input */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search samples..."
            className="pl-8 pr-8 h-8 text-xs font-mono glass-input"
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          {filteredQueries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-mono text-sm">
              No matching queries found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueries.map((category) => (
                <div key={category.category}>
                  <h4 className="text-xs font-mono text-muted-foreground mb-2">{category.category}</h4>
                  <div className="space-y-1.5">
                    {category.queries.map((query) => (
                      <Button
                        key={query.name}
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-3 text-left hover:bg-primary/10 group transition-all duration-200"
                        onClick={() => onSelectQuery(query.sql)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium mb-1 group-hover:text-primary transition-colors">{query.name}</div>
                          <pre 
                            className="text-[10px] text-muted-foreground truncate"
                            dangerouslySetInnerHTML={{ __html: highlightSQL(query.sql.slice(0, 50) + (query.sql.length > 50 ? '...' : '')) }}
                          />
                        </div>
                        <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary ml-2 flex-shrink-0" />
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};