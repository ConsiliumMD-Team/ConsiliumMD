import React, { useState } from 'react';
import { GitBranch, Sparkles, Zap, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ArgumentNode, ArgumentEdge } from '../../types';

interface DynamicArgumentFlowGraphProps {
  argumentFlow?: { nodes: ArgumentNode[]; edges: ArgumentEdge[] };
  currentState: string;
}

export const DynamicArgumentFlowGraph: React.FC<DynamicArgumentFlowGraphProps> = ({
  argumentFlow,
  currentState
}) => {
  const [hoveredNode, setHoveredNode] = useState<ArgumentNode | null>(null);

  // Standardized layout coordinates: viewBox 0 0 880 300
  // Column 1 (Input): x=100, y=150
  // Column 2 (Guidelines): x=340, y=60 (Top), y=150 (Mid), y=240 (Bottom)
  // Column 3 (Optimizer): x=580, y=150
  // Column 4 (Decision): x=780, y=150
  const rawNodes = argumentFlow?.nodes && argumentFlow.nodes.length > 0 ? argumentFlow.nodes : null;

  const defaultNodes: ArgumentNode[] = [
    { id: 'query', label: 'Clinical Query Context', type: 'input', x: 100, y: 150, stance: 'Patient EHR Stream' },
    { id: 'acc_aha', label: 'ACC/AHA 2019', type: 'guideline', x: 340, y: 60, stance: 'Aggressive Regimen (Class I)' },
    { id: 'nice', label: 'NICE UK 2023', type: 'guideline', x: 340, y: 150, stance: 'Shared Utility (QoL-Weighted)' },
    { id: 'uspstf', label: 'USPSTF 2022', type: 'guideline', x: 340, y: 240, stance: 'Conservative / Fragile' },
    { id: 'rpd_engine', label: 'CARMA RPD Optimizer', type: 'optimizer', x: 580, y: 150, stance: 'Mathematical Bounds' },
    { id: 'decision', label: `Routing: ${currentState}`, type: 'decision', x: 780, y: 150, stance: 'Final Synthesis' }
  ];

  // Map incoming dynamic nodes into aligned structured layout positions to prevent overlap
  const nodes: ArgumentNode[] = defaultNodes.map((defNode) => {
    if (!rawNodes) return defNode;
    const match = rawNodes.find((n) => n.id === defNode.id || n.type === defNode.type);
    if (match) {
      return {
        ...match,
        x: defNode.x,
        y: defNode.y,
        label: match.label || defNode.label,
        stance: match.stance || defNode.stance
      };
    }
    return defNode;
  });

  const isConflict = currentState === 'ELICIT' || currentState === 'WARN' || currentState === 'ESCALATE';

  return (
    <div className="glass-panel-glow rounded-2xl p-5 flex flex-col gap-4 border border-cyan-500/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dynamic Argument Flow (Network Graph)</h3>
            <p className="text-xs text-cyan-300/80 font-mono">CARMA Adversarial Consensus & Conflict Funnel</p>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 ${
          isConflict 
            ? 'bg-amber-950/80 text-amber-300 border-amber-700 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
            : 'bg-emerald-950/80 text-emerald-300 border-emerald-700 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
        }`}>
          {isConflict ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>ADVERSARIAL DISCORD</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>HIGH CONCORDANCE</span>
            </>
          )}
        </span>
      </div>

      {/* SVG Directed Graph Canvas */}
      <div className="relative h-72 sm:h-80 w-full bg-[#050B16] rounded-xl border border-slate-800/90 overflow-hidden select-none flex items-center justify-center p-3 shadow-inner">
        {/* Subtle Background Matrix Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-35" />

        <svg viewBox="0 0 880 300" className="w-full h-full relative z-10" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="edgeGradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="edgeGradGreen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="edgeGradRed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#FB7185" />
            </linearGradient>
            <linearGradient id="edgeGradPurple" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#00F2FE" />
            </linearGradient>

            <filter id="nodeGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connectors - Column 1 (Query) to Column 2 (Guidelines) */}
          {/* Top: Query (175, 150) -> ACC/AHA (260, 60) */}
          <path d="M 175,150 C 215,150 220,60 260,60" stroke="#00F2FE" strokeWidth="2.5" fill="none" opacity="0.8" strokeDasharray="5 3" />
          {/* Middle: Query (175, 150) -> NICE (260, 150) */}
          <path d="M 175,150 L 260,150" stroke="#00F2FE" strokeWidth="2.5" fill="none" opacity="0.9" />
          {/* Bottom: Query (175, 150) -> USPSTF (260, 240) */}
          <path d="M 175,150 C 215,150 220,240 260,240" stroke="#00F2FE" strokeWidth="2.5" fill="none" opacity="0.8" strokeDasharray="5 3" />

          {/* Connectors - Column 2 (Guidelines) to Column 3 (CARMA Optimizer) */}
          {/* ACC/AHA (420, 60) -> Optimizer (500, 150) */}
          <path
            d="M 420,60 C 460,60 460,150 500,150"
            stroke={isConflict ? 'url(#edgeGradRed)' : 'url(#edgeGradGreen)'}
            strokeWidth="3"
            fill="none"
            opacity="0.95"
          />
          {/* NICE (420, 150) -> Optimizer (500, 150) */}
          <path d="M 420,150 L 500,150" stroke="url(#edgeGradGreen)" strokeWidth="3" fill="none" opacity="0.95" />
          {/* USPSTF (420, 240) -> Optimizer (500, 150) */}
          <path
            d="M 420,240 C 460,240 460,150 500,150"
            stroke={currentState === 'ELICIT' || currentState === 'WARN' ? 'url(#edgeGradRed)' : 'url(#edgeGradGreen)'}
            strokeWidth="3"
            fill="none"
            opacity="0.95"
          />

          {/* Connectors - Column 3 (Optimizer) to Column 4 (Decision) */}
          {/* Optimizer (660, 150) -> Decision (705, 150) */}
          <path d="M 660,150 L 705,150" stroke="url(#edgeGradPurple)" strokeWidth="3.5" fill="none" />

          {/* Calm, Steady Flow Indicator Markers (No frantic animate-ping) */}
          <circle cx="218" cy="105" r="4" fill="#00F2FE" opacity="0.9" />
          <circle cx="460" cy="105" r="4.5" fill={isConflict ? '#F43F5E' : '#10B981'} opacity="0.95" />
          <circle cx="682" cy="150" r="5" fill="#A855F7" opacity="0.95" />

          {/* Nodes Rendering */}
          {nodes.map((node) => {
            const isDecision = node.type === 'decision';
            const isOptimizer = node.type === 'optimizer';
            const isInput = node.type === 'input';
            const width = isDecision ? 150 : isOptimizer ? 160 : isInput ? 150 : 160;
            const height = 56;

            let borderColor = '#334155';
            let bgColor = '#0A1324';
            let titleColor = '#FFFFFF';

            if (isDecision) {
              borderColor = currentState === 'ELICIT' ? '#A855F7' : currentState === 'WARN' ? '#FB7185' : currentState === 'ESCALATE' ? '#EF4444' : currentState === 'RETRIEVE' ? '#F59E0B' : '#10B981';
              bgColor = '#0A152A';
              titleColor = '#38BDF8';
            } else if (isOptimizer) {
              borderColor = '#A855F7';
              bgColor = '#11102A';
              titleColor = '#E9D5FF';
            } else if (isInput) {
              borderColor = '#0284C7';
              bgColor = '#071526';
              titleColor = '#7DD3FC';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x - width / 2}, ${node.y - height / 2})`}
                className="cursor-pointer transition-transform duration-200 hover:scale-105"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node Box */}
                <rect
                  width={width}
                  height={height}
                  rx="12"
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth={isDecision || isOptimizer ? '2.5' : '1.5'}
                  filter="url(#nodeGlow)"
                />

                {/* Node Title */}
                <text
                  x={width / 2}
                  y={height / 2 - 6}
                  textAnchor="middle"
                  fill={titleColor}
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {node.label}
                </text>

                {/* Node Stance Subtitle */}
                {node.stance && (
                  <text
                    x={width / 2}
                    y={height / 2 + 12}
                    textAnchor="middle"
                    fill={
                      node.stance.includes('Aggressive')
                        ? '#38BDF8'
                        : node.stance.includes('Fragile')
                        ? '#F59E0B'
                        : node.stance.includes('Shared')
                        ? '#6EE7B7'
                        : '#94A3B8'
                    }
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="ui-monospace, monospace"
                  >
                    {node.stance}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hovered Node Tooltip Overlay */}
        {hoveredNode && (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 border border-cyan-500/40 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 flex items-center justify-between z-20 shadow-xl backdrop-blur-md">
            <span className="font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              {hoveredNode.label}
            </span>
            <span className="font-mono text-cyan-300 text-xs font-semibold">{hoveredNode.stance}</span>
          </div>
        )}
      </div>

      {/* Edge Legend & Explanation */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
            <strong className="text-white">Concordant Flow</strong>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-5 rounded-full bg-rose-500 shadow-[0_0_8px_#F43F5E]" />
            <strong className="text-white">Adversarial Conflict</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300">
          <Zap className="h-3.5 w-3.5 text-cyan-400" />
          <span>Inverse Optimization Bounds</span>
        </div>
      </div>
    </div>
  );
};
