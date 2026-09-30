'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Module {
  id: string;
  name: string;
  category?: string;
  pass_threshold?: number;
}

interface ParsedQuestion {
  question: string;
  options: string[];
  correct_option: number;
  image_url?: string;
  feedback_correct?: string;
  feedback_incorrect?: string;
  interaction_type?: string;
}

const SAMPLE_RAW_TEXT = `1. What is the fire hazard in this situation?
A) Fuel kept near the hot machine (Correct)
B) Safety helmet
C) Clean floor
D) Emergency exit

2. You see a damaged electrical wire. What should you do?
A) Touch the wire
B) Ignore the wire
C) Report the hazard (Correct)
D) Step over the wire

3. You see a fire. What should you do first?
A) Take your personal bag
B) Raise the alarm (Correct)
C) Walk closer to the fire
D) Continue working

4. Which route should you use to leave during a fire?
A) Route toward the fire
B) Emergency exit route away from the fire (Correct)
C) Restricted equipment area
D) Return to the workplace

5. Smoke is coming from your work area. What should you do?
A) Move toward the smoke
B) Stay and watch
C) Move away and follow the safe route (Correct)
D) Hide near the machine

6. The fire is becoming larger and producing heavy smoke. What should you do?
A) Go closer to the fire
B) Evacuate the dangerous area (Correct)
C) Stand and watch
D) Return to work

7. Which situation creates a higher fire risk?
A) Flammable materials stored safely
B) Clean work area
C) Combustible waste kept near a heat source (Correct)
D) Properly stored equipment

8. The normal route is blocked by fire. What should you do?
A) Take the route toward the fire
B) Use the open safe evacuation route (Correct)
C) Wait beside the fire
D) Go back toward the danger

9. You have reached the exit but left your bag inside. What should you do?
A) Go back for the bag
B) Continue to the safe area (Correct)
C) Wait near the building
D) Enter through another door

10. After leaving the danger area, where should you go?
A) Back inside the building
B) Near the fire
C) Designated assembly point (Correct)
D) Equipment storage area`;

