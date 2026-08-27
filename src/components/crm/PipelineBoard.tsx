'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCenter,
} from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Ghost, Trash2, Plus, Pencil, X, Check, GripVertical } from 'lucide-react';
import { formatEstimate } from '@/lib/leadEstimate';

const STAGE_COLORS = ['#fc6203', '#2563eb', '#7c3aed', '#d97706', '#db2777', '#059669', '#6b7280', '#dc2626'];

function LeadCard({ lead, stages, isOwner, onToggleGhosted, onDeleteLead, onStageChange }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card:${lead.id}`,
    data: { type: 'card', leadId: lead.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={`card card-hover p-3 space-y-2 touch-none ${lead.isGhosted ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/crm/${lead.id}`} className="min-w-0 hover:underline" onPointerDown={(e) => e.stopPropagation()}>
          <p className="text-xs font-semibold text-[var(--foreground)] truncate flex items-center gap-1.5">
            {lead.company}
            {lead.isGhosted && <Ghost className="w-3 h-3 text-[var(--muted-foreground)] shrink-0" />}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] truncate">{lead.name}</p>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onToggleGhosted(lead)}
            title={lead.isGhosted ? 'Mark as active' : 'Mark as ghosted'}
            className={`p-1 rounded-md transition-colors ${lead.isGhosted ? 'text-[var(--foreground)] bg-[var(--surface-muted)]' : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]'}`}
          >
            <Ghost className="w-3.5 h-3.5" />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDeleteLead(lead.id)}
            title="Delete lead"
            className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {lead.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lead.tags.map((t: any) => (
            <span key={t.id} className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ backgroundColor: `${t.color}1a`, color: t.color }}>
              {t.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border)] text-[10px]">
        <span className="text-[var(--muted-foreground)] truncate">{lead.source}</span>
        {isOwner && <span className="font-semibold text-[var(--foreground)] shrink-0">{formatEstimate(lead)}</span>}
      </div>

      <select
        value={lead.stageId}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onStageChange(lead.id, e.target.value)}
        className="input-minimal w-full px-2 py-1.5 rounded-md text-[11px]"
      >
        {stages.map((st: any) => (
          <option key={st.id} value={st.id}>Move to {st.name}</option>
        ))}
      </select>
    </div>
  );
}

