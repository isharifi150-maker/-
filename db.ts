import { supabase } from './lib/supabase';
import type { User, Evidence, Score, Evaluation, SchoolSettings } from './types';

const EVIDENCE_BUCKET = 'employee-evidence';

type DbRow = Record<string, any>;
const ms = (value?: string | number | null) => value ? (typeof value === 'number' ? value : new Date(value).getTime()) : 0;
const iso = (value?: number) => value ? new Date(value).toISOString() : null;

function requireData<T>(data: T | null, error: any, fallback?: T): T {
  if (error) throw new Error(error.message || 'حدث خطأ أثناء المزامنة مع Supabase');
  if (data == null) {
    if (fallback !== undefined) return fallback;
    throw new Error('لم تُرجع Supabase بيانات');
  }
  return data;
}

const mapUser = (r: DbRow): User => ({
  id: r.id,
  civilId: r.civil_id,
  password: r.password,
  fullName: r.full_name,
  role: r.role,
  formType: r.form_type || undefined,
  jobTitle: r.job_title || undefined,
  createdAt: ms(r.created_at),
  mustChangePassword: Boolean(r.must_change_password),
});

const userRow = (u: User) => ({
  id: u.id,
  civil_id: u.civilId,
  password: u.password,
  full_name: u.fullName,
  role: u.role,
  form_type: u.formType || null,
  job_title: u.jobTitle || null,
  created_at: iso(u.createdAt) || new Date().toISOString(),
  must_change_password: u.mustChangePassword,
});

const mapEvidence = (r: DbRow): Evidence => ({
  id: r.id,
  userId: r.employee_id,
  criterionId: r.criterion_id,
  fileName: r.file_name,
  fileType: r.file_type,
  fileSize: Number(r.file_size || 0),
  fileData: r.file_url,
  storagePath: r.storage_path || undefined,
  uploadedAt: ms(r.uploaded_at),
  description: r.description || undefined,
});

const evidenceRow = (e: Evidence) => ({
  id: e.id,
  employee_id: e.userId,
  criterion_id: e.criterionId,
  file_name: e.fileName,
  file_type: e.fileType,
  file_size: e.fileSize,
  file_url: e.fileData,
  storage_path: e.storagePath || null,
  uploaded_at: iso(e.uploadedAt) || new Date().toISOString(),
  description: e.description || null,
});

const mapScore = (r: any, userId: string, period: 'midyear' | 'final'): Score => ({
  id: r.id,
  userId,
  criterionId: r.criterionId ?? r.criterion_id,
  rating: Number(r.rating || 0),
  notes: r.notes || '',
  period,
  createdAt: Number(r.createdAt ?? r.created_at ?? Date.now()),
  updatedAt: Number(r.updatedAt ?? r.updated_at ?? Date.now()),
});

const mapEvaluation = (r: DbRow): Evaluation => ({
  id: r.id,
  userId: r.employee_id,
  period: r.period,
  status: r.status,
  generalNotes: r.general_notes || '',
  totalScore: Number(r.total_score || 0),
  ratingLabel: r.rating_label || '',
  scores: Array.isArray(r.scores) ? r.scores.map((s: any) => mapScore(s, r.employee_id, r.period)) : [],
  approvedAt: r.approved_at ? ms(r.approved_at) : undefined,
  createdAt: ms(r.created_at),
  updatedAt: ms(r.updated_at),
});

const evaluationRow = (e: Evaluation) => ({
  id: e.id,
  employee_id: e.userId,
  period: e.period,
  status: e.status,
  general_notes: e.generalNotes,
  total_score: e.totalScore,
  rating_label: e.ratingLabel,
  scores: e.scores || [],
  approved_at: iso(e.approvedAt),
  created_at: iso(e.createdAt) || new Date().toISOString(),
  updated_at: iso(e.updatedAt) || new Date().toISOString(),
});

// Employees
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
  return requireData(data, error, []).map(mapUser);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { data, error } = await supabase.from('employees').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapUser(data) : undefined;
}

