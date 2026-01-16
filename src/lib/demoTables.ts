// Demo table configurations with validation rules and sample data generators

export interface ColumnConfig {
  name: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'currency';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  sqlType: string;
}

export interface DemoTableConfig {
  id: string;
  name: string;
  tableName: string;
  icon: string;
  description: string;
  columns: ColumnConfig[];
  sampleDataGenerator: () => Record<string, string | number>;
}

// Random data generators
const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'proton.me', 'mail.com', 'icloud.com'];
const CITIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale'];
const PRODUCT_NAMES = ['Laptop Pro', 'Wireless Mouse', 'USB Keyboard', 'Monitor HD', 'Webcam Pro', 'Headphones BT', 'Phone Stand', 'USB Hub', 'SSD Drive', 'RAM Module'];
const CATEGORIES = ['Electronics', 'Furniture', 'Stationery', 'Clothing', 'Accessories'];
const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Support'];
const ORDER_STATUSES = ['pending', 'shipped', 'completed', 'cancelled'];

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const uniqueId = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export const generateRandomContact = (): Record<string, string> => {
  const firstName = randomElement(FIRST_NAMES);
  const lastName = randomElement(LAST_NAMES);
  const domain = randomElement(DOMAINS);
  const phonePrefix = randomElement(['+254', '+1', '+44', '+91']);
  const phoneNum = randomInt(100000000, 999999999);
  
  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId()}@${domain}`,
    phone: `${phonePrefix} ${phoneNum.toString().slice(0, 3)} ${phoneNum.toString().slice(3, 6)}${phoneNum.toString().slice(6)}`,
  };
};

export const generateRandomUser = (): Record<string, string | number> => {
  const firstName = randomElement(FIRST_NAMES);
  const lastName = randomElement(LAST_NAMES);
  const domain = randomElement(DOMAINS);
  
  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId()}@${domain}`,
    age: randomInt(18, 65),
    city: randomElement(CITIES),
  };
};

export const generateRandomProduct = (): Record<string, string | number> => {
  const baseName = randomElement(PRODUCT_NAMES);
  const suffix = uniqueId().slice(0, 3).toUpperCase();
  
  return {
    name: `${baseName} ${suffix}`,
    category: randomElement(CATEGORIES),
    price: parseFloat((randomInt(500, 100000) + Math.random()).toFixed(2)),
    stock: randomInt(0, 100),
  };
};

export const generateRandomOrder = (): Record<string, string | number> => {
  return {
    user_id: randomInt(1, 10),
    product_id: randomInt(1, 10),
    amount: parseFloat((randomInt(1000, 100000) + Math.random()).toFixed(2)),
    quantity: randomInt(1, 5),
    status: randomElement(ORDER_STATUSES),
  };
};

export const generateRandomEmployee = (): Record<string, string | number> => {
  const firstName = randomElement(FIRST_NAMES);
  const lastName = randomElement(LAST_NAMES);
  const year = randomInt(2018, 2024);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  
  return {
    name: `${firstName} ${lastName}`,
    department: randomElement(DEPARTMENTS),
    salary: randomInt(50000, 200000),
    hire_date: `${year}-${month}-${day}`,
  };
};