function StageColumn({
  stage, leads, stages, isOwner, canManageStages,
  editingStageId, stageForm, setStageForm, startEditStage, saveStage, cancelEditStage, requestDeleteStage,
  onToggleGhosted, onDeleteLead, onStageChange,
}: any) {
  const { attributes, listeners, setNodeRef: setSortableRef, transform: colTransform, transition, isDragging: colDragging } = useSortable({
    id: `col:${stage.id}`,
    data: { type: 'stage', stageId: stage.id },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `dropzone:${stage.id}`, data: { type: 'stage', stageId: stage.id } });

  const stageTotal = leads.reduce((acc: number, l: any) => acc + (l.budget || 0), 0);
  const isEditing = editingStageId === stage.id;

  return (
    <div
      ref={setSortableRef}
      style={{
        transform: colTransform ? CSS.Transform.toString(colTransform) : undefined,
        transition,
        opacity: colDragging ? 0.5 : 1,
      }}
      className="flex flex-col rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] w-72 shrink-0 max-h-[72vh]"
    >
      {/* Column Header */}
      <div className="p-3 border-b border-[var(--border)]">
        {isEditing ? (
          <div className="space-y-2">
            <input
              autoFocus
              value={stageForm.name}
              onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
              className="input-minimal w-full px-2 py-1 rounded-md text-xs"
            />
            <div className="flex items-center gap-1">
              {STAGE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setStageForm({ ...stageForm, color: c })}
                  className={`w-4 h-4 rounded-full ${stageForm.color === c ? 'ring-2 ring-offset-1 ring-[var(--foreground)]' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => saveStage(stage.id)} className="btn-primary flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-semibold">
                <Check className="w-3 h-3" /> Save
              </button>
              <button onClick={cancelEditStage} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              {canManageStages && (
                <button {...attributes} {...listeners} className="p-0.5 text-[var(--muted-foreground)] cursor-grab active:cursor-grabbing touch-none shrink-0" title="Drag to reorder">
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
              <span className="text-xs font-semibold text-[var(--foreground)] truncate">{stage.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-white text-[var(--muted-foreground)] border border-[var(--border)] shrink-0">
                {leads.length}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isOwner && stageTotal > 0 && <span className="text-[10px] text-[var(--muted-foreground)]">${stageTotal.toLocaleString()}</span>}
              {canManageStages && (
                <>
                  <button onClick={() => startEditStage(stage)} className="p-1 rounded text-[var(--muted-foreground)] hover:bg-white">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => requestDeleteStage(stage)} className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--danger)] hover:bg-white">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cards Container — also the drop zone for cards */}
      <div ref={setDropRef} className={`p-2 space-y-2 overflow-y-auto flex-1 min-h-[80px] rounded-b-xl transition-colors ${isOver ? 'bg-[var(--primary-soft)]' : ''}`}>
        {leads.length === 0 && (
          <p className="text-[11px] text-[var(--muted-foreground)] text-center py-6">Drop leads here</p>
        )}
        {leads.map((lead: any) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            stages={stages}
            isOwner={isOwner}
            onToggleGhosted={onToggleGhosted}
            onDeleteLead={onDeleteLead}
            onStageChange={onStageChange}
          />
        ))}
      </div>
    </div>
  );
}

interface PipelineBoardProps {
  stages: any[];
  leads: any[];
  isOwner: boolean;
  canManageStages: boolean;
  onStageChange: (leadId: string, newStageId: string) => void;
  onToggleGhosted: (lead: any) => void;
  onDeleteLead: (leadId: string) => void;
  onReorderStages: (orderedIds: string[]) => void;
  onCreateStage: (form: { name: string; color: string }) => Promise<void>;
  onUpdateStage: (id: string, form: { name: string; color: string }) => Promise<void>;
  onRequestDeleteStage: (stage: any) => void;
}

export function PipelineBoard({
  stages, leads, isOwner, canManageStages,
  onStageChange, onToggleGhosted, onDeleteLead, onReorderStages,
  onCreateStage, onUpdateStage, onRequestDeleteStage,
}: PipelineBoardProps) {
  const [orderedStages, setOrderedStages] = useState(stages);
  const [activeDrag, setActiveDrag] = useState<any>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState({ name: '', color: STAGE_COLORS[0] });
  const [addingStage, setAddingStage] = useState(false);

  // Keep local ordering in sync when the parent's stage list changes (create/delete/refetch)
  React.useEffect(() => setOrderedStages(stages), [stages]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const startEditStage = (stage: any) => {
    setEditingStageId(stage.id);
    setStageForm({ name: stage.name, color: stage.color });
  };
  const cancelEditStage = () => setEditingStageId(null);
  const saveStage = async (id: string) => {
    await onUpdateStage(id, stageForm);
    setEditingStageId(null);
  };
  const createStage = async () => {
    if (!stageForm.name.trim()) return;
    await onCreateStage(stageForm);
    setStageForm({ name: '', color: STAGE_COLORS[0] });
    setAddingStage(false);
  };

  const handleDragStart = (event: any) => {
    setActiveDrag(event.active.data.current);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDrag(null);
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'card' && overData?.type === 'stage') {
      const lead = leads.find((l) => l.id === activeData.leadId);
      if (lead && lead.stageId !== overData.stageId) {
        onStageChange(activeData.leadId, overData.stageId);
      }
      return;
    }

    if (activeData?.type === 'stage' && overData?.type === 'stage' && active.id !== over.id) {
      const oldIndex = orderedStages.findIndex((s) => `col:${s.id}` === active.id);
      const newIndex = orderedStages.findIndex((s) => `col:${s.id}` === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(orderedStages, oldIndex, newIndex);
      setOrderedStages(next);
      onReorderStages(next.map((s) => s.id));
    }
  };

  const activeLead = activeDrag?.type === 'card' ? leads.find((l) => l.id === activeDrag.leadId) : null;
  const activeStage = activeDrag?.type === 'stage' ? orderedStages.find((s) => s.id === activeDrag.stageId) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        <SortableContext items={orderedStages.map((s) => `col:${s.id}`)} strategy={horizontalListSortingStrategy}>
          {orderedStages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              leads={leads.filter((l) => l.stageId === stage.id)}
              stages={stages}
              isOwner={isOwner}
              canManageStages={canManageStages}
              editingStageId={editingStageId}
              stageForm={stageForm}
              setStageForm={setStageForm}
              startEditStage={startEditStage}
              saveStage={saveStage}
              cancelEditStage={cancelEditStage}
              requestDeleteStage={onRequestDeleteStage}
              onToggleGhosted={onToggleGhosted}
              onDeleteLead={onDeleteLead}
              onStageChange={onStageChange}
            />
          ))}
        </SortableContext>

        {/* Add stage column */}
        {canManageStages && (
          <div className="w-72 shrink-0">
            {addingStage ? (
              <div className="rounded-xl border border-[var(--border)] bg-white p-3 space-y-2">
                <input
                  autoFocus
                  value={stageForm.name}
                  onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                  placeholder="Stage name"
                  className="input-minimal w-full px-2 py-1.5 rounded-md text-xs"
                />
                <div className="flex items-center gap-1">
                  {STAGE_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setStageForm({ ...stageForm, color: c })}
                      className={`w-4 h-4 rounded-full ${stageForm.color === c ? 'ring-2 ring-offset-1 ring-[var(--foreground)]' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={createStage} className="btn-primary flex-1 py-1 rounded-md text-[11px] font-semibold">Add</button>
                  <button onClick={() => setAddingStage(false)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setAddingStage(true); setStageForm({ name: '', color: STAGE_COLORS[0] }); }}
                className="w-full h-11 rounded-xl border border-dashed border-[var(--border-strong)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add stage
              </button>
            )}
          </div>
        )}
      </div>

      <DragOverlay>
        {activeLead && (
          <div className="card p-3 space-y-2 w-72 shadow-lg rotate-2">
            <p className="text-xs font-semibold text-[var(--foreground)]">{activeLead.company}</p>
            <p className="text-[11px] text-[var(--muted-foreground)]">{activeLead.name}</p>
          </div>
        )}
        {activeStage && (
          <div className="rounded-xl bg-white border border-[var(--border)] shadow-lg w-72 p-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeStage.color }} />
            <span className="text-xs font-semibold text-[var(--foreground)]">{activeStage.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
