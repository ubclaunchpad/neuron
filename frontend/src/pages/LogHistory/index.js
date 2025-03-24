import React, { useEffect, useRef } from "react";
import { getLogHistory } from "../../api/logService";
import NeuronTable from '../../components/NeuronTable';
import Notifications from "../../components/Notifications";
import SearchInput from "../../components/SearchInput";
import { useDebouncedState } from '../../utils/hookUtils';
import "./index.css";

const columns = [
  {
    accessorKey: 'page',
    header: 'Page',
    minSize: 150,
  },
  {
    // accessorFn: (row) => row.class_name, // return the raw value
    id: 'class',
    header: 'Class',
    cell: ({ row }) => {
      if (!row.original.class_id) return <i>N/A</i>;
      if (!row.original.class_name) return <i>[Deleted]</i>;
      return row.original.class_name;
    },
    minSize: 56,
    maxSize: 200,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    minSize: 100,
  },
  {
    id: 'volunteer',
    header: 'Volunteer',
    cell: ({ row }) => {
      console.log(row);
      if (!row.original.fk_volunteer_id) return <i>'N/A</i>;
      if (!row.original.volunteer_f_name && !row.original.volunteer_l_name) return <i>[Deleted]</i>;
      return `${row.original.volunteer_f_name} ${row.original.volunteer_l_name}`.trim();
    },
    minSize: 80,
  },
  {
    accessorKey: 'signoff',
    header: 'Admin',
    maxSize: 60,
    minSize: 60,
  },
  {
    accessorFn: (row) => new Date(row.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    id: 'date',
    header: 'Date',
    maxSize: 120,
    minSize: 60,
  },
  {
    accessorFn: (row) => new Date(row.created_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }),
    id: 'time',
    header: 'Time',
    minSize: 50,
    maxSize: 50,
  },
];

function LogHistory() {
  const logTable = useRef();
  const [search, setSearch, debouncedSearch] = useDebouncedState('', 500);

  // Refresh when search changes
  useEffect(() => {
    if (logTable.current) {
      logTable.current.setPageIndex(0);
    }
  }, [debouncedSearch]);

  return (
    <main className="content-container">
      <div className="content-heading">
          <h2 className="content-title">Log History</h2>
          <Notifications />
      </div>
      <div className="logs-container">
        {/* Search bar */}
        <div>
          <SearchInput
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <NeuronTable
          ref={logTable}
          columns={columns}
          fetchTableData={({ pageIndex, pageSize }) => 
            getLogHistory(pageIndex, pageSize, debouncedSearch || undefined)}
          fetchDeps={[debouncedSearch]}
        ></NeuronTable>
      </div>
    </main>
  );
}

export default LogHistory;