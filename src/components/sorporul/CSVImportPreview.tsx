'use client';

/**
 * CSVImportPreview - Preview and confirm CSV import
 * Feature: 005-sorporul
 *
 * Shows parsed CSV rows with validation status.
 * Allows confirming import of valid rows.
 */

import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CSVPreviewRow, CSVValidationError } from '@/types/sorporul';

export interface CSVImportPreviewProps {
  /** Preview rows from API */
  rows: CSVPreviewRow[];
  /** Total rows in file */
  totalRows: number;
  /** Valid rows count */
  validRows: number;
  /** Error rows count */
  errorRows: number;
  /** Validation errors */
  errors: CSVValidationError[];
  /** Callback to confirm import */
  onConfirm: (skipErrors: boolean) => void;
  /** Callback to cancel */
  onCancel: () => void;
  /** Whether import is in progress */
  importing?: boolean;
}

export function CSVImportPreview({
  rows,
  totalRows,
  validRows,
  errorRows,
  errors,
  onConfirm,
  onCancel,
  importing = false,
}: CSVImportPreviewProps) {
  const hasErrors = errorRows > 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Import Preview</CardTitle>
          <CardDescription>
            Review the parsed data before importing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">{totalRows}</p>
              <p className="text-sm text-gray-500">Total Rows</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-2xl font-bold text-green-600">{validRows}</p>
              <p className="text-sm text-green-700">Valid</p>
            </div>
            <div className={`rounded-lg p-4 ${errorRows > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className={`text-2xl font-bold ${errorRows > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {errorRows}
              </p>
              <p className={`text-sm ${errorRows > 0 ? 'text-red-700' : 'text-gray-500'}`}>
                Errors
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Details */}
      {hasErrors && errors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Validation Errors
            </CardTitle>
            <CardDescription>
              The following rows have validation issues and will be skipped
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto">
              <ul className="space-y-1 text-sm">
                {errors.slice(0, 10).map((error, idx) => (
                  <li key={idx} className="text-red-600">
                    Row {error.row}{error.column && `, ${error.column}`}: {error.error}
                  </li>
                ))}
                {errors.length > 10 && (
                  <li className="text-red-400">
                    ... and {errors.length - 10} more errors
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>
            First {Math.min(rows.length, 10)} rows shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead className="w-16">Status</TableHead>
                  <TableHead>Target Word</TableHead>
                  <TableHead>Option A</TableHead>
                  <TableHead>Option B</TableHead>
                  <TableHead>Option C</TableHead>
                  <TableHead>Option D</TableHead>
                  <TableHead className="w-20">Answer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 10).map((row) => (
                  <TableRow
                    key={row.row}
                    className={!row.valid ? 'bg-red-50' : ''}
                  >
                    <TableCell>{row.row}</TableCell>
                    <TableCell>
                      {row.valid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-tamil font-medium">
                      {row.targetWord}
                    </TableCell>
                    <TableCell className="font-tamil text-sm max-w-32 truncate">
                      {row.options.A}
                    </TableCell>
                    <TableCell className="font-tamil text-sm max-w-32 truncate">
                      {row.options.B}
                    </TableCell>
                    <TableCell className="font-tamil text-sm max-w-32 truncate">
                      {row.options.C}
                    </TableCell>
                    <TableCell className="font-tamil text-sm max-w-32 truncate">
                      {row.options.D}
                    </TableCell>
                    <TableCell>
                      <span className={`rounded px-2 py-1 text-xs font-medium ${
                        row.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {row.correctAnswer}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length > 10 && (
            <p className="mt-2 text-sm text-gray-500 text-center">
              Showing 10 of {rows.length} rows
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={importing}>
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(true)}
          disabled={importing || validRows === 0}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {importing ? (
            'Importing...'
          ) : (
            `Import ${validRows} Question${validRows !== 1 ? 's' : ''}`
          )}
        </Button>
      </div>

      {hasErrors && validRows > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {errorRows} row{errorRows !== 1 ? 's' : ''} with errors will be skipped
        </p>
      )}
    </div>
  );
}

export default CSVImportPreview;
