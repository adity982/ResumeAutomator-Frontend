import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth, provider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

function App() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [tailoredResume, setTailoredResume] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [coverLetter, setCoverLetter] = useState('');
  const [loadingLetter, setLoadingLetter] = useState(false);
  
  const [interviewQuestions, setInterviewQuestions] = useState('');
  const [loadingInterview, setLoadingInterview] = useState(false);

  const [template, setTemplate] = useState('standard');
  const [user, setUser] = useState(null);
  const [resumeHistory, setResumeHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchHistory(currentUser.uid);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => signInWithPopup(auth, provider).catch(console.error);
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setResumeHistory([]);
    setShowHistory(false);
  };

  const fetchHistory = async (uid) => {
    try {
      const res = await axios.get(`https://resume-automator-api.onrender.com/get_my_resumes/${uid}`);
      setResumeHistory(res.data.history);
    } catch (err) { console.error("Failed to fetch history"); }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('https://resume-automator-api.onrender.com/upload_resume', formData);
      setResumeText(res.data.extracted_data.raw_content);
      alert("Resume Uploaded & Parsed Successfully!");
    } catch (err) { alert("Upload failed."); }
  };

  const streamAIResponse = async (endpoint, payload, stateSetter, loadingSetter) => {
    loadingSetter(true);
    stateSetter(''); 
    try {
      const response = await fetch(`https://resume-automator-api.onrender.com/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      loadingSetter(false); 

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          stateSetter((prev) => prev + chunk); 
        }
      }
    } catch (err) {
      alert("Streaming connection failed.");
      loadingSetter(false);
    }
  };

  const handleProcess = async () => {
    if (!resumeText || !url) return alert("Upload resume and paste URL first!");
    setLoading(true);
    setTailoredResume(''); 
    
    try {
      const jobRes = await axios.post(`https://resume-automator-api.onrender.com/scrape_job?url=${url}`);
      const jd = jobRes.data.job_data.description;

      const analysisRes = await axios.post('https://resume-automator-api.onrender.com/analyze_match', { resume_text: resumeText, jd_text: jd });
      setAnalysis(analysisRes.data.analysis);
      
      setLoading(false); 
      await streamAIResponse('tailor_resume', { resume_text: resumeText, jd_text: jd }, setTailoredResume, () => {});

    } catch (err) { 
      alert("Processing failed."); 
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (tailoredResume.includes("RESOURCE_EXHAUSTED") || tailoredResume.includes("Error:")) return alert("Invalid resume generation.");
    try {
      const response = await axios.post('https://resume-automator-api.onrender.com/download_resume', { text: tailoredResume, template: template }, { responseType: 'blob' });
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Final_Tailored_Resume_${template}.pdf`);
      document.body.appendChild(link);
      link.click(); link.remove();

      if (user) {
        await axios.post('https://resume-automator-api.onrender.com/save_resume_history', {
          uid: user.uid, email: user.email, job_url: url, match_score: analysis?.score || 0, tailored_text: tailoredResume
        });
        fetchHistory(user.uid);
      }
    } catch (err) { alert("PDF generation failed."); }
  };

  const handleCoverLetter = async () => {
    try {
      const jobRes = await axios.post(`https://resume-automator-api.onrender.com/scrape_job?url=${url}`);
      streamAIResponse('generate_cover_letter', { resume_text: resumeText, jd_text: jobRes.data.job_data.description }, setCoverLetter, setLoadingLetter);
    } catch (err) {
      alert("Failed to scrape job description for cover letter.");
    }
  };

  const handleInterview = async () => {
    try {
      const jobRes = await axios.post(`https://resume-automator-api.onrender.com/scrape_job?url=${url}`);
      streamAIResponse('generate_interview', { resume_text: resumeText, jd_text: jobRes.data.job_data.description }, setInterviewQuestions, setLoadingInterview);
    } catch (err) {
      alert("Failed to scrape job description for interview.");
    }
  };

  // --- NEW: Apply Now Redirect Logic ---
  const handleApplyNow = async (textToCopy) => {
    if (!url) return alert("No job URL found!");
    try {
      await navigator.clipboard.writeText(textToCopy);
      alert("Copied to clipboard! Redirecting you to the job application...");
      window.open(url, '_blank'); // Opens the job link in a new tab
    } catch (err) {
      // Fallback just in case the browser blocks clipboard access
      alert("Redirecting you to the job application...");
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">AI Resume Automator</h1>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="font-medium text-slate-600">Hello, {user.displayName}</span>
              <button onClick={() => setShowHistory(!showHistory)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm transition font-medium">
                {showHistory ? 'Hide Dashboard' : 'View Dashboard'}
              </button>
              <button onClick={handleLogout} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm transition font-medium">Sign Out</button>
            </div>
          ) : (
            <button onClick={handleLogin} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition font-semibold">
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Dashboard */}
        {user && showHistory && (
          <div className="bg-sky-50 border border-sky-200 p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-sky-900 mb-4">Your Saved Resumes</h2>
            {resumeHistory.length === 0 ? <p className="text-sky-700">No saved resumes yet.</p> : (
              <div className="grid gap-3">
                {resumeHistory.map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                      <a href={item.job_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">{item.job_url.substring(0, 50)}...</a>
                      <p className="text-xs text-slate-400 mt-1">Saved on: {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-bold px-3 py-1 rounded-full text-sm ${item.match_score > 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>Score: {item.match_score}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload & Job URL */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-4 text-slate-700">1. Upload Resume</h3>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4 cursor-pointer" />
            <button onClick={handleUpload} className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition">Upload & Parse</button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-4 text-slate-700">2. Target Job</h3>
            <input type="text" placeholder="Paste Job URL..." value={url} onChange={(e) => setUrl(e.target.value)} className="w-full p-3 mb-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition" />
            <button onClick={handleProcess} disabled={loading} className={`w-full py-3 rounded-xl font-semibold text-white transition ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? 'AI is Processing...' : 'Analyze & Tailor'}
            </button>
          </div>
        </div>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="animate-pulse bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded w-4/6"></div>
            </div>
            <p className="text-center text-slate-400 font-medium animate-bounce mt-4">Scraping site & matching keywords with Groq LLM...</p>
          </div>
        )}

        {/* Results */}
        {!loading && analysis && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold mb-4">Match Score: <span className={analysis.score > 70 ? 'text-green-500' : 'text-orange-500'}>{analysis.score}%</span></h2>
              <h4 className="font-semibold text-slate-600 mb-2">Missing Keywords:</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_keywords && analysis.missing_keywords.map((k, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">{k}</span>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-600 mb-2">Recruiter's Verdict:</h4>
              <p className="italic text-slate-500 leading-relaxed">{analysis.verdict}</p>
            </div>
          </div>
        )}

        {/* Editable Resume */}
        {!loading && (tailoredResume || analysis) && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">3. Human-in-the-Loop Editor</h3>
            </div>
            <textarea value={tailoredResume} onChange={(e) => setTailoredResume(e.target.value)} placeholder="AI is generating your resume..." className="w-full h-96 p-5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none mb-4 resize-y" />
            
            {/* UPDATED: Added Copy & Apply Button here */}
            <div className="flex flex-wrap md:flex-nowrap gap-4">
              <select value={template} onChange={(e) => setTemplate(e.target.value)} className="p-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none w-full md:w-1/4">
                <option value="standard">Standard (Harvard)</option>
                <option value="modern">Modern (Blue)</option>
                <option value="executive">Executive (Navy)</option>
                <option value="minimalist">Minimalist</option>
                <option value="creative">Creative (Teal)</option>
              </select>
              <button onClick={handleDownload} className="w-full md:w-1/2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md transition">
                Save & Download PDF
              </button>
              <button onClick={() => handleApplyNow(tailoredResume)} className="w-full md:w-1/4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition">
                Copy & Apply
              </button>
            </div>
          </div>
        )}

        {/* Bonus Features: Cover Letter & Interview */}
        {!loading && analysis && (
          <div className="grid md:grid-cols-2 gap-6 pb-20">
            
            {/* Cover Letter Box */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Cover Letter</h3>
                <button onClick={handleCoverLetter} disabled={loadingLetter} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  {loadingLetter ? 'Connecting...' : 'Generate Letter'}
                </button>
              </div>
              {loadingLetter ? (
                <div className="animate-pulse space-y-3 flex-grow"><div className="h-4 bg-slate-200 rounded w-full"></div><div className="h-4 bg-slate-200 rounded w-5/6"></div></div>
              ) : (coverLetter || analysis) && (
                <>
                  <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Click generate to stream your cover letter..." className="w-full h-64 p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm leading-relaxed mb-4 flex-grow" />
                  {/* NEW: Apply Now Button for Cover Letter */}
                  {coverLetter && (
                    <button onClick={() => handleApplyNow(coverLetter)} className="w-full py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-bold transition">
                      Copy Letter & Apply Now
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Mock Interview Box */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Mock Interview</h3>
                <button onClick={handleInterview} disabled={loadingInterview} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  {loadingInterview ? 'Connecting...' : 'Generate Questions'}
                </button>
              </div>
              {loadingInterview ? (
                <div className="animate-pulse space-y-3 flex-grow"><div className="h-4 bg-slate-200 rounded w-full"></div><div className="h-4 bg-slate-200 rounded w-3/4"></div></div>
              ) : (interviewQuestions || analysis) && (
                <textarea value={interviewQuestions} onChange={(e) => setInterviewQuestions(e.target.value)} placeholder="Click generate to stream FAANG interview questions..." className="w-full h-64 p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm leading-relaxed flex-grow" />
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default App;