// Validation function
export const validateField = (column: ColumnConfig, value: string | number | undefined): string | null => {
  const strValue = value?.toString().trim() ?? '';
  
  // Required check
  if (column.required && !strValue) {
    return `${column.name} is required`;
  }
  
  // Skip further validation if empty and not required
  if (!strValue) return null;
  
  // Type-specific validation
  switch (column.type) {
    case 'email': {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(strValue)) {
        return column.validation?.message || 'Invalid email format';
      }
      break;
    }
    case 'phone': {
      const phonePattern = /^[+]?[\d\s()-]{7,20}$/;
      if (!phonePattern.test(strValue)) {
        return column.validation?.message || 'Invalid phone format (e.g., +254 700 000000)';
      }
      break;
    }
    case 'number':
    case 'currency': {
      const numValue = parseFloat(strValue);
      if (isNaN(numValue)) {
        return `${column.name} must be a valid number`;
      }
      if (column.validation?.min !== undefined && numValue < column.validation.min) {
        return column.validation.message || `${column.name} must be at least ${column.validation.min}`;
      }
      if (column.validation?.max !== undefined && numValue > column.validation.max) {
        return column.validation.message || `${column.name} must be at most ${column.validation.max}`;
      }
      break;
    }
    case 'date': {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(strValue)) {
        return 'Invalid date format (use YYYY-MM-DD)';
      }
      break;
    }
  }
  
  // Custom pattern validation
  if (column.validation?.pattern && !column.validation.pattern.test(strValue)) {
    return column.validation.message || `Invalid ${column.name} format`;
  }
  
  return null;
};

export const DEMO_TABLES: DemoTableConfig[] = [
  {
    id: 'contacts',
    name: 'Contacts',
    tableName: 'contacts',
    icon: 'Users',
    description: 'Manage personal and business contacts',
    columns: [
      { 
        name: 'name', 
        type: 'text', 
        required: true, 
        placeholder: 'John Doe', 
        sqlType: 'TEXT NOT NULL' 
      },
      { 
        name: 'email', 
        type: 'email', 
        placeholder: 'john@example.com', 
        sqlType: 'TEXT UNIQUE',
        validation: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
      },
      { 
        name: 'phone', 
        type: 'phone', 
        placeholder: '+254 700 000000', 
        sqlType: 'TEXT',
        validation: { pattern: /^[+]?[\d\s()-]{7,20}$/, message: 'Invalid phone format' }
      },
    ],
    sampleDataGenerator: generateRandomContact,
  },
  {
    id: 'users',
    name: 'Users',
    tableName: 'users',
    icon: 'User',
    description: 'User accounts with profile information',
    columns: [
      { 
        name: 'name', 
        type: 'text', 
        required: true, 
        placeholder: 'Alice Johnson', 
        sqlType: 'TEXT NOT NULL' 
      },
      { 
        name: 'email', 
        type: 'email', 
        required: true, 
        placeholder: 'alice@example.com', 
        sqlType: 'TEXT UNIQUE',
        validation: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
      },
      { 
        name: 'age', 
        type: 'number', 
        placeholder: '28', 
        sqlType: 'INTEGER DEFAULT 0',
        validation: { min: 0, max: 150, message: 'Age must be between 0 and 150' }
      },
      { 
        name: 'city', 
        type: 'text', 
        placeholder: 'Nairobi', 
        sqlType: 'TEXT' 
      },
    ],
    sampleDataGenerator: generateRandomUser,
  },
  {
    id: 'products',
    name: 'Products',
    tableName: 'products',
    icon: 'Package',
    description: 'Inventory and product catalog',
    columns: [
      { 
        name: 'name', 
        type: 'text', 
        required: true, 
        placeholder: 'Laptop Pro', 
        sqlType: 'TEXT NOT NULL' 
      },
      { 
        name: 'category', 
        type: 'select', 
        options: CATEGORIES, 
        sqlType: 'TEXT',
        placeholder: 'Select category'
      },
      { 
        name: 'price', 
        type: 'currency', 
        required: true, 
        placeholder: '89999.99', 
        sqlType: 'REAL NOT NULL',
        validation: { min: 0, message: 'Price must be positive' }
      },
      { 
        name: 'stock', 
        type: 'number', 
        placeholder: '15', 
        sqlType: 'INTEGER DEFAULT 0',
        validation: { min: 0, message: 'Stock cannot be negative' }
      },
    ],
    sampleDataGenerator: generateRandomProduct,
  },
  {
    id: 'orders',
    name: 'Orders',
    tableName: 'orders',
    icon: 'ShoppingCart',
    description: 'Customer orders and transactions',
    columns: [
      { 
        name: 'user_id', 
        type: 'number', 
        required: true, 
        placeholder: '1', 
        sqlType: 'INTEGER NOT NULL',
        validation: { min: 1, message: 'User ID must be a positive number' }
      },
      { 
        name: 'product_id', 
        type: 'number', 
        placeholder: '1', 
        sqlType: 'INTEGER',
        validation: { min: 1, message: 'Product ID must be a positive number' }
      },
      { 
        name: 'amount', 
        type: 'currency', 
        required: true, 
        placeholder: '89999.99', 
        sqlType: 'REAL NOT NULL',
        validation: { min: 0, message: 'Amount must be positive' }
      },
      { 
        name: 'quantity', 
        type: 'number', 
        placeholder: '1', 
        sqlType: 'INTEGER DEFAULT 1',
        validation: { min: 1, message: 'Quantity must be at least 1' }
      },
      { 
        name: 'status', 
        type: 'select', 
        options: ORDER_STATUSES, 
        sqlType: "TEXT DEFAULT 'pending'",
        placeholder: 'Select status'
      },
    ],
    sampleDataGenerator: generateRandomOrder,
  },
  {
    id: 'employees',
    name: 'Employees',
    tableName: 'employees',
    icon: 'Briefcase',
    description: 'Employee records and HR data',
    columns: [
      { 
        name: 'name', 
        type: 'text', 
        required: true, 
        placeholder: 'John Doe', 
        sqlType: 'TEXT NOT NULL' 
      },
      { 
        name: 'department', 
        type: 'select', 
        options: DEPARTMENTS, 
        sqlType: 'TEXT',
        placeholder: 'Select department'
      },
      { 
        name: 'salary', 
        type: 'currency', 
        placeholder: '120000', 
        sqlType: 'REAL',
        validation: { min: 0, message: 'Salary cannot be negative' }
      },
      { 
        name: 'hire_date', 
        type: 'date', 
        placeholder: '2022-03-15', 
        sqlType: 'DATE' 
      },
    ],
    sampleDataGenerator: generateRandomEmployee,
  },
];

