'use client';

/**
 * CSVImportPreview - Preview and select CSV rows for import
 * Feature: 003-adaimozhi
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ImportPreviewRow } from '@/lib/validators/adaimozhi';

interface CSVImportPreviewProps {
  /** Preview rows from CSV parsing */
  preview: ImportPreviewRow[];
  /** Count of valid rows */
  validCount: number;
  /** Count of rows with errors */
  errorCount: number;
  /** Count of duplicate rows */
  duplicateCount: number;
  /** Callback when import is confirmed */
  onConfirm: (selectedRows: number[]) => Promise<void>;
  /** Callback to cancel/reset */
  onCancel: () => void;
  /** Loading state during import */
  isImporting?: boolean;
}

export function CSVImportPreview({
  preview,
  validCount,
  errorCount,
  duplicateCount,
  onConfirm,
  onCancel,
  isImporting = false,
}: CSVImportPreviewProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(
    new Set(preview.filter((r) => r.valid).map((r) => r.row))
  );

  const toggleRow = (row: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(row)) {
      newSelected.delete(row);
    } else {
      newSelected.add(row);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    const validRows = preview.filter((r) => r.valid).map((r) => r.row);
    if (selectedRows.size === validRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(validRows));
    }
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedRows));
  };

  const validRows = preview.filter((r) => r.valid);
  const allValidSelected = validRows.every((r) => selectedRows.has(r.row));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <span className="text-green-600">
          {validCount} valid
        </span>
        <span className="text-red-600">
          {errorCount} errors
        </span>
        <span className="text-yellow-600">
          {duplicateCount} duplicates
        </span>
        <span className="text-blue-600">
          {selectedRows.size} selected
        </span>
      </div>

      {/* Preview Table */}
      <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allValidSelected && validRows.length > 0}
                  onCheckedChange={toggleAll}
                  disabled={validRows.length === 0}
                />
              </TableHead>
              <TableHead>Row</TableHead>
              <TableHead>Phrase</TableHead>
              <TableHead>Missing Word</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((row) => (
              <TableRow
                key={row.row}
                className={row.valid ? '' : 'bg-red-50'}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(row.row)}
                    onCheckedChange={() => toggleRow(row.row)}
                    disabled={!row.valid}
                  />
                </TableCell>
                <TableCell>{row.row}</TableCell>
                <TableCell className="font-tamil max-w-[200px] truncate">
                  {row.phrase_text}
                </TableCell>
                <TableCell className="font-tamil">
                  {row.missing_word}
                </TableCell>
                <TableCell>
                  {row.valid ? (
                    <Badge variant="default" className="bg-green-500">
                      Valid
                    </Badge>
                  ) : row.isDuplicate ? (
                    <Badge variant="secondary" className="bg-yellow-500 text-white">
                      Duplicate
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      {row.error}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel} disabled={isImporting}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={selectedRows.size === 0 || isImporting}
        >
          {isImporting ? 'Importing...' : `Import ${selectedRows.size} Entries`}
        </Button>
      </div>
    </div>
  );
}

export default CSVImportPreview;
