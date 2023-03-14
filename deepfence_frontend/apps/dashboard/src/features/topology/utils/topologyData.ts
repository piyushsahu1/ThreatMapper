import { remove } from 'lodash-es';

import {
  ApiDocsGraphResult,
  DetailedConnectionSummary,
  DetailedNodeSummary,
  GraphTopologyFilters,
} from '@/api/generated';
import { ApiDiff } from '@/features/topology/types/graph';
import { getObjectKeys } from '@/utils/array';

export function getTopologyDiff(
  data: ApiDocsGraphResult,
  previousData?: ApiDocsGraphResult,
): ApiDiff {
  const nodesDiff: ApiDiff['nodesDiff'] = {
    add: [],
    remove: [],
    update: [],
  };
  const edgesDiff: ApiDiff['edgesDiff'] = {
    add: [],
    remove: [],
    update: [],
  };
  if (!previousData) {
    nodesDiff.add = getObjectKeys(data.nodes).map((key) => {
      return data.nodes[key];
    });
    edgesDiff.add = getObjectKeys(data.edges).map((key) => {
      return data.edges[key];
    });
    return {
      nodesDiff,
      edgesDiff,
    };
  }
  const nodes = new Map<string, DetailedNodeSummary>();
  const prevNodes = new Map<string, DetailedNodeSummary>();
  const edges = new Map<string, DetailedConnectionSummary>();
  const prevEdges = new Map<string, DetailedConnectionSummary>();
  Object.keys(data.nodes).forEach((id) => {
    const node = data.nodes[id];
    if (node.id && node.id.length) nodes.set(node.id, node);
  });
  Object.keys(previousData.nodes).forEach((id) => {
    const node = previousData.nodes[id];
    if (node.id && node.id.length) prevNodes.set(node.id, node);
  });
  prevNodes.forEach((prevNode, id) => {
    if (nodes.has(id)) {
      nodesDiff.update.push(prevNode);
    } else {
      nodesDiff.remove.push(prevNode);
    }
  });
  nodes.forEach((node, id) => {
    if (!prevNodes.has(id)) {
      nodesDiff.add.push(node);
    }
  });

  Object.keys(data.edges).forEach((id) => {
    const edge = data.edges[id];
    edges.set(id, edge);
  });
  Object.keys(previousData.edges).forEach((id) => {
    const edge = previousData.edges[id];
    prevEdges.set(id, edge);
  });
  prevEdges.forEach((prevEdge, id) => {
    if (edges.has(id)) {
      edgesDiff.update.push(prevEdge);
    } else {
      edgesDiff.remove.push(prevEdge);
    }
  });
  edges.forEach((edge, id) => {
    if (!prevEdges.has(id)) {
      edgesDiff.add.push(edge);
    }
  });
  return {
    nodesDiff,
    edgesDiff,
  };
}

/**
 * Hierarchy
 * cloud_provider
 *    region
 *      host
 *        process
 *        container
 *          process
 *    kubernetes_cluster
 *      host
 *        pod
 *          container
 *            process
 */

export enum NodeType {
  psuedo = 'psuedo',
  cloud_provider = 'cloud_provider',
  cloud_region = 'cloud_region',
  kubernetes_cluster = 'kubernetes_cluster',
  host = 'host',
  container = 'container',
  pod = 'pod',
  process = 'process',
}

