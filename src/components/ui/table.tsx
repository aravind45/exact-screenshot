import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Extended props for the Table component to enforce accessibility attributes.
 */
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /**
   * Accessible label for the table. Required for screen readers.
   * Use this when the table doesn't have a visible caption.
   */
  "aria-label"?: string;
  /**
   * ID of an element that labels the table. Alternative to aria-label.
   * Use this when there's a visible heading that describes the table.
   */
  "aria-labelledby"?: string;
}

/**
 * Table component wrapper with accessibility support.
 *
 * @example
 * ```tsx
 * <Table aria-label="User data">
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Name</TableHead>
 *       <TableHead>Email</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>John Doe</TableCell>
 *       <TableCell>john@example.com</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 *
 * @accessibility
 * - Always include either `aria-label` or `aria-labelledby` for screen readers
 * - Always use `TableHeader` with proper `TableHead` elements
 * - Use `TableCaption` for complex tables to provide additional context
 */
const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, ...props }, ref) => {
  // Warn in development if no aria-label or aria-labelledby is provided
  if (process.env.NODE_ENV === "development" && !props["aria-label"] && !props["aria-labelledby"]) {
    console.warn(
      "Table component should have either aria-label or aria-labelledby for accessibility. " +
        "This helps screen reader users understand the purpose of the table.",
    );
  }

  return (
    <div className="relative w-full overflow-auto rounded-lg border">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} role="table" {...props} />
    </div>
  );
});
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("bg-muted/50 [&_tr]:border-b border-border", className)} {...props} />
  ),
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 border-border", className)}
      {...props}
    />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border transition-colors data-[state=selected]:bg-muted hover:bg-muted/60",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-semibold text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
