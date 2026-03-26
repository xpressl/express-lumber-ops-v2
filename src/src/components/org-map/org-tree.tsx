"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { OrgNode, type OrgUnitNode } from "./org-node";

interface OrgTreeProps {
  units: OrgUnitNode[];
  onSelectUnit: (id: string) => void;
  selectedUnitId: string | null;
}

/** Card width (w-56 = 224px) + flex gap (gap-4 = 16px) */
const NODE_SLOT_WIDTH = 240;

/** Connector line SVG between parent and children row */
function ConnectorLines({ childCount }: { childCount: number }) {
  if (childCount === 0) return null;

  const gap = NODE_SLOT_WIDTH;
  const totalWidth = childCount * gap;
  const centerX = totalWidth / 2;
  const lineColor = "oklch(0.7 0.12 85 / 0.35)";

  return (
    <div className="flex justify-center" style={{ height: 40 }}>
      <svg
        width={totalWidth}
        height={40}
        className="overflow-visible"
        style={{ minWidth: totalWidth }}
      >
        {/* Vertical line from parent center down */}
        <line
          x1={centerX}
          y1={0}
          x2={centerX}
          y2={20}
          stroke={lineColor}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          className="animate-draw-line"
        />
        {/* Horizontal bar connecting all children */}
        {childCount > 1 && (
          <line
            x1={gap / 2}
            y1={20}
            x2={totalWidth - gap / 2}
            y2={20}
            stroke={lineColor}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            className="animate-draw-line"
          />
        )}
        {/* Vertical lines down to each child */}
        {Array.from({ length: childCount }).map((_, i) => (
          <line
            key={i}
            x1={gap / 2 + i * gap}
            y1={20}
            x2={gap / 2 + i * gap}
            y2={40}
            stroke={lineColor}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            className="animate-draw-line"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </svg>
    </div>
  );
}

interface BranchProps {
  unit: OrgUnitNode;
  onSelectUnit: (id: string) => void;
  selectedUnitId: string | null;
  depth: number;
  defaultExpanded: boolean;
}

function TreeBranch({ unit, onSelectUnit, selectedUnitId, depth, defaultExpanded }: BranchProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const hasChildren = unit.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <OrgNode
        unit={unit}
        isSelected={selectedUnitId === unit.id}
        isExpanded={expanded}
        hasChildren={hasChildren}
        onSelect={() => onSelectUnit(unit.id)}
        onToggleExpand={() => setExpanded((p) => !p)}
        depth={depth}
      />

      {hasChildren && expanded && (
        <>
          <ConnectorLines childCount={unit.children.length} />
          <div className="flex gap-4 items-start">
            {unit.children.map((child) => (
              <TreeBranch
                key={child.id}
                unit={child}
                onSelectUnit={onSelectUnit}
                selectedUnitId={selectedUnitId}
                depth={depth + 1}
                defaultExpanded={depth + 1 < 2}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OrgTree({ units, onSelectUnit, selectedUnitId }: OrgTreeProps) {
  return (
    <div
      className={cn(
        "relative min-h-[400px] rounded-xl border border-border/30 p-8 overflow-x-auto",
      )}
      style={{
        backgroundColor: "oklch(0.14 0.008 260)",
        backgroundImage: [
          "linear-gradient(oklch(0.45 0.08 85 / 0.04) 1px, transparent 1px)",
          "linear-gradient(90deg, oklch(0.45 0.08 85 / 0.04) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "24px 24px",
      }}
    >
      {/* Blueprint label */}
      <div className="absolute top-3 right-4 text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/20">
        Organization Blueprint
      </div>

      <div className="flex flex-col items-center gap-0">
        {units.map((rootUnit) => (
          <TreeBranch
            key={rootUnit.id}
            unit={rootUnit}
            onSelectUnit={onSelectUnit}
            selectedUnitId={selectedUnitId}
            depth={0}
            defaultExpanded={true}
          />
        ))}
      </div>

    </div>
  );
}
