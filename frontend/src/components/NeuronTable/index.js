import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import "./index.css";

// Constants
const PAGE_SIZE = 50;

function NeuronTable({ fetchTableData, fetchDeps, columns }, ref) {
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Expose a setPageIndex method to the parent
  useImperativeHandle(ref, () => ({
    setPageIndex: (index) => {
      setPageIndex(index);
    },
  }));

  // Fetch data when pageIndex changes
  useEffect(() => {
    const loadData = async () => {
      setLoadingMore(true);
      const result = await fetchTableData({ pageIndex, pageSize: PAGE_SIZE });

      // If first page, replace existing data
      if (pageIndex === 0) {
        setData(result.data);
      } else {
        setData((prev) => [...prev, ...result.data]);
      }

      setTotalRows(result.totalCount);
      setLoadingMore(false);
    };
    loadData();
  }, [pageIndex, ...(fetchDeps || [])]);

  // Setup an IntersectionObserver on the sentinel row
  const sentinelRef = useRef(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
        console.log('observed', entries);
        const entry = entries[0];

        // Only load more if there is more data
        if (entry.isIntersecting && data.length < totalRows) {
          console.log('loading more data');
          setPageIndex((prev) => prev + 1);
        }
      }, { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [data, totalRows]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className="neuron-table" cellSpacing="0" cellPadding="0">
      <colgroup>
        <col className='neuron-table__spacer' />
        {columns.map((col, idx) => (
          <col key={idx} style={{ width: col.width || 'unset' }} />
        ))}
        <col className='neuron-table__spacer' />
      </colgroup>
      <thead className="neuron-table__thead">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="neuron-table__tr">
            <th className="neuron-table__th neuron-table__spacer" />
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="neuron-table__th"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
            <th className="neuron-table__th neuron-table__spacer" />
          </tr>
        ))}
      </thead>
      <tbody className="neuron-table__tbody">
        {table.getRowModel().rows.map((row, index) => (
          <tr
            key={row.id}
            ref={index === Math.round((pageIndex + 0.75) * PAGE_SIZE) ? sentinelRef : null}
            className="neuron-table__tr"
          >
            <td/>
            {row.getVisibleCells().map((cell, idx) => (
              <td
                key={cell.id}
                className="neuron-table__td"
              >
                <div style={{ minWidth: columns[idx].minWidth || 'unset' }} className="neuron-table__cell">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              </td>
            ))}
            <td/>
          </tr>
        ))}
        {/* Spinner row at the bottom, only shown while loading more data */}
        {loadingMore && (
          <tr>
            <td colSpan={columns.length + 2} style={{ textAlign: 'center' }}>
              <div className="neuron-table__spinner" />
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default forwardRef(NeuronTable);
