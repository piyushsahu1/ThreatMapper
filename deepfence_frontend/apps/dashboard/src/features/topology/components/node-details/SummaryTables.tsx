import { useMemo, useState } from 'react';
import { createColumnHelper, SortingState, Table } from 'ui-components';

import {
  ModelConnection,
  ModelContainer,
  ModelContainerImage,
  ModelProcess,
} from '@/api/generated';
import { TruncatedText } from '@/components/TruncatedText';
import { TableHeading } from '@/features/topology/components/node-details/TableHeading';
import { formatMemory, formatPercentage } from '@/utils/number';

export const ProcessTable = ({
  processes,
  onNodeClick,
}: {
  processes: ModelProcess[];
  onNodeClick: (nodeId: string, nodeType: string) => void;
}) => {
  const columnHelper = createColumnHelper<ModelProcess>();
  const [sort, setSort] = useState<SortingState>([
    {
      id: 'memory_usage',
      desc: true,
    },
  ]);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('node_name', {
        cell: (cell) => {
          return (
            <button
              className="dark:text-text-link hover:underline w-full text-left"
              type="button"
              onClick={() => {
                onNodeClick(cell.row.original.node_id, 'process');
              }}
            >
              <TruncatedText text={cell.getValue()} />
            </button>
          );
        },
        header: () => 'Process',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
      columnHelper.accessor('pid', {
        cell: (cell) => {
          return <div className="text-right">{cell.getValue()}</div>;
        },
        header: () => <div className="text-right">PID</div>,
        minSize: 30,
        size: 30,
        maxSize: 50,
      }),
      columnHelper.accessor('cpu_usage', {
        cell: (cell) => {
          return (
            <div className="text-right">
              {formatPercentage(
                (cell.row.original.cpu_usage / (cell.row.original.cpu_max || 100)) * 100,
                {
                  maximumFractionDigits: 1,
                },
              )}
            </div>
          );
        },
        header: () => <div className="text-right">CPU</div>,
        minSize: 30,
        size: 30,
        maxSize: 50,
      }),
      columnHelper.accessor('memory_usage', {
        cell: (cell) => {
          return (
            <div className="text-right">
              {formatMemory(cell.row.original.memory_usage ?? 0)}
            </div>
          );
        },
        header: () => <div className="text-right">Memory</div>,
        minSize: 30,
        size: 30,
        maxSize: 50,
      }),
    ];
  }, []);

  return (
    <div className="space-y-2">
      <TableHeading text="Processes" />
      <Table
        columns={columns}
        data={processes}
        size="compact"
        enablePagination
        pageSize={15}
        enableSorting
        enableColumnResizing
        sortingState={sort}
        onSortingChange={setSort}
        noDataText="No processes"
      />
    </div>
  );
};

export const ContainerTable = ({
  containers,
  onNodeClick,
}: {
  containers: ModelContainer[];
  onNodeClick: (nodeId: string, nodeType: string) => void;
}) => {
  const columnHelper = createColumnHelper<ModelContainer>();
  const [sort, setSort] = useState<SortingState>([
    {
      id: 'memory_usage',
      desc: true,
    },
  ]);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('node_name', {
        cell: (cell) => {
          return (
            <button
              className="dark:text-text-link hover:underline w-full text-left"
              type="button"
              onClick={() => {
                onNodeClick(cell.row.original.node_id, 'container');
              }}
            >
              <TruncatedText text={cell.getValue()} />
            </button>
          );
        },
        header: () => 'Container',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
      columnHelper.accessor('cpu_usage', {
        cell: (cell) => {
          return (
            <div className="text-right">
              {formatPercentage(
                (cell.row.original.cpu_usage / (cell.row.original.cpu_max || 100)) * 100,
                {
                  maximumFractionDigits: 1,
                },
              )}
            </div>
          );
        },
        header: () => <div className="text-right">CPU</div>,
        minSize: 30,
        size: 30,
        maxSize: 50,
      }),
      columnHelper.accessor('memory_usage', {
        cell: (cell) => {
          return (
            <div className="text-right">
              {formatMemory(cell.row.original.memory_usage ?? 0)}
            </div>
          );
        },
        header: () => <div className="text-right">Memory</div>,
        minSize: 30,
        size: 30,
        maxSize: 50,
      }),
    ];
  }, []);

  return (
    <div className="space-y-2">
      <TableHeading text="Containers" />
      <Table
        columns={columns}
        data={containers}
        size="compact"
        enablePagination
        pageSize={15}
        enableSorting
        enableColumnResizing
        sortingState={sort}
        onSortingChange={setSort}
        noDataText="No containers"
      />
    </div>
  );
};

export const ImageTable = ({
  images,
  onNodeClick,
}: {
  images: ModelContainerImage[];
  onNodeClick: (nodeId: string, nodeType: string) => void;
}) => {
  const columnHelper = createColumnHelper<ModelContainerImage>();
  const [sort, setSort] = useState<SortingState>([
    {
      id: 'docker_image_size',
      desc: true,
    },
  ]);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('node_name', {
        cell: (cell) => {
          return (
            <button
              className="dark:text-text-link hover:underline w-full text-left"
              type="button"
              onClick={() => {
                onNodeClick(cell.row.original.node_id, 'container_image');
              }}
            >
              <TruncatedText
                // text={`${cell.row.original.docker_image_name}:${cell.row.original.docker_image_tag}`}
                text={cell.getValue()}
              />
            </button>
          );
        },
        header: () => 'Container',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
      columnHelper.accessor('docker_image_size', {
        cell: (cell) => {
          return <div className="text-right">{cell.getValue()}</div>;
        },
        header: () => <div className="text-right">Size</div>,
        minSize: 30,
        size: 30,
        maxSize: 50,
      }),
    ];
  }, []);

  return (
    <div className="space-y-2">
      <TableHeading text="Container images" />
      <Table
        columns={columns}
        data={images}
        size="compact"
        enablePagination
        pageSize={15}
        enableSorting
        enableColumnResizing
        sortingState={sort}
        onSortingChange={setSort}
        noDataText="No container images"
      />
    </div>
  );
};

export const ConnectionsTable = ({
  type,
  connections,
}: {
  type: 'inbound' | 'outbound';
  connections: ModelConnection[];
}) => {
  const columnHelper = createColumnHelper<ModelConnection>();
  const [sort, setSort] = useState<SortingState>([
    {
      id: 'count',
      desc: true,
    },
  ]);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('node_name', {
        cell: (cell) => {
          return <TruncatedText text={cell.getValue() ?? ''} />;
        },
        header: () => 'Connection',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
      columnHelper.accessor('count', {
        cell: (cell) => {
          return <div className="text-right">{cell.getValue()}</div>;
        },
        header: () => <div className="text-right">Count</div>,
        minSize: 30,
        size: 30,
        maxSize: 50,
      }),
    ];
  }, []);

  return (
    <div className="space-y-2">
      <TableHeading
        text={type === 'inbound' ? 'Inbound connections' : 'Outbound connections'}
      />
      <Table
        columns={columns}
        data={connections}
        size="compact"
        enablePagination
        pageSize={15}
        enableSorting
        enableColumnResizing
        sortingState={sort}
        onSortingChange={setSort}
        noDataText="No connections"
      />
    </div>
  );
};
