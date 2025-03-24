import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import "./index.css";

function NeuronTable({ fetchTableData, fetchDeps, columns, pageSizeOptions }, ref) {
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  // Request parameters
  const [pageIndex, setPageIndexInternal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  pageSizeOptions = pageSizeOptions || [10, 20, 30, 40, 50];

  useImperativeHandle(ref, () => ({
    setPageIndex: (pageIndex) => {
      console.log("setPageIndex");
      setPageIndexInternal(pageIndex);
    },
  }));

  // Fetch data whenever pagination changes
  useEffect(() => {
    const loadData = async () => {
      const result = await fetchTableData({ pageIndex, pageSize });
      setData(result.data);
      setTotalRows(result.totalCount);
    };
    loadData();
  }, [pageIndex, pageSize, ...(fetchDeps || [])]);

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(totalRows / pageSize),
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const newPaginationState =
        typeof updater === 'function'
          ? updater({ pageIndex, pageSize })
          : updater;
      setPageIndexInternal(newPaginationState.pageIndex);
      setPageSize(newPaginationState.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  const getColumnStyle = (colDef) => ({
    minWidth: colDef.minSize ? `${colDef.minSize}px` : 'unset',
    maxWidth: colDef.maxSize ? `${colDef.maxSize}px` : 'unset',
  });

  return (
    <div className="neuron-table-container">
      {/* Scrollable section for the table */}
      <div className="neuron-table-scroll">
        <table className="neuron-table" cellSpacing="0" cellPadding="0">
          <thead className="neuron-table__thead">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="neuron-table__tr">
                <th style={{ minWidth: '20px' }} className="neuron-table__th" />
                {headerGroup.headers.map((header) => (
                  <th key={header.id} style={getColumnStyle(header.column.columnDef)} className="neuron-table__th">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
                <th style={{ minWidth: '20px' }} className="neuron-table__th" />
              </tr>
            ))}
          </thead>
          <tbody className="neuron-table__tbody">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="neuron-table__tr">
                <td/>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={getColumnStyle(cell.column.columnDef)} className="neuron-table__td">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                <td/>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="neuron-table__pagination">
        <button
          className="neuron-table__pagination-button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <span className="neuron-table__pagination-info">
          Page {table.getPageCount() ? pageIndex + 1 : 0} of {table.getPageCount() || 0}
        </span>
        <button
          className="neuron-table__pagination-button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>

        <select
          className="neuron-table__pagination-select"
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {pageSizeOptions.map((pageSizeOption) => (
            <option key={pageSizeOption} value={pageSizeOption}>
              {pageSizeOption}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default forwardRef(NeuronTable);
