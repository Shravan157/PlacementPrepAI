import React, { useState } from 'react';
import { generateQuestion, submitAnswer } from '../../api/practice';
import { evaluateAnswer } from '../../api/evaluation';

const TOPICS_BY_SUBJECT = {
  dbms: ['normalization', 'transactions', 'indexing', 'joins', 'acid_properties', 'sql_queries'],
  dsa: ['binary_trees', 'graphs', 'dynamic_programming', 'arrays_strings', 'linked_lists', 'sorting_searching'],
  os: ['cpu_scheduling', 'deadlocks', 'memory_management', 'virtual_memory', 'process_synchronization'],
  cn: ['tcp_ip_layers', 'routing_algorithms', 'dns_http', 'socket_programming', 'ip_addressing'],
  oop: ['polymorphism', 'inheritance', 'encapsulation', 'abstraction', 'design_patterns'],
};

export default function Practice() {
  const [step, setStep] = useState(1); // 1: Configure, 2: Interview, 3: Evaluate

  // Form State
  const [selectedSubject, setSelectedSubject] = useState('dbms');
  const [selectedTopic, setSelectedTopic] = useState('normalization');
  const [companyType, setCompanyType] = useState('product_based');
  const [difficulty, setDifficulty] = useState('medium');

  // Interactive Flow State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswerText, setUserAnswerText] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  // Subject change handler — auto-select first topic
  const handleSubjectChange = (e) => {
    const subj = e.target.value;
    setSelectedSubject(subj);
    setSelectedTopic(TOPICS_BY_SUBJECT[subj]?.[0] || 'general');
  };

  // Step 1 -> 2: Generate Question via RAG + LLM
  const handleGenerateQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const q = await generateQuestion({
        subject: selectedSubject,
        topic: selectedTopic,
        company_type: companyType,
        difficulty_tag: difficulty,
        generation_method: 'rag_generated',
      });
      setCurrentQuestion(q);
      setUserAnswerText('');
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate question. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> 3: Submit Answer & Evaluate via LLM Rubric
  const handleSubmitAndEvaluate = async (e) => {
    e.preventDefault();
    if (!userAnswerText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      // 1. Submit Answer
      const ans = await submitAnswer({
        question_id: currentQuestion.id,
        answer_text: userAnswerText.trim(),
      });
      setSubmittedAnswer(ans);

      // 2. Evaluate Answer
      const evalRes = await evaluateAnswer(ans.id);
      setEvaluation(evalRes);
      setStep(3);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Evaluation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setCurrentQuestion(null);
    setUserAnswerText('');
    setSubmittedAnswer(null);
    setEvaluation(null);
    setError(null);
  };

  return (
    <div className="practice-page">
      <header className="page-intro">
        <div>
          <p className="eyebrow">Mock interview workspace</p>
          <h1 className="page-heading">Self-RAG Practice Workspace</h1>
          <p className="page-lede">
            Questions synthesized in real time from CS syllabus chunks and evaluated against standard interview rubrics.
          </p>
        </div>
        <span className="status-tag status-preview">Live RAG System</span>
      </header>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 20, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: '.9rem', border: '1px solid #f87171' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="practice-layout">
        <section className="ledger-card" style={{ flex: 2 }}>
          {/* Stepper Navigation */}
          <div className="stepper" aria-label="Practice stages">
            <div className={`step ${step === 1 ? 'active' : ''}`}>
              <strong>01 · Configure</strong>
              <span>Target & Track</span>
            </div>
            <div className={`step ${step === 2 ? 'active' : ''}`}>
              <strong>02 · Interview</strong>
              <span>Live Question</span>
            </div>
            <div className={`step ${step === 3 ? 'active' : ''}`}>
              <strong>03 · Evaluate</strong>
              <span>Rubric Feedback</span>
            </div>
          </div>

          {/* STAGE 01: CONFIGURE */}
          {step === 1 && (
            <form onSubmit={handleGenerateQuestion} style={{ marginTop: 24 }}>
              <h2 className="ledger-card-title" style={{ fontSize: '1.25rem', marginBottom: 16 }}>
                Session Configuration
              </h2>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="field-label" htmlFor="subject">Subject</label>
                  <select id="subject" className="field-select" value={selectedSubject} onChange={handleSubjectChange}>
                    <option value="dbms">DBMS (Database Systems)</option>
                    <option value="dsa">DSA (Data Structures & Algos)</option>
                    <option value="os">OS (Operating Systems)</option>
                    <option value="cn">CN (Computer Networks)</option>
                    <option value="oop">OOP (Object Oriented Programming)</option>
                  </select>
                </div>

                <div>
                  <label className="field-label" htmlFor="topic">Syllabus Topic</label>
                  <select id="topic" className="field-select" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
                    {(TOPICS_BY_SUBJECT[selectedSubject] || []).map((t) => (
                      <option key={t} value={t}>
                        {t.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div>
                  <label className="field-label" htmlFor="track">Company Track</label>
                  <select id="track" className="field-select" value={companyType} onChange={(e) => setCompanyType(e.target.value)}>
                    <option value="product_based">Product Based Archetype</option>
                    <option value="mass_recruiter_it">Mass Recruiter IT Archetype</option>
                    <option value="fintech_core">Fintech Core Archetype</option>
                  </select>
                </div>

                <div>
                  <label className="field-label" htmlFor="difficulty">Difficulty Level</label>
                  <select id="difficulty" className="field-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="easy">Easy (Definitions & Core Concepts)</option>
                    <option value="medium">Medium (Mechanisms & Applications)</option>
                    <option value="hard">Hard (Edge Cases & Trade-offs)</option>
                  </select>
                </div>
              </div>

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 24, padding: '10px 20px', cursor: 'pointer' }}>
                {loading ? 'Retrieving Chunks & Synthesizing...' : 'Generate Live Question →'}
              </button>
            </form>
          )}

          {/* STAGE 02: INTERVIEW */}
          {step === 2 && currentQuestion && (
            <form onSubmit={handleSubmitAndEvaluate} style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="topic-chip" style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: 4, fontWeight: 600, fontSize: '.75rem' }}>
                  {currentQuestion.subject.toUpperCase()} • {currentQuestion.topic.replace('_', ' ')}
                </span>
                <span className="status-tag" style={{ fontSize: '.75rem' }}>
                  {currentQuestion.difficulty_tag.toUpperCase()}
                </span>
              </div>

              <h2 style={{ fontSize: '1.2rem', lineHeight: '1.5', margin: '0 0 16px', color: '#111827' }}>
                {currentQuestion.question_text}
              </h2>

              {currentQuestion.source_chunk_ids && currentQuestion.source_chunk_ids.length > 0 && (
                <div style={{ fontSize: '.78rem', color: '#6b7280', marginBottom: 16 }}>
                  ℹ Grounded in {currentQuestion.source_chunk_ids.length} retrieved vector chunks from course syllabus.
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <label className="field-label" htmlFor="answer">Your Answer</label>
                <textarea
                  id="answer"
                  rows={6}
                  className="field-input"
                  style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontFamily: 'inherit', fontSize: '.9rem' }}
                  placeholder="Explain your approach, definitions, mechanisms, and key trade-offs in technical detail..."
                  value={userAnswerText}
                  onChange={(e) => setUserAnswerText(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '.8rem', color: '#6b7280' }}>
                  <span>Word count: {userAnswerText.trim() ? userAnswerText.trim().split(/\s+/).length : 0} words</span>
                  <span>Minimum ~20 words recommended</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn btn-primary" type="submit" disabled={loading || !userAnswerText.trim()}>
                  {loading ? 'Evaluating Rubric via LLM...' : 'Submit & Evaluate Answer →'}
                </button>
                <button type="button" className="btn" onClick={handleReset} style={{ background: '#f3f4f6', border: '1px solid #d1d5db' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* STAGE 03: EVALUATE */}
          {step === 3 && evaluation && (
            <div style={{ marginTop: 24 }}>
              <h2 className="ledger-card-title" style={{ fontSize: '1.25rem', marginBottom: 16 }}>
                Evaluation Breakdown
              </h2>

              {/* Rubric Score Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '.75rem', textTransform: 'uppercase', color: '#64748b' }}>Correctness</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{evaluation.correctness_score}/10</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '.75rem', textTransform: 'uppercase', color: '#64748b' }}>Completeness</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{evaluation.completeness_score}/10</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '.75rem', textTransform: 'uppercase', color: '#64748b' }}>Clarity</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{evaluation.clarity_score}/10</div>
                </div>
                <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', textAlign: 'center' }}>
                  <div style={{ fontSize: '.75rem', textTransform: 'uppercase', color: '#1d4ed8' }}>Overall Avg</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e40af' }}>
                    {((evaluation.correctness_score + evaluation.completeness_score + evaluation.clarity_score) / 3).toFixed(1)}/10
                  </div>
                </div>
              </div>

              {/* Feedback Card */}
              <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 16 }}>
                <h3 style={{ fontSize: '.95rem', margin: '0 0 8px', color: '#374151' }}>Constructive AI Feedback</h3>
                <p style={{ margin: 0, fontSize: '.9rem', lineHeight: '1.5', color: '#1f2937' }}>
                  {evaluation.feedback_text}
                </p>
              </div>

              {evaluation.weakest_subtopic && (
                <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7', color: '#b45309', fontSize: '.85rem', marginBottom: 20 }}>
                  ⚠️ <strong>Identified Area to Review:</strong> {evaluation.weakest_subtopic}
                </div>
              )}

              <button className="btn btn-primary" type="button" onClick={handleReset} style={{ padding: '10px 20px' }}>
                Next Practice Question →
              </button>
            </div>
          )}
        </section>

        {/* Sidebar Info Card */}
        <aside className="ledger-card" style={{ flex: 1 }}>
          <p className="eyebrow">Self-RAG Pipeline</p>
          <h2 style={{ margin: '0 0 11px', fontSize: '1.2rem', letterSpacing: '-.04em' }}>Grounded & Evaluated.</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: '.82rem', lineHeight: '1.5' }}>
            Questions are generated at runtime from 14 computer science textbooks & reference guides stored in ChromaDB vector database.
          </p>
          <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span className="topic-chip">Gemini 3.6 Flash</span>
            <span className="topic-chip">Groq Fallback</span>
            <span className="topic-chip">Chroma Vector Store</span>
            <span className="topic-chip">Self-RAG Grounded</span>
          </div>
          <div className="preview-note" style={{ marginTop: 24 }}>
            <h3>Strict Evaluation Rubric</h3>
            <p>Answers are graded across Correctness, Completeness, and Clarity metrics with specific technical feedback.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
