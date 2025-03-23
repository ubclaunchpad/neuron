import React, { useEffect, useRef } from "react";
import { getLogHistory } from "../../api/logService";
import NeuronTable from '../../components/NeuronTable';
import Notifications from "../../components/Notifications";
import { useDebouncedState } from '../../utils/hookUtils';
import "./index.css";

const columns = [
  {
    accessorKey: 'page',
    header: 'Page',
    width: ''
  },
  {
    accessorFn: (row) => {
      if (!row.class_id) return 'N/A';
      if (!row.class_name) return '[Deleted]';
      return row.class_name;
    },
    id: 'class',
    header: 'Class',
    width: ''
  },
  {
    accessorKey: 'description',
    header: 'Description',
    width: ''
  },
  {
    accessorFn: (row) => {
      if (!row.fk_volunteer_id) return 'N/A';
      if (!row.volunteer_f_name && !row.volunteer_l_name) return '[Deleted]';
      return `${row.volunteer_f_name || ''} ${row.volunteer_l_name || ''}`.trim();
    },
    id: 'volunteer',
    header: 'Volunteer',
    width: ''
  },
  {
    accessorKey: 'signoff',
    header: 'Admin',
    width: ''
  },
  {
    accessorFn: (row) => new Date(row.created_at).toLocaleDateString(),
    id: 'date',
    header: 'Date',
    width: ''
  },
  {
    accessorFn: (row) => new Date(row.created_at).toLocaleTimeString(),
    id: 'time',
    header: 'Time',
    width: ''
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
          <input
            type="text"
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