export async function getUserByCivilId(civilId: string): Promise<User | undefined> {
  const { data, error } = await supabase.from('employees').select('*').eq('civil_id', civilId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapUser(data) : undefined;
}

export async function saveUser(user: User): Promise<void> {
  const { error } = await supabase.from('employees').upsert(userRow(user), { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function deleteUser(id: string): Promise<void> {
  const { data: files, error: filesError } = await supabase.from('evidence').select('storage_path').eq('employee_id', id);
  if (filesError) throw new Error(filesError.message);
  const paths = (files || []).map((x: any) => x.storage_path).filter(Boolean);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(EVIDENCE_BUCKET).remove(paths);
    if (storageError) throw new Error(storageError.message);
  }
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// Evidence + Supabase Storage
export async function getEvidenceByUser(userId: string): Promise<Evidence[]> {
  const { data, error } = await supabase.from('evidence').select('*').eq('employee_id', userId).order('uploaded_at', { ascending: false });
  return requireData(data, error, []).map(mapEvidence);
}

export async function getEvidenceByCriterion(userId: string, criterionId: string): Promise<Evidence[]> {
  const { data, error } = await supabase.from('evidence').select('*').eq('employee_id', userId).eq('criterion_id', criterionId).order('uploaded_at', { ascending: false });
  return requireData(data, error, []).map(mapEvidence);
}

export async function uploadEvidenceFile(args: {
  id: string; userId: string; criterionId: string; file: File; description?: string;
}): Promise<Evidence> {
  const ext = args.file.name.includes('.') ? args.file.name.split('.').pop() : 'file';
  const safeExt = (ext || 'file').replace(/[^a-zA-Z0-9]/g, '');
  const path = `${args.userId}/${args.criterionId}/${args.id}.${safeExt}`;
  const { error: uploadError } = await supabase.storage.from(EVIDENCE_BUCKET).upload(path, args.file, {
    cacheControl: '3600', upsert: false, contentType: args.file.type,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: publicUrlData } = supabase.storage.from(EVIDENCE_BUCKET).getPublicUrl(path);
  let fileUrl = publicUrlData.publicUrl;
  // If the bucket is private, prefer a signed URL while still supporting a public bucket.
  const { data: signed } = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signed?.signedUrl) fileUrl = signed.signedUrl;

  const record: Evidence = {
    id: args.id,
    userId: args.userId,
    criterionId: args.criterionId,
    fileName: args.file.name,
    fileType: args.file.type === 'application/pdf' ? 'pdf' : 'image',
    fileSize: args.file.size,
    fileData: fileUrl,
    storagePath: path,
    uploadedAt: Date.now(),
    description: args.description,
  };
  try {
    await saveEvidence(record);
    return record;
  } catch (error) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([path]);
    throw error;
  }
}

export async function saveEvidence(evidence: Evidence): Promise<void> {
  const { error } = await supabase.from('evidence').upsert(evidenceRow(evidence), { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function deleteEvidence(id: string): Promise<void> {
  const { data, error: fetchError } = await supabase.from('evidence').select('storage_path').eq('id', id).maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (data?.storage_path) {
    const { error: storageError } = await supabase.storage.from(EVIDENCE_BUCKET).remove([data.storage_path]);
    if (storageError) throw new Error(storageError.message);
  }
  const { error } = await supabase.from('evidence').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// Scores are stored as JSON in evaluations; there is no browser/local scores database.
export async function getScoresByUser(userId: string): Promise<Score[]> {
  const evals = await getEvaluationsByUser(userId);
  return evals.flatMap((e) => e.scores || []);
}

export async function getScoresByPeriod(userId: string, period: 'midyear' | 'final'): Promise<Score[]> {
  const e = await getEvaluation(userId, period);
  return e?.scores || [];
}

export async function saveScore(score: Score): Promise<void> {
  const current = await getEvaluation(score.userId, score.period);
  const scores = [...(current?.scores || [])];
  const index = scores.findIndex((s) => s.criterionId === score.criterionId);
  if (index >= 0) scores[index] = score; else scores.push(score);
  const now = Date.now();
  await saveEvaluation(current ? { ...current, scores, updatedAt: now } : {
    id: `evaluation-${score.userId}-${score.period}`,
    userId: score.userId,
    period: score.period,
    status: 'draft',
    generalNotes: '',
    totalScore: 0,
    ratingLabel: '',
    scores,
    createdAt: now,
    updatedAt: now,
  });
}

// Evaluations
export async function getEvaluationsByUser(userId: string): Promise<Evaluation[]> {
  const { data, error } = await supabase.from('evaluations').select('*').eq('employee_id', userId).order('updated_at', { ascending: false });
  return requireData(data, error, []).map(mapEvaluation);
}

export async function getEvaluation(userId: string, period: 'midyear' | 'final'): Promise<Evaluation | undefined> {
  const { data, error } = await supabase.from('evaluations').select('*').eq('employee_id', userId).eq('period', period).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapEvaluation(data) : undefined;
}

export async function saveEvaluation(evaluation: Evaluation): Promise<void> {
  // Preserve cloud scores if caller is saving summary fields only.
  let next = evaluation;
  if (!evaluation.scores) {
    const existing = await getEvaluation(evaluation.userId, evaluation.period);
    next = { ...evaluation, scores: existing?.scores || [] };
  }
  const { error } = await supabase.from('evaluations').upsert(evaluationRow(next), { onConflict: 'employee_id,period' });
  if (error) throw new Error(error.message);
}

export async function deleteEvaluation(id: string): Promise<void> {
  const { error } = await supabase.from('evaluations').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// School settings
export async function getSchoolSettings(): Promise<SchoolSettings | undefined> {
  const { data, error } = await supabase.from('school_settings').select('*').limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return {
    ...data,
    id: data.id,
    schoolName: data.school_name || '',
    educationDepartment: data.education_department || undefined,
    schoolYear: data.school_year || undefined,
    updatedAt: ms(data.updated_at),
  };
}

export async function saveSchoolSettings(settings: SchoolSettings): Promise<void> {
  const row = {
    id: settings.id,
    school_name: settings.schoolName,
    education_department: settings.educationDepartment || null,
    school_year: settings.schoolYear || null,
    updated_at: new Date(settings.updatedAt || Date.now()).toISOString(),
  };
  const { error } = await supabase.from('school_settings').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function deleteSchoolSettings(id: string): Promise<void> {
  const { error } = await supabase.from('school_settings').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function seedDefaultAdmin(): Promise<void> {
  const existing = await getUserByCivilId('admin');
  if (existing) return;
  await saveUser({
    id: 'admin-default', civilId: 'admin', password: 'admin123', fullName: 'مدير المدرسة',
    role: 'admin', createdAt: Date.now(), mustChangePassword: false,
  });
}
