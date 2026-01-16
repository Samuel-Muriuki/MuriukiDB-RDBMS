import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnConfig } from '@/lib/demoTables';
import { cn } from '@/lib/utils';

interface DynamicFormFieldProps {
  column: ColumnConfig;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
}

export const DynamicFormField = ({ 
  column, 
  value, 
  onChange, 
  error,
  disabled = false 
}: DynamicFormFieldProps) => {
  const labelText = column.required ? `${column.name} *` : column.name;
  const fieldId = `field-${column.name}`;

  const renderInput = () => {
    switch (column.type) {
      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger 
              id={fieldId}
              className={cn(
                "font-mono text-sm glass-input capitalize",
                error && "border-destructive"
              )}
            >
              <SelectValue placeholder={column.placeholder || `Select ${column.name}`} />
            </SelectTrigger>
            <SelectContent className="glass-card">
              {column.options?.map((opt) => (
                <SelectItem 
                  key={opt} 
                  value={opt}
                  className="font-mono text-sm capitalize cursor-pointer"
                >
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'email':
        return (
          <Input
            id={fieldId}
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={column.placeholder}
            className={cn(
              "font-mono text-sm glass-input",
              error && "border-destructive"
            )}
            disabled={disabled}
          />
        );

      case 'phone':
        return (
          <Input
            id={fieldId}
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={column.placeholder}
            className={cn(
              "font-mono text-sm glass-input",
              error && "border-destructive"
            )}
            disabled={disabled}
          />
        );

      case 'number':
        return (
          <Input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={column.placeholder}
            min={column.validation?.min}
            max={column.validation?.max}
            step="1"
            className={cn(
              "font-mono text-sm glass-input",
              error && "border-destructive"
            )}
            disabled={disabled}
          />
        );

      case 'currency':
        return (
          <Input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={column.placeholder}
            min={column.validation?.min}
            step="0.01"
            className={cn(
              "font-mono text-sm glass-input",
              error && "border-destructive"
            )}
            disabled={disabled}
          />
        );

      case 'date':
        return (
          <Input
            id={fieldId}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={column.placeholder}
            className={cn(
              "font-mono text-sm glass-input",
              error && "border-destructive"
            )}
            disabled={disabled}
          />
        );

      case 'text':
      default:
        return (
          <Input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={column.placeholder}
            className={cn(
              "font-mono text-sm glass-input",
              error && "border-destructive"
            )}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <Label 
        htmlFor={fieldId} 
        className="text-xs font-mono text-muted-foreground capitalize"
      >
        {labelText}
      </Label>
      {renderInput()}
      {error && (
        <p className="text-[10px] text-destructive font-mono">{error}</p>
      )}
    </div>
  );
};
