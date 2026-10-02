'use client';

import type { ReactNode } from 'react';

export type Column<T> = {
  header: string;
  render: (row: T) => ReactNode;
};

/** Minimal accessible table for control-plane lists. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = 'No rows',
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th key={c.header} scope="col" className="table-th">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-line/50 last:border-0 hover:bg-white/[0.02]"
            >
              {columns.map((c) => (
                <td key={c.header} className="table-td">
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