export default function QuestionLoaderPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    async function fetchModules() {
      try {
        const { data, error } = await supabase.from('modules').select('id, name, pass_threshold');
        if (!error && data && data.length > 0) {
          setModules(data as Module[]);
          setSelectedModuleId(data[0].id);
          return;
        }
      } catch (e) {
        console.warn('Failed to fetch modules:', e);
      }

      // Fallback standard modules
      const fallbackMods: Module[] = [
        { id: '11111111-0000-0000-0000-000000000004', name: 'Fire & Explosion Response (Module 1)' },
        { id: '11111111-0000-0000-0000-000000000002', name: 'PPE & Procedures (Module 2)' },
        { id: '11111111-0000-0000-0000-000000000003', name: 'Emergency Drills & Evacuation (Module 3)' },
        { id: '11111111-0000-0000-0000-000000000001', name: 'Confined Space Entry' },
      ];
      setModules(fallbackMods);
      setSelectedModuleId(fallbackMods[0].id);
    }
    fetchModules();
  }, []);

  const handleParseWithGemini = async () => {
    if (!rawText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please paste raw question text first.' });
      return;
    }

    setIsParsing(true);
    setStatusMessage({ type: 'info', text: 'Connecting to Gemini AI and parsing structured assessment items...' });

    try {
      const res = await fetch('/api/admin/parse-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || 'Failed to parse questions.');
      }

      if (Array.isArray(result.questions) && result.questions.length > 0) {
        const formatted = result.questions.map((q: any, idx: number) => ({
          ...q,
          image_url: `/questions/q${(idx % 10) + 1}.jpeg`,
          feedback_correct: q.feedback_correct || 'Correct! Well done.',
          feedback_incorrect: q.feedback_incorrect || 'Not quite, please review safety procedure.',
          interaction_type: idx === 2 ? 'alarm_trigger' : idx === 3 ? 'door_select' : 'standard',
        }));
        setParsedQuestions(formatted);
        setStatusMessage({
          type: 'success',
          text: `Successfully parsed ${formatted.length} questions with Gemini! Review the table below before inserting into Supabase.`,
        });
      } else {
        throw new Error('No valid questions found in AI response.');
      }
    } catch (err: any) {
      console.error('Parse error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Error occurred while parsing with Gemini.' });
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdateQuestionText = (index: number, text: string) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], question: text };
      return copy;
    });
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, text: string) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      const newOpts = [...copy[qIdx].options];
      newOpts[optIdx] = text;
      copy[qIdx] = { ...copy[qIdx], options: newOpts };
      return copy;
    });
  };

  const handleSetCorrectOption = (qIdx: number, optIdx: number) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], correct_option: optIdx };
      return copy;
    });
  };

  const handleAddOption = (qIdx: number) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx] = {
        ...copy[qIdx],
        options: [...copy[qIdx].options, `New Option ${copy[qIdx].options.length + 1}`],
      };
      return copy;
    });
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      if (copy[qIdx].options.length <= 2) return prev; // Keep at least 2 options
      const newOpts = copy[qIdx].options.filter((_, i) => i !== optIdx);
      const newCorrect = copy[qIdx].correct_option >= newOpts.length ? 0 : copy[qIdx].correct_option;
      copy[qIdx] = { ...copy[qIdx], options: newOpts, correct_option: newCorrect };
      return copy;
    });
  };

  const handleDeleteQuestion = (qIdx: number) => {
    setParsedQuestions((prev) => prev.filter((_, i) => i !== qIdx));
  };

  const handleAddBlankQuestion = () => {
    setParsedQuestions((prev) => [
      ...prev,
      {
        question: 'New Question Title',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_option: 0,
        image_url: `/questions/q${(prev.length % 10) + 1}.jpeg`,
        feedback_correct: 'Correct!',
        feedback_incorrect: 'Incorrect, review hazard safety.',
        interaction_type: 'standard',
      },
    ]);
  };

  const handleSaveToSupabase = async () => {
    if (!selectedModuleId) {
      setStatusMessage({ type: 'error', text: 'Please select a target module.' });
      return;
    }
    if (parsedQuestions.length === 0) {
      setStatusMessage({ type: 'error', text: 'No parsed questions to save. Please parse or add questions first.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage({ type: 'info', text: 'Writing questions to Supabase...' });

    try {
      if (replaceExisting) {
        const { error: delError } = await supabase
          .from('mcq_questions')
          .delete()
          .eq('module_id', selectedModuleId);
        if (delError) {
          console.warn('Delete note:', delError);
        }
      }

      // Format payload for mcq_questions table
      const rows = parsedQuestions.map((q, idx) => ({
        module_id: selectedModuleId,
        question: q.question,
        options: q.options,
        correct_option: q.correct_option,
        order_index: idx + 1,
        image_url: q.image_url || `/questions/q${(idx % 10) + 1}.jpeg`,
        feedback_correct: q.feedback_correct || 'Correct! Well done.',
        feedback_incorrect: q.feedback_incorrect || 'Not quite, please review safety procedure.',
        interaction_type: q.interaction_type || 'standard',
      }));

      const { data, error } = await supabase
        .from('mcq_questions')
        .insert(rows)
        .select();

      if (error) {
        throw error;
      }

      setStatusMessage({
        type: 'success',
        text: `🎉 Successfully saved ${rows.length} questions to module "${modules.find(m => m.id === selectedModuleId)?.name || selectedModuleId}" in Supabase!`,
      });
    } catch (err: any) {
      console.error('Save error:', err);
      setStatusMessage({
        type: 'error',
        text: `Failed to insert questions into Supabase: ${err.message || 'Unknown database error'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Bar */}
      <div style={{ background: '#161922', borderBottom: '1px solid #282d3d', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #ff5722, #b02f00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            ⚡
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#ffffff' }}>
              KHOLAN — Gemini Question Loader Tool
            </h1>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Internal Hackathon Tool • LLM Automated MCQ Ingestion</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/supervisor"
            style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 13, border: '1px solid #374151', padding: '6px 12px', borderRadius: 6 }}
          >
            ← Back to Dashboard
          </Link>
          <span style={{ fontSize: 11, background: '#ff5722]/20', color: '#ff5722', fontWeight: 700, padding: '4px 8px', borderRadius: 4, border: '1px solid #ff5722' }}>
            gemini-2.0-flash
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
        {/* Status Notification Banner */}
        {statusMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: statusMessage.type === 'success' ? '#064e3b' : statusMessage.type === 'error' ? '#7f1d1d' : '#1e3a8a',
            border: `1px solid ${statusMessage.type === 'success' ? '#10b981' : statusMessage.type === 'error' ? '#ef4444' : '#3b82f6'}`,
            color: statusMessage.type === 'success' ? '#a7f3d0' : statusMessage.type === 'error' ? '#fecaca' : '#bfdbfe',
          }}>
            <span>{statusMessage.type === 'success' ? '✓' : statusMessage.type === 'error' ? '⚠' : 'ℹ'}</span>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Input Configuration Card */}
        <div style={{ background: '#161922', border: '1px solid #282d3d', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>1. Configure Target Module & Paste Raw Text</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Target Module Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>
                TARGET SAFETY MODULE
              </label>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0f1117',
                  border: '1px solid #374151',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Replace Checkbox & Controls */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>
                DATABASE SYNC OPTIONS
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#0f1117', border: '1px solid #374151', borderRadius: 8 }}>
                <input
                  type="checkbox"
                  id="replaceCheck"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#ff5722', cursor: 'pointer' }}
                />
                <label htmlFor="replaceCheck" style={{ fontSize: 13, color: '#d1d5db', cursor: 'pointer', fontWeight: 500 }}>
                  Replace existing questions for this module before inserting
                </label>
              </div>
            </div>
          </div>

          {/* Raw Text Textarea */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>
                RAW UNSTRUCTURED QUESTION TEXT (Any format: A/B/C/D, 1/2/3/4, marked correct)
              </label>
              <button
                onClick={() => setRawText(SAMPLE_RAW_TEXT)}
                style={{ background: 'transparent', border: 'none', color: '#ff5722', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Load Sample 10 Questions
              </button>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw questions here, e.g.:&#10;1. You see a damaged electrical wire. What should you do?&#10;A) Touch it&#10;B) Ignore it&#10;C) Report it (Correct)&#10;D) Step over"
              style={{
                width: '100%',
                padding: 12,
                background: '#0f1117',
                border: '1px solid #374151',
                borderRadius: 8,
                color: '#ffffff',
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          {/* Action Trigger */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              disabled={isParsing || !rawText.trim()}
              onClick={handleParseWithGemini}
              style={{
                background: isParsing ? '#6b7280' : 'linear-gradient(135deg, #ff5722, #b02f00)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: isParsing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)',
              }}
            >
              <span>{isParsing ? '⏳ Parsing with Gemini AI...' : '✨ Parse & Preview with Gemini'}</span>
            </button>
          </div>
        </div>

        {/* Parsed Review Table */}
        {parsedQuestions.length > 0 && (
          <div style={{ background: '#161922', border: '1px solid #282d3d', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#ffffff' }}>
                  2. Review & Edit Parsed Questions ({parsedQuestions.length})
                </h2>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                  Review and edit options or correct answers before committing to Supabase.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleAddBlankQuestion}
                  style={{
                    background: '#282d3d',
                    color: '#ffffff',
                    border: '1px solid #374151',
                    padding: '8px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add Question
                </button>

                <button
                  disabled={isSaving}
                  onClick={handleSaveToSupabase}
                  style={{
                    background: isSaving ? '#6b7280' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{isSaving ? 'Saving...' : '🚀 Confirm & Save to Supabase'}</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {parsedQuestions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  style={{
                    background: '#0f1117',
                    border: '1px solid #282d3d',
                    borderRadius: 10,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <span style={{
                        background: '#ff5722',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 12,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {qIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#161922',
                          border: '1px solid #374151',
                          borderRadius: 6,
                          color: '#ffffff',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      />
                    </div>

                    <button
                      onClick={() => handleDeleteQuestion(qIdx)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: 18, cursor: 'pointer' }}
                      title="Delete question"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Options List with Radio to select correct */}
                  <div style={{ paddingLeft: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correct_option === optIdx;
                      return (
                        <div
                          key={optIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: isCorrect ? '#064e3b' : '#161922',
                            border: `1px solid ${isCorrect ? '#10b981' : '#374151'}`,
                          }}
                        >
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={isCorrect}
                            onChange={() => handleSetCorrectOption(qIdx, optIdx)}
                            style={{ accentColor: '#10b981', cursor: 'pointer' }}
                            title="Mark as correct option"
                          />
                          <span style={{ fontSize: 11, fontWeight: 700, color: isCorrect ? '#34d399' : '#9ca3af' }}>
                            {String.fromCharCode(65 + optIdx)})
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                            style={{
                              flex: 1,
                              background: 'transparent',
                              border: 'none',
                              color: isCorrect ? '#ffffff' : '#d1d5db',
                              fontSize: 12,
                              outline: 'none',
                            }}
                          />
                          {q.options.length > 2 && (
                            <button
                              onClick={() => handleRemoveOption(qIdx, optIdx)}
                              style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer' }}
                            >
                              -
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer options */}
                  <div style={{ paddingLeft: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => handleAddOption(qIdx)}
                      style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      + Add Option
                    </button>

                    <div style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Image:</span>
                      <code style={{ background: '#161922', padding: '2px 6px', borderRadius: 4, color: '#ff5722' }}>
                        {q.image_url || `/questions/q${(qIdx % 10) + 1}.jpeg`}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Confirm Button */}
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                disabled={isSaving}
                onClick={handleSaveToSupabase}
                style={{
                  background: isSaving ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                }}
              >
                <span>{isSaving ? 'Writing to Supabase...' : `Confirm & Write ${parsedQuestions.length} Questions to Supabase 🚀`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
