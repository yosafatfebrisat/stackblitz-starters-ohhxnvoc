// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- MASUKKAN KUNCI SUPABASE ANDA DI DUA BARIS INI ---
const SUPABASE_URL = 'https://crumrubwkkqltrjumcki.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XCg_vorT08sID8A-_IVZVA_PLFD8d4B';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function WorkspaceApp() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [tasks, setTasks] = useState([]);
  const [editors, setEditors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newEditor, setNewEditor] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newBrief, setNewBrief] = useState('');
  const [newScript, setNewScript] = useState('');
  const [newAssets, setNewAssets] = useState('');

  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [taskStatus, setTaskStatus] = useState('');
  const [revisionNote, setRevisionNote] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await loadWorkspaceData(session.user.id);
    }
    setLoading(false);
  };

  const loadWorkspaceData = async (userId) => {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(prof);

    if (prof?.role === 'owner') {
      const { data: eds } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'editor');
      setEditors(eds || []);
    }

    const { data: tks } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    setTasks(tks || []);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoginError(error.message);
    } else if (data?.user) {
      setUser(data.user);
      await loadWorkspaceData(data.user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('tasks').insert([
      {
        title: newTitle,
        assigned_to: newEditor || null,
        deadline: newDeadline,
        brief: newBrief,
        script_url: newScript,
        assets_url: newAssets,
        status: 'To Do',
        created_by: user.id,
      },
    ]);

    if (!error) {
      setIsModalOpen(false);
      setNewTitle('');
      setNewBrief('');
      setNewScript('');
      setNewAssets('');
      await loadWorkspaceData(user.id);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    const updates = { status: taskStatus, deliverable_url: deliverableUrl };
    if (profile?.role === 'owner') updates.revisions = revisionNote;

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', selectedTask.id);
    if (!error) {
      setIsSubmitOpen(false);
      await loadWorkspaceData(user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Memuat portal...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100 font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl max-w-sm w-full shadow-2xl">
          <h1 className="text-xl font-bold text-blue-400 text-center">
            CUT & EDIT Co.
          </h1>
          <p className="text-xs text-slate-400 text-center mt-1 mb-6">
            Private Workspace Portal
          </p>
          {loginError && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded mb-4">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2.5 rounded"
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  const columns = ['To Do', 'In Progress', 'In Review', 'Completed'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-blue-400">
          CUT & EDIT Workspace
        </span>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold">
              {profile?.fullname || user.email}
            </p>
            <p className="text-xs text-slate-400 uppercase">
              {profile?.role || 'User'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Daftar Pekerjaan</h1>
          {profile?.role === 'owner' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded"
            >
              + Tugas Baru
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div
              key={col}
              className="bg-slate-900/70 rounded-xl p-4 border border-slate-800 min-h-[400px]"
            >
              <h3 className="font-bold text-xs uppercase text-slate-400 mb-4 pb-2 border-b border-slate-800">
                {col} ({tasks.filter((t) => t.status === col).length})
              </h3>
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === col)
                  .map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setTaskStatus(task.status);
                        setDeliverableUrl(task.deliverable_url || '');
                        setRevisionNote(task.revisions || '');
                        setIsSubmitOpen(true);
                      }}
                      className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 p-3.5 rounded-lg cursor-pointer transition"
                    >
                      <h4 className="font-bold text-sm text-white mb-1">
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {task.brief}
                      </p>
                      <div className="text-[11px] text-rose-400 font-medium">
                        Deadline: {task.deadline}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateTask}
            className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-3"
          >
            <h2 className="text-base font-bold mb-2">
              Buat Tugas Editing Baru
            </h2>
            <input
              type="text"
              required
              placeholder="Judul Video"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newEditor}
                onChange={(e) => setNewEditor(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
              >
                <option value="">Pilih Editor</option>
                {editors.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.fullname}
                  </option>
                ))}
              </select>
              <input
                type="date"
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
              />
            </div>
            <textarea
              rows="3"
              required
              placeholder="Brief pengerjaan & catatan naskah..."
              value={newBrief}
              onChange={(e) => setNewBrief(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
            />
            <input
              type="url"
              placeholder="Link VO & Naskah (GDrive)"
              value={newScript}
              onChange={(e) => setNewScript(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
            />
            <input
              type="url"
              placeholder="Link Bahan Aset / Footage"
              value={newAssets}
              onChange={(e) => setNewAssets(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs px-4 py-2 text-slate-400"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-xs font-semibold px-4 py-2 rounded"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {isSubmitOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleUpdateTask}
            className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4"
          >
            <h2 className="text-base font-bold">{selectedTask.title}</h2>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs text-slate-300 whitespace-pre-line">
              {selectedTask.brief}
            </div>
            <div className="flex gap-2 text-xs">
              {selectedTask.script_url && (
                <a
                  href={selectedTask.script_url}
                  target="_blank"
                  className="bg-slate-800 px-3 py-2 rounded flex-1 text-center"
                >
                  📄 Buka VO/Naskah
                </a>
              )}
              {selectedTask.assets_url && (
                <a
                  href={selectedTask.assets_url}
                  target="_blank"
                  className="bg-slate-800 px-3 py-2 rounded flex-1 text-center"
                >
                  🎬 Buka Aset
                </a>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Status Pengerjaan
              </label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Link Hasil Video (Editor)
              </label>
              <input
                type="url"
                placeholder="Tempel link Google Drive hasil render..."
                value={deliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
              />
              {selectedTask.deliverable_url && (
                <a
                  href={selectedTask.deliverable_url}
                  target="_blank"
                  className="block mt-1.5 text-xs text-blue-400 underline"
                >
                  Lihat Hasil Video Saat Ini
                </a>
              )}
            </div>
            {profile?.role === 'owner' ? (
              <div>
                <label className="block text-xs text-rose-400 mb-1">
                  Catatan Revisi (Owner)
                </label>
                <textarea
                  rows="2"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-900/40 rounded px-3 py-2 text-sm"
                />
              </div>
            ) : (
              selectedTask.revisions && (
                <div className="bg-rose-950/30 border border-rose-800 p-3 rounded text-xs text-rose-300">
                  <strong>Catatan Revisi:</strong> {selectedTask.revisions}
                </div>
              )
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitOpen(false)}
                className="text-xs px-4 py-2 text-slate-400"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-xs font-semibold px-4 py-2 rounded"
              >
                Simpan Update
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
