'use client';

import React, { useState, useEffect } from 'react';
import { Network, Sparkles, RefreshCw } from 'lucide-react';
import { api, KnowledgeGraphData } from '@/lib/api';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { useCourseStore } from '@/stores/useCourseStore';
import { useAuthStore } from '@/stores/useAuthStore';

export default function KnowledgeMapPage() {
  const { user } = useAuthStore();
  const { activeCourseId, activeCourse, courses } = useCourseStore();
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadMap = async () => {
    setIsLoading(true);
    try {
      const resolvedCourseId = activeCourseId || (courses.length > 0 ? courses[0].id : 'c-cs-0002-0000-000000000002');
      const data = await api.getKnowledgeMap(resolvedCourseId, user?.id || 1);
      setGraphData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMap();
  }, [activeCourseId]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <span>Visual Curriculum Topology</span>
            <span>•</span>
            <span className="text-primary-400 font-mono">Dynamic BKT Nodes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Curriculum Knowledge Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Explore topic dependencies, prerequisite chains, and concept mastery state.
          </p>
        </div>

        <button
          onClick={loadMap}
          className="px-3.5 py-2 rounded-xl bg-surface-card border border-surface-border hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Knowledge State</span>
        </button>
      </div>

      {graphData ? (
        <KnowledgeGraph nodes={graphData.nodes} edges={graphData.edges} />
      ) : (
        <div className="p-12 text-center text-slate-400">Loading knowledge graph topology...</div>
      )}
    </div>
  );
}