export class GraphStorageManager {
  private data?: ApiDocsGraphResult;
  private previousData?: ApiDocsGraphResult;
  private diff?: ApiDiff;
  private filters: Pick<
    GraphTopologyFilters,
    'cloud_filter' | 'host_filter' | 'kubernetes_filter' | 'pod_filter' | 'region_filter'
  > = {
    cloud_filter: [],
    host_filter: [],
    kubernetes_filter: [],
    pod_filter: [],
    region_filter: [],
  };
  constructor() {
    this.getData = this.getData.bind(this);
    this.getPreviousData = this.getPreviousData.bind(this);
    this.getDiff = this.getDiff.bind(this);
    this.getFilters = this.getFilters.bind(this);
    this.setGraphData = this.setGraphData.bind(this);
    this.createDiff = this.createDiff.bind(this);
    this.updateFilters = this.updateFilters.bind(this);
    this.addNodeToFilters = this.addNodeToFilters.bind(this);
    this.removeNodeFromFilters = this.removeNodeFromFilters.bind(this);
    this.isNodeExpanded = this.isNodeExpanded.bind(this);
    this.findChildrenIdsOfType = this.findChildrenIdsOfType.bind(this);
  }
  getData() {
    return this.data;
  }
  getPreviousData() {
    return this.previousData;
  }
  getDiff() {
    return this.diff;
  }
  getFilters() {
    return this.filters;
  }
  setGraphData(data: ApiDocsGraphResult) {
    this.previousData = this.data;
    this.data = data;
    this.createDiff();
    this.updateFilters();
  }
  private createDiff() {
    if (this.data) this.diff = getTopologyDiff(this.data, this.previousData);
  }
  private findChildrenIdsOfType({
    parentId,
    findType,
  }: {
    parentId: string;
    findType: NodeType;
  }): string[] {
    const result = [];
    for (const key of Object.keys(this.data?.nodes ?? {})) {
      const node = this.data!.nodes[key];
      if (node.immediate_parent_id === parentId && node.type === findType)
        result.push(node.id!);
    }
    return result;
  }
  updateFilters() {
    // here we see if the latest data doesn't have a node that was filtered upon,
    // if so, we remove it from the filters.
    // we need to start at the top first and then down the tree.
    this.diff?.nodesDiff.remove.forEach((nodeToRemove) => {
      this.removeNodeFromFilters({
        nodeId: nodeToRemove.id!,
        nodeType: nodeToRemove.type as NodeType,
      });
    });
  }
  addNodeToFilters({ nodeId, nodeType }: { nodeId: string; nodeType: string }) {
    if (this.isNodeExpanded({ nodeId, nodeType })) return;

    switch (nodeType) {
      case NodeType.cloud_provider: {
        this.filters.cloud_filter?.push(nodeId);
        break;
      }
      case NodeType.cloud_region: {
        this.filters.region_filter?.push(nodeId);
        break;
      }
      case NodeType.kubernetes_cluster: {
        this.filters.kubernetes_filter?.push(nodeId);
        break;
      }
      case NodeType.host: {
        this.filters.host_filter?.push(nodeId);
        break;
      }
      case NodeType.pod: {
        this.filters.pod_filter?.push(nodeId);
        break;
      }
    }
  }
  removeNodeFromFilters({ nodeId, nodeType }: { nodeId: string; nodeType: string }) {
    if (!this.isNodeExpanded({ nodeId, nodeType })) return;
    switch (nodeType) {
      case NodeType.cloud_provider: {
        remove(this.filters.cloud_filter ?? [], (id) => id === nodeId);
        this.findChildrenIdsOfType({
          parentId: nodeId,
          findType: NodeType.cloud_region,
        }).forEach((regionId) => {
          this.removeNodeFromFilters({
            nodeId: regionId,
            nodeType: NodeType.cloud_region,
          });
        });
        this.findChildrenIdsOfType({
          parentId: nodeId,
          findType: NodeType.kubernetes_cluster,
        }).forEach((regionId) => {
          this.removeNodeFromFilters({
            nodeId: regionId,
            nodeType: NodeType.kubernetes_cluster,
          });
        });
        break;
      }
      case NodeType.cloud_region: {
        remove(this.filters.region_filter ?? [], (id) => id === nodeId);
        this.findChildrenIdsOfType({
          parentId: nodeId,
          findType: NodeType.host,
        }).forEach((hostId) => {
          this.removeNodeFromFilters({
            nodeId: hostId,
            nodeType: NodeType.host,
          });
        });
        break;
      }
      case NodeType.kubernetes_cluster: {
        remove(this.filters.kubernetes_filter ?? [], (id) => id === nodeId);
        this.findChildrenIdsOfType({
          parentId: nodeId,
          findType: NodeType.host,
        }).forEach((hostId) => {
          this.removeNodeFromFilters({
            nodeId: hostId,
            nodeType: NodeType.host,
          });
        });
        break;
      }
      case NodeType.host: {
        remove(this.filters.host_filter ?? [], (id) => id === nodeId);
        break;
      }
      case NodeType.pod: {
        remove(this.filters.pod_filter ?? [], (id) => id === nodeId);
        break;
      }
    }
  }
  isNodeExpanded({ nodeId, nodeType }: { nodeId: string; nodeType: string }): boolean {
    return !!(
      (nodeType === NodeType.cloud_provider &&
        this.filters.cloud_filter?.includes(nodeId)) ||
      (nodeType === NodeType.cloud_region &&
        this.filters.region_filter?.includes(nodeId)) ||
      (nodeType === NodeType.kubernetes_cluster &&
        this.filters.kubernetes_filter?.includes(nodeId)) ||
      (nodeType === NodeType.host && this.filters.host_filter?.includes(nodeId)) ||
      (nodeType === NodeType.pod && this.filters.pod_filter?.includes(nodeId))
    );
  }
}