// Get table config by ID
export const getTableConfig = (tableId: string): DemoTableConfig | undefined => {
  return DEMO_TABLES.find(t => t.id === tableId);
};

// Generate SQL CREATE TABLE statement
export const generateCreateTableSQL = (config: DemoTableConfig): string => {
  const columns = config.columns.map(col => `  ${col.name} ${col.sqlType}`).join(',\n');
  return `CREATE TABLE ${config.tableName} (\n${columns}\n)`;
};

// Generate SQL query templates for a table
export const getTableTemplates = (config: DemoTableConfig): Array<{ name: string; sql: string }> => {
  const { tableName, columns } = config;
  const templates: Array<{ name: string; sql: string }> = [
    { name: `Select all ${config.name.toLowerCase()}`, sql: `SELECT * FROM ${tableName}` },
    { name: `Count ${config.name.toLowerCase()}`, sql: `SELECT COUNT(*) AS total FROM ${tableName}` },
  ];
  
  // Add column-specific templates
  const numericCols = columns.filter(c => c.type === 'number' || c.type === 'currency');
  if (numericCols.length > 0) {
    const col = numericCols[0];
    templates.push({ 
      name: `${col.name} statistics`, 
      sql: `SELECT AVG(${col.name}) AS avg_${col.name}, MIN(${col.name}) AS min_${col.name}, MAX(${col.name}) AS max_${col.name} FROM ${tableName}` 
    });
  }
  
  const selectCols = columns.filter(c => c.type === 'select');
  if (selectCols.length > 0) {
    const col = selectCols[0];
    templates.push({ 
      name: `Group by ${col.name}`, 
      sql: `SELECT ${col.name}, COUNT(*) AS count FROM ${tableName} GROUP BY ${col.name}` 
    });
  }
  
  return templates;
};
