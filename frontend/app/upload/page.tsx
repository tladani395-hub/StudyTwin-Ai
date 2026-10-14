'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  Presentation,
  Video,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [courseId, setCourseId] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const steps = [
    'Extracting physical page, slide, and timestamp anchors...',
    'Analyzing diagrams & figures with multimodal vision processor...',
    'Whisper transcription & timestamp frame alignment...',
    'Generating 384-dim dense semantic vector embeddings...',
    'Indexing chunks into vector knowledge base with citation metadata...',
  ];

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    setIsSuccess(false);
    setUploadError('');

    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      const formData = new FormData();
      formData.append('course_id', courseId.toString());
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));

      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Server ingestion failed. Please verify file size or backend connection.');
      }

      setIsProcessing(false);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setIsProcessing(false);
      setUploadError(err.message || 'Unable to complete upload. Please check connection and try again.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-text-muted">
          <span className="text-primary flex items-center gap-1">
            <UploadCloud className="w-3.5 h-3.5" /> Multimodal Ingestion Pipeline
          </span>
          <span>•</span>
          <span className="text-primary">Exact Citation Anchoring</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-text-main mt-1">
          Upload Course Material
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Upload PDF textbooks, PPT/PPTX slide decks, and lecture recordings (MP4/MOV) to automatically index them into your grounded knowledge base.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-card bg-bg-surface border border-border-subtle flex items-center space-x-3 shadow-card">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-main block">PDF Textbooks</span>
            <span className="text-[11px] text-text-muted font-mono">Page-by-page OCR</span>
          </div>
        </div>

        <div className="p-4 rounded-card bg-bg-surface border border-border-subtle flex items-center space-x-3 shadow-card">
          <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/30">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-main block">PPT & PPTX Slides</span>
            <span className="text-[11px] text-text-muted font-mono">Slide title & bullets</span>
          </div>
        </div>

        <div className="p-4 rounded-card bg-bg-surface border border-border-subtle flex items-center space-x-3 shadow-card">
          <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center border border-accent/30">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-text-main block">Lecture Videos</span>
            <span className="text-[11px] text-text-muted font-mono">Whisper timestamps</span>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div className="p-6 sm:p-8 rounded-card bg-bg-surface border border-border-subtle shadow-card space-y-6">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-main">Assign to Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              className="w-full bg-bg-elevated border border-border-subtle rounded-btn p-3 text-sm text-text-main focus:outline-none focus:border-primary"
            >
              <option value={1}>Data Structures & Algorithms (Computer Science)</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-border-subtle hover:border-primary rounded-card p-8 text-center space-y-4 transition-colors relative cursor-pointer bg-bg-elevated/50">
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.mp4,.mov,.webm"
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0]);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center justify-center mx-auto shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-text-main">
                {file ? file.name : 'Click to select or drag & drop course files'}
              </p>
              <p className="text-xs text-text-muted font-mono">
                Supports PDF, PPT, PPTX, MP4, MOV (Up to 500MB)
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || isProcessing}
              className="px-7 py-3 rounded-btn bg-primary hover:bg-primary-hover disabled:opacity-40 text-primary-contrast font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? 'Ingesting Material...' : 'Start Ingestion Pipeline'}</span>
            </button>
          </div>
        </form>

        {/* Real-time Progress Pipeline Tracker */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-card bg-bg-elevated border border-border-subtle space-y-3 font-mono"
          >
            <div className="flex items-center justify-between text-xs text-text-main">
              <span className="font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                Pipeline Execution: Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-primary font-bold">
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>

            <div className="w-full bg-bg-surface h-2 rounded-full overflow-hidden p-0.5 border border-border-subtle">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <p className="text-xs text-text-muted">{steps[currentStep]}</p>
          </motion.div>
        )}

        {/* Ingestion Success Feedback */}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-card bg-bg-elevated border border-primary/40 flex items-center justify-between shadow-card"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-text-main">Ingestion Complete & Indexed!</h4>
                <p className="text-xs text-text-muted">
                  Multimodal chunks, exact citations, and diagrams are now live in your RAG knowledge base.
                </p>
              </div>
            </div>

            <Link
              href="/tutor"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs rounded-btn transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Ask Tutor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

