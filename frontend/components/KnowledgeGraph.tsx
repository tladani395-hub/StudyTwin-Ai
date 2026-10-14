'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Bot,
  BookOpen,
  Eye,
  Layers,
  List,
  Search,
  CheckCircle2,
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { KnowledgeNode, KnowledgeEdge } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';

// Lazy-loaded 3D Galaxy Canvas with SSR false to ensure ultra-low initial bundle
const Galaxy3DCanvas = dynamic(() => import('@/components/galaxy/Galaxy3DCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] rounded-2xl bg-gradient-to-b from-[#0B0813] to-[#150F22] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-mono text-white/50">
      <Sparkles className="w-4 h-4 animate-spin mr-2 text-[var(--primary)]" />
      <span>Initializing 3D Starlight Coordinates...</span>
    </div>
  ),
});

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ nodes, edges }) => {
  const { mode } = useAuthStore();
  const { reducedMotion } = useThemeStore();
  const isExplorer = mode === 'explorer';

  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'list'>(reducedMotion ? '2d' : '3d');
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(nodes[3] || nodes[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

  // 2D Spatial Layout Coordinates
  const nodePositions: Record<string, { x: number; y: number }> = {
    DSA: { x: 50, y: 12 },
    Arrays: { x: 22, y: 35 },
    Searching: { x: 22, y: 60 },
    BinarySearch: { x: 22, y: 85 },
    Trees: { x: 50, y: 38 },
    BST: { x: 50, y: 62 },
    TreeTraversal: { x: 50, y: 85 },
    Graphs: { x: 78, y: 38 },
    BFS: { x: 70, y: 72 },
    DFS: { x: 86, y: 72 },
  };

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    return nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nodes, searchQuery]);

  return (
    <div className="space-y-4 font-sans">
      {/* Top View Toggle Bar & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-subtle)]">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === '3d'
                ? 'bg-[var(--primary)] text-[var(--bg-app)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3D Galaxy</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === '2d'
                ? 'bg-[var(--primary)] text-[var(--bg-app)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Blueprint</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-[var(--primary)] text-[var(--bg-app)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Accessible List</span>
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-[var(--text-main)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shadow-sm" /> Mastered (&ge;80%)
          </span>
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[var(--primary)] bg-transparent" /> Learning (50-79%)
          </span>
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-[var(--border-subtle)] bg-transparent" /> Weak (&lt;50%)
          </span>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Selected View Mode */}
        <div className="lg:col-span-2">
          {viewMode === '3d' && (
            <Galaxy3DCanvas
              nodes={nodes}
              edges={edges}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />
          )}

          {viewMode === '2d' && (
            <div className="relative min-h-[450px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 overflow-hidden flex flex-col justify-between shadow-sm">
              <div className="text-xs font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">
                2D Hierarchical Curriculum DAG
              </div>
              <div className="relative w-full h-[360px] my-auto">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {edges.map((edge, idx) => {
                    const srcPos = nodePositions[edge.source];
                    const tgtPos = nodePositions[edge.target];
                    if (!srcPos || !tgtPos) return null;
                    return (
                      <line
                        key={idx}
                        x1={`${srcPos.x}%`}
                        y1={`${srcPos.y}%`}
                        x2={`${tgtPos.x}%`}
                        y2={`${tgtPos.y}%`}
                        stroke="var(--border-subtle)"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    );
                  })}
                </svg>

                {nodes.map((node) => {
                  const pos = nodePositions[node.id] || { x: 50, y: 50 };
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <motion.button
                      key={node.id}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedNode(node)}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm z-10 ${
                        isSelected
                          ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-app)] scale-110 bg-[var(--primary)] text-[var(--bg-app)]'
                          : node.status === 'mastered'
                          ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)] text-[var(--text-main)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      {node.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="min-h-[450px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search concepts or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>

              {/* Accessible List View Items */}
              <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedNode(node)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-app)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs text-[var(--text-main)] block">{node.label}</span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">Category: {node.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[var(--primary)]">
                          {Math.round(node.mastery * 100)}%
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${
                            node.status === 'mastered'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : node.status === 'learning'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {node.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Node Detail & Action Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] tracking-wider">
                    {selectedNode.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedNode.status === 'mastered'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : selectedNode.status === 'learning'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {selectedNode.status}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[var(--text-main)] mt-1 font-display tracking-tight">
                  {selectedNode.label}
                </h3>
              </div>

              {/* BKT Mastery Level Gauge */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">BKT Posterior Mastery:</span>
                  <span className="font-bold text-[var(--primary)]">
                    {Math.round(selectedNode.mastery * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--bg-surface-elevated)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-500 rounded-full"
                    style={{ width: `${Math.round(selectedNode.mastery * 100)}%` }}
                  />
                </div>
              </div>

              {/* Source Document Reference */}
              <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="font-semibold">Linked Source Material:</span>
                </div>
                <div className="text-[11px] font-mono text-[var(--text-main)] pl-5">
                  Algorithms_Lecture_Notes.pdf • Page 142 (or Lecture Video 12:42)
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <Link
                  href={`/assessment?topic=${encodeURIComponent(selectedNode.category || selectedNode.label)}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] hover:opacity-90 text-[var(--bg-app)] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all font-mono"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Practice Concept Quiz</span>
                </Link>

                <Link
                  href={`/tutor?q=${encodeURIComponent(`Explain the concept of ${selectedNode.label}`)}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-app)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-semibold text-xs flex items-center justify-center gap-2 transition-all font-mono"
                >
                  <Bot className="w-4 h-4 text-[var(--primary)]" />
                  <span>Ask Grounded Tutor</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
              <HelpCircle className="w-8 h-8 text-[var(--text-muted)] mb-2" />
              <p className="text-xs font-mono">Select any concept node in the Galaxy or Blueprint to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
