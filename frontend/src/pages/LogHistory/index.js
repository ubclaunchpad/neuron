import React, { useEffect, useRef } from "react";
import { getLogHistory } from '../../api/logService';
import NeuronTable from '../../components/NeuronTable';
import Notifications from "../../components/Notifications";
import SearchInput from "../../components/SearchInput";
import { useDebouncedState } from '../../utils/hookUtils';
import "./index.css";

const columns = [
  {
    accessorKey: 'page',
    header: 'Page',
  },
  {
    id: 'class',
    header: 'Class',
    cell: ({ row }) => {
      if (!row.original.class_id) return <i>N/A</i>;
      if (!row.original.class_name) return <i>[Deleted]</i>;
      return row.original.class_name;
    },
    minWidth: 'calc-size(max-content, min(size, 150px))',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    minWidth: 'calc-size(max-content, min(size, 200px))',
  },
  {
    id: 'volunteer',
    header: 'Volunteer',
    cell: ({ row }) => {
      if (!row.original.fk_volunteer_id) return <i>'N/A</i>;
      if (!row.original.volunteer_f_name && !row.original.volunteer_l_name) return <i>[Deleted]</i>;
      return `${row.original.volunteer_f_name} ${row.original.volunteer_l_name}`.trim();
    },
  },
  {
    accessorKey: 'signoff',
    header: 'Admin',
    width: '52px',
    minWidth: '52px',
  },
  {
    accessorFn: (row) => new Date(row.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    id: 'date',
    header: 'Date',
    width: '84px',
    minWidth: '84px',
  },
  {
    accessorFn: (row) => new Date(row.created_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }),
    id: 'time',
    header: 'Time',
    width: '52px',
    minWidth: '52px',
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

        <div className="log-table-container">
          <NeuronTable
            ref={logTable}
            columns={columns}
            fetchTableData={({ pageIndex, pageSize }) => 
              getLogHistory(pageIndex, pageSize, debouncedSearch || undefined)}
            fetchDeps={[debouncedSearch]}
          ></NeuronTable>
        </div>
      </div>
    </main>
  );
}

export default LogHistory;

// Some helper arrays to randomize data
const pages = [
  'Member Management',
  'Coverage Request',
  'Schedule',
  'Classes',
  'Settings',
];

const classNames = [
  'Art From the Heart',
  'Moving and Breathing with Qi Gong & Tai Chi Principles',
  'Yoga Foundations',
  'Afternoon Unwind Yoga',
  undefined, // Will render as <i>N/A</i>
];

const volunteers = [
  { id: 1, f_name: 'Jessie',  l_name: 'Megan' },
  { id: 2, f_name: 'Martin',  l_name: 'D' },
  { id: 3, f_name: 'Bonnie',  l_name: 'Lu' },
  { id: 4, f_name: 'Jane',    l_name: 'Doe' },
  { id: 5, f_name: 'John',    l_name: 'Smith' },
  { id: 6, f_name: 'Brianna', l_name: 'T' },
  { id: 7, f_name: 'Kyle',    l_name: 'R' },
];

const signoffs = ['MJ', 'Admin', 'Sys', 'JB'];

const descriptions = [
  'Account verified',
  'Coverage request submitted',
  'Coverage request on Oct 23, 2024',
  'Class canceled for next session',
  'Password changed',
  'Edited volunteer info',
  'Created instance',
  'Deleted instance',
  'Checked in for volunteer',
  'Admin updated volunteer schedule',
  'Unenrolled volunteer from Monday session',
  'Published new classes for Winter 2025',
];

function randomArrayItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString(); // Return an ISO string (e.g. 2024-10-22T11:00:00Z)
}

// Generate 100 rows of data
const allData = Array.from({ length: 1000 }, (_, i) => {
  // Randomly decide if this row has a class or not
  const hasClass = Math.random() > 0.2; // 80% chance to have a valid class

  // Randomly decide if this row has a volunteer or not
  const hasVolunteer = Math.random() > 0.15; // 85% chance to have a volunteer

  const volunteerObj = hasVolunteer ? randomArrayItem(volunteers) : undefined;
  const className = hasClass ? randomArrayItem(classNames) : undefined;

  return {
    id: i + 1,
    page: randomArrayItem(pages),
    class_id: hasClass ? i + 1 : undefined,
    class_name: className,
    description: randomArrayItem(descriptions),
    fk_volunteer_id: volunteerObj ? volunteerObj.id : null,
    volunteer_f_name: volunteerObj ? volunteerObj.f_name : undefined,
    volunteer_l_name: volunteerObj ? volunteerObj.l_name : undefined,
    signoff: randomArrayItem(signoffs),
    // Generate random date between Jan 1, 2024 and Dec 31, 2025
    created_at: randomDate(new Date('2024-01-01'), new Date('2025-12-31')),
  };
});

export function getLogHistory2(pageIndex, pageSize, search) {
  // If there's a search term, filter the data
  let filteredData = allData;
  if (search) {
    const lowerSearch = search.toLowerCase();
    filteredData = allData.filter((row) => {
      const inPage = row.page.toLowerCase().includes(lowerSearch);
      const inClassName = row.class_name
        ? row.class_name.toLowerCase().includes(lowerSearch)
        : false;
      const inDescription = row.description.toLowerCase().includes(lowerSearch);
      const volunteerName = (row.volunteer_f_name + ' ' + row.volunteer_l_name).toLowerCase();
      const inVolunteer = volunteerName.includes(lowerSearch);

      return inPage || inClassName || inDescription || inVolunteer;
    });
  }

  // Pagination
  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedData = filteredData.slice(startIndex, endIndex);

  // Return a promise that resolves with data and total count
  return Promise.resolve({
    data: pagedData,
    totalCount: filteredData.length,
  });
}
