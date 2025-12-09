import { useState, useCallback, useRef, useEffect } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Connection,
  Node,
  Edge,
  NodeTypes,
  MarkerType,
  Handle,
  Position,
  NodeProps,
  BackgroundVariant,
  SelectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Network, ChevronDown, ChevronRight, MoreVertical, Edit3, X } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import type { EdgeType } from '../types'

// Custom node component
interface PurposeNodeData extends Record<string, unknown> {
  label: string
  onLabelChange?: (nodeId: string, newLabel: string) => void
}

function PurposeNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as PurposeNodeData
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(nodeData.label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    setIsEditing(true)
    setEditValue(nodeData.label)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue.trim() && editValue !== nodeData.label) {
      nodeData.onLabelChange?.(id, editValue.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(data.label as string)
    }
  }

  return (
    <div
      className={`px-4 py-3 rounded-xl bg-dark-800 border-2 transition-all min-w-[120px] max-w-[200px] ${
        selected ? 'border-primary-500 shadow-lg shadow-primary-500/20' : 'border-dark-600'
      }`}
      onDoubleClick={handleDoubleClick}
    >
      {/* Left handle - input (this is a means to achieve something) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-transparent !border-0 !rounded-none !-left-2"
        id="input"
      >
        <svg viewBox="0 0 10 10" className="w-full h-full">
          <polygon points="10,5 0,0 0,10" fill="#60a5fa" />
        </svg>
      </Handle>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-center text-dark-100 font-medium focus:outline-none"
        />
      ) : (
        <div className="text-center text-dark-100 font-medium truncate">
          {nodeData.label}
        </div>
      )}

      {/* Right handle - output (what is the means to achieve this?) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-5 !h-5 !bg-transparent !border-0 !rounded-none !-right-2.5"
        id="output"
      >
        <svg viewBox="0 0 10 10" className="w-full h-full">
          <polygon points="0,0 10,5 0,10" fill="#60a5fa" />
        </svg>
      </Handle>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  purposeNode: PurposeNodeComponent,
}

// Edge styles based on type
const getEdgeStyle = (type: EdgeType) => {
  switch (type) {
    case 'purpose':
      return { stroke: '#f59e0b', strokeWidth: 2 } // yellow
    case 'means':
      return { stroke: '#10b981', strokeWidth: 2 } // green
    case 'related':
      return { stroke: '#0ea5e9', strokeWidth: 2, strokeDasharray: '5,5' } // blue dashed
    default:
      return { stroke: '#64748b', strokeWidth: 2 }
  }
}

// Add Node Button component that uses useReactFlow
function AddNodeButton({ graphId, addPurposeNode }: { graphId: string; addPurposeNode: (graphId: string, label: string, position: { x: number; y: number }) => string }) {
  const { screenToFlowPosition } = useReactFlow()

  const handleAddNode = () => {
    // Get the center of the current viewport
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const position = screenToFlowPosition({ x: centerX, y: centerY })
    addPurposeNode(graphId, '新しいノード', position)
  }

  return (
    <motion.button
      onClick={handleAddNode}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors shadow-lg"
    >
      <Plus className="w-4 h-4 text-white" />
      <span className="text-white text-sm font-medium">ノード追加</span>
    </motion.button>
  )
}

// New node input popup component that can use useReactFlow
interface NewNodePopupProps {
  pendingConnection: {
    sourceId: string
    screenPosition: { x: number; y: number }
  }
  graphId: string
  addPurposeNode: (graphId: string, label: string, position: { x: number; y: number }) => string
  addPurposeEdge: (graphId: string, source: string, target: string, type: EdgeType) => void
  onClose: () => void
}

function NewNodePopup({ pendingConnection, graphId, addPurposeNode, addPurposeEdge, onClose }: NewNodePopupProps) {
  const { screenToFlowPosition } = useReactFlow()
  const [label, setLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    // Calculate position relative to the popup's parent container
    if (popupRef.current) {
      const parent = popupRef.current.parentElement
      if (parent) {
        const parentRect = parent.getBoundingClientRect()
        setPopupPosition({
          x: pendingConnection.screenPosition.x - parentRect.left,
          y: pendingConnection.screenPosition.y - parentRect.top,
        })
      }
    }
  }, [pendingConnection.screenPosition])

  const handleCreate = () => {
    if (!label.trim()) return

    const flowPosition = screenToFlowPosition(pendingConnection.screenPosition)
    const newNodeId = addPurposeNode(graphId, label.trim(), flowPosition)
    addPurposeEdge(graphId, pendingConnection.sourceId, newNodeId, 'means')
    onClose()
  }

  return (
    <div
      ref={popupRef}
      className="absolute z-20 bg-dark-800 border border-dark-600 rounded-lg shadow-xl p-3"
      style={{
        left: popupPosition?.x ?? pendingConnection.screenPosition.x,
        top: popupPosition?.y ?? pendingConnection.screenPosition.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCreate()
          if (e.key === 'Escape') onClose()
        }}
        placeholder="ノード名を入力..."
        className="w-48 bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleCreate}
          className="flex-1 px-3 py-1 bg-primary-500 hover:bg-primary-600 rounded text-sm text-white"
        >
          作成
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-3 py-1 bg-dark-700 hover:bg-dark-600 rounded text-sm text-dark-300"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}

export function PurposeGraphView() {
  const {
    purposeGraphs,
    selectedGraphId,
    addPurposeGraph,
    deletePurposeGraph,
    selectPurposeGraph,
    addPurposeNode,
    updatePurposeNode,
    deletePurposeNode,
    addPurposeEdge,
    deletePurposeEdge,
    updateGraphName,
  } = useAppStore()

  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[])

  const [showNewGraphInput, setShowNewGraphInput] = useState(false)
  const [newGraphName, setNewGraphName] = useState('')
  const [graphsExpanded, setGraphsExpanded] = useState(true)
  const [graphMenuId, setGraphMenuId] = useState<string | null>(null)
  const [editingGraphId, setEditingGraphId] = useState<string | null>(null)
  const [editingGraphName, setEditingGraphName] = useState('')

  // New node creation from edge drag
  const [pendingConnection, setPendingConnection] = useState<{
    sourceId: string
    screenPosition: { x: number; y: number }
  } | null>(null)

  const selectedGraph = purposeGraphs.find((g) => g.id === selectedGraphId)

  // Sync nodes and edges from store
  useEffect(() => {
    if (selectedGraph) {
      const flowNodes = selectedGraph.nodes.map((n) => ({
        id: n.id,
        type: 'purposeNode',
        position: n.position,
        data: {
          label: n.label,
          onLabelChange: (nodeId: string, newLabel: string) => {
            updatePurposeNode(selectedGraph.id, nodeId, { label: newLabel })
          },
        },
      }))

      const flowEdges: Edge[] = selectedGraph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'default',
        style: getEdgeStyle(e.type),
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getEdgeStyle(e.type).stroke,
        },
        data: { edgeType: e.type },
      }))

      setNodes(flowNodes)
      setEdges(flowEdges)
    } else {
      setNodes([])
      setEdges([])
    }
  }, [selectedGraph, setNodes, setEdges, updatePurposeNode])

  // Handle new connection
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!selectedGraph || !connection.source || !connection.target) return

      // All connections are means relationships (left to right flow)
      addPurposeEdge(selectedGraph.id, connection.source, connection.target, 'means')
    },
    [selectedGraph, addPurposeEdge]
  )

  // Handle node position change for multiple nodes
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, _node: Node, draggedNodes: Node[]) => {
      if (selectedGraph) {
        draggedNodes.forEach((node) => {
          updatePurposeNode(selectedGraph.id, node.id, { position: node.position })
        })
      }
    },
    [selectedGraph, updatePurposeNode]
  )

  // Handle node deletion
  const onNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      if (selectedGraph) {
        nodesToDelete.forEach((node) => {
          deletePurposeNode(selectedGraph.id, node.id)
        })
      }
    },
    [selectedGraph, deletePurposeNode]
  )

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      if (selectedGraph) {
        edgesToDelete.forEach((edge) => {
          deletePurposeEdge(selectedGraph.id, edge.id)
        })
      }
    },
    [selectedGraph, deletePurposeEdge]
  )

  // Double click on canvas to add node
  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!selectedGraph) return

      const reactFlowBounds = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect()
      if (!reactFlowBounds) return

      const position = {
        x: event.clientX - reactFlowBounds.left - 60,
        y: event.clientY - reactFlowBounds.top - 20,
      }

      addPurposeNode(selectedGraph.id, '新しいノード', position)
    },
    [selectedGraph, addPurposeNode]
  )

  // Handle connection end - if dropped on empty space, show new node input
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: { fromNode?: Node | null; fromHandle?: { id?: string | null } | null }) => {
      if (!selectedGraph) return

      // Only create new node if dragging from output handle and not connected to a target
      if (!connectionState.fromNode || connectionState.fromHandle?.id !== 'output') return

      const target = event.target as HTMLElement
      // Check if dropped on a node or handle (if so, connection was made)
      if (target.closest('.react-flow__node') || target.closest('.react-flow__handle')) return

      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

      setPendingConnection({
        sourceId: connectionState.fromNode.id,
        screenPosition: { x: clientX, y: clientY },
      })
    },
    [selectedGraph]
  )

  const handleCreateGraph = () => {
    if (newGraphName.trim()) {
      addPurposeGraph(newGraphName.trim())
      setNewGraphName('')
      setShowNewGraphInput(false)
    }
  }

  const handleRenameGraph = (id: string) => {
    if (editingGraphName.trim()) {
      updateGraphName(id, editingGraphName.trim())
      setEditingGraphId(null)
      setEditingGraphName('')
    }
  }

  return (
    <div className="h-full flex">
      {/* Graph List Sidebar */}
      <div className="w-64 h-full border-r border-dark-700/50 flex flex-col bg-dark-900/30">
        {/* Header */}
        <div className="p-4 border-b border-dark-700/50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-dark-100">Purpose Graph</h2>
            <motion.button
              onClick={() => setShowNewGraphInput(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
            </motion.button>
          </div>
          <p className="text-xs text-dark-500">目的-手段の関係を視覚化</p>
        </div>

        {/* New Graph Input - Outside collapsed section */}
        {showNewGraphInput && (
          <div className="p-2 border-b border-dark-700/50">
            <div className="flex items-center gap-2 p-2">
              <Network className="w-4 h-4 text-dark-400" />
              <input
                type="text"
                value={newGraphName}
                onChange={(e) => setNewGraphName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateGraph()
                  if (e.key === 'Escape') setShowNewGraphInput(false)
                }}
                placeholder="Graph name..."
                className="flex-1 bg-dark-800 border border-dark-700 rounded px-2 py-1 text-sm text-dark-200 focus:outline-none focus:border-primary-500"
                autoFocus
              />
              <button onClick={handleCreateGraph} className="text-accent-green hover:text-accent-green/80">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => setShowNewGraphInput(false)} className="text-dark-500 hover:text-dark-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Graphs Section */}
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={() => setGraphsExpanded(!graphsExpanded)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-dark-500 uppercase tracking-wider hover:bg-dark-800/50 transition-colors"
          >
            {graphsExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span>Graphs</span>
            <span className="ml-auto text-dark-600">{purposeGraphs.length}</span>
          </button>

          <AnimatePresence initial={false}>
            {graphsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-2">
                  {/* Graph List */}
                  {purposeGraphs.map((graph) => (
                    <div key={graph.id} className="relative">
                      {editingGraphId === graph.id ? (
                        <div className="flex items-center gap-2 px-3 py-2">
                          <Network className="w-4 h-4 text-dark-400" />
                          <input
                            type="text"
                            value={editingGraphName}
                            onChange={(e) => setEditingGraphName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameGraph(graph.id)
                              if (e.key === 'Escape') setEditingGraphId(null)
                            }}
                            onBlur={() => handleRenameGraph(graph.id)}
                            className="flex-1 bg-dark-800 border border-dark-700 rounded px-2 py-1 text-sm text-dark-200 focus:outline-none focus:border-primary-500"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => selectPurposeGraph(graph.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group cursor-pointer ${
                            selectedGraphId === graph.id
                              ? 'bg-primary-500/20 text-primary-400'
                              : 'text-dark-300 hover:bg-dark-800'
                          }`}
                        >
                          <Network className="w-4 h-4" />
                          <span className="truncate flex-1">{graph.name}</span>
                          <span className="text-xs text-dark-500">{graph.nodes.length}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setGraphMenuId(graphMenuId === graph.id ? null : graph.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dark-700 rounded"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Graph Menu */}
                      {graphMenuId === graph.id && (
                        <div className="absolute right-2 top-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-10 py-1">
                          <button
                            onClick={() => {
                              setEditingGraphId(graph.id)
                              setEditingGraphName(graph.name)
                              setGraphMenuId(null)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-dark-300 hover:bg-dark-700 flex items-center gap-2"
                          >
                            <Edit3 className="w-3 h-3" />
                            Rename
                          </button>
                          <button
                            onClick={() => {
                              deletePurposeGraph(graph.id)
                              setGraphMenuId(null)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-accent-red hover:bg-dark-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {purposeGraphs.length === 0 && !showNewGraphInput && (
                    <div className="text-center py-8 text-dark-500">
                      <Network className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No graphs yet</p>
                      <button
                        onClick={() => setShowNewGraphInput(true)}
                        className="text-primary-400 hover:text-primary-300 text-sm mt-1"
                      >
                        Create your first graph
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-dark-700/50">
          <p className="text-xs text-dark-500 mb-2">操作:</p>
          <div className="space-y-1 text-xs text-dark-400">
            <p>● → ● 接続でフロー作成</p>
            <p>左 = 目的 / 右 = 手段</p>
          </div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 h-full bg-dark-900 relative">
        {selectedGraph ? (
          <ReactFlowProvider>
            <AddNodeButton graphId={selectedGraph.id} addPurposeNode={addPurposeNode} />
            {/* New node input popup */}
            {pendingConnection && (
              <NewNodePopup
                pendingConnection={pendingConnection}
                graphId={selectedGraph.id}
                addPurposeNode={addPurposeNode}
                addPurposeEdge={addPurposeEdge}
                onClose={() => setPendingConnection(null)}
              />
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onConnectEnd={onConnectEnd}
              onNodeDragStop={onNodeDragStop}
              onNodesDelete={onNodesDelete}
              onEdgesDelete={onEdgesDelete}
              onDoubleClick={onPaneDoubleClick}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              deleteKeyCode={['Backspace', 'Delete']}
              panOnDrag={[2]}
              selectionOnDrag
              selectionMode={SelectionMode.Partial}
              zoomOnScroll
              className="bg-dark-900"
            >
              <Controls className="!bg-dark-800 !border-dark-700 !rounded-lg [&>button]:!bg-dark-800 [&>button]:!border-dark-700 [&>button]:!text-dark-300 [&>button:hover]:!bg-dark-700" />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
            </ReactFlow>
          </ReactFlowProvider>
        ) : (
          <div className="h-full flex items-center justify-center text-dark-500">
            <div className="text-center">
              <Network className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">Select a graph or create a new one</p>
              <p className="text-sm mb-4">
                Double-click on canvas to add nodes<br />
                Drag from handles to connect
              </p>
              <button
                onClick={() => setShowNewGraphInput(true)}
                className="text-primary-400 hover:text-primary-300"
              >
                Create new graph
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
