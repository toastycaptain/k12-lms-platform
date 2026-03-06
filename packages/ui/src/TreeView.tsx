export interface TreeNode {
  id: string;
  label: string;
  meta?: string;
  children?: TreeNode[];
}

interface TreeViewProps {
  nodes: TreeNode[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

function TreeBranch({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const selected = node.id === selectedId;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(node.id)}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
          selected ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
        }`}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        <span>{node.label}</span>
        {node.meta ? (
          <span className={`text-[11px] ${selected ? "text-white/70" : "text-slate-400"}`}>
            {node.meta}
          </span>
        ) : null}
      </button>
      {node.children?.length ? (
        <ul className="mt-1 space-y-1">
          {node.children.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function TreeView({ nodes, selectedId, onSelect }: TreeViewProps) {
  return (
    <ul className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2">
      {nodes.map((node) => (
        <TreeBranch key={node.id} node={node} depth={0} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </ul>
  );
}
