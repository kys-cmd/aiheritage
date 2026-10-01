import { supabase, isSupabaseConfigured } from './supabase';
import { Submission, Judge, Evaluation, ChannelMessage } from '../types';

/**
 * Supabase Data Mapper & Synchronization Utility
 */

export const SupabaseSync = {
  isConfigured: () => isSupabaseConfigured,

  // Load all initial data from Supabase
  loadAllData: async () => {
    if (!supabase || !isSupabaseConfigured) return null;

    try {
      const [
        { data: subData, error: subErr },
        { data: judgeData, error: judgeErr },
        { data: evalData, error: evalErr },
        { data: msgData, error: msgErr },
      ] = await Promise.all([
        supabase.from('submissions').select('*').order('submission_number', { ascending: true }),
        supabase.from('judges').select('*').order('id', { ascending: true }),
        supabase.from('evaluations').select('*'),
        supabase.from('channel_messages').select('*').order('created_at', { ascending: true }),
      ]);

      if (subErr || judgeErr || evalErr || msgErr) {
        console.warn('Supabase fetch returned partial error:', { subErr, judgeErr, evalErr, msgErr });
      }

      const submissions: Submission[] | null = subData && subData.length > 0
        ? subData.map((s: any) => ({
            id: s.id,
            submissionNumber: s.submission_number,
            title: s.title,
            category: s.category,
            submitterName: s.submitter_name,
            participantCategory: s.participant_category,
            submitterAffiliation: s.submitter_affiliation || '',
            nationalHeritageName: s.national_heritage_name,
            baekjeRelated: s.baekje_related,
            description: s.description || '',
            aiTools: Array.isArray(s.ai_tools) ? s.ai_tools : [],
            postEditingUsage: s.post_editing_usage,
            postEditingDetails: s.post_editing_details || '',
            promptSummary: s.prompt_summary || '',
            fullPrompt: s.full_prompt || '',
            processCaptureDriveUrl: s.process_capture_drive_url || '',
            driveLink: s.drive_link,
            previewImageUrl: s.preview_image_url || '',
            videoDuration: s.video_duration,
            submittedAt: s.submitted_at,
          }))
        : null;

      const judges: Judge[] | null = judgeData && judgeData.length > 0
        ? judgeData.map((j: any) => ({
            id: j.id,
            loginId: j.login_id,
            password: j.password_hash || 'password123',
            name: j.name,
            affiliation: j.affiliation || '',
            title: j.title || '',
            specialty: j.specialty || '',
            email: j.email || '',
            phone: j.phone || '',
            isProfileComplete: j.is_profile_complete ?? true,
            oathSigned: j.oath_signed ?? false,
            assignedCategory: j.assigned_category || 'ALL',
          }))
        : null;

      const evaluations: Evaluation[] | null = evalData
        ? evalData.map((e: any) => ({
            id: e.id,
            submissionId: e.submission_id,
            judgeId: e.judge_id,
            judgeName: e.judge_name,
            scores: e.scores || [],
            totalScore: Number(e.total_score || 0),
            averageScore: Number(e.average_score || 0),
            comment: e.comment || '',
            recommendForAward: Boolean(e.recommend_for_award),
            status: e.status || 'DRAFT',
            updatedAt: e.updated_at,
          }))
        : null;

      const channelMessages: ChannelMessage[] | null = msgData
        ? msgData.map((m: any) => ({
            id: m.id,
            submissionId: m.submission_id,
            authorId: m.author_id,
            authorName: m.author_name,
            authorRole: m.author_role,
            message: m.message,
            tag: m.tag,
            createdAt: m.created_at,
          }))
        : null;

      return { submissions, judges, evaluations, channelMessages };
    } catch (err) {
      console.warn('Failed to load data from Supabase:', err);
      return null;
    }
  },

  // Upsert single evaluation
  saveEvaluation: async (evalData: Evaluation) => {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('evaluations').upsert({
        id: evalData.id,
        submission_id: evalData.submissionId,
        judge_id: evalData.judgeId,
        judge_name: evalData.judgeName,
        scores: evalData.scores,
        total_score: evalData.totalScore,
        average_score: evalData.averageScore,
        comment: evalData.comment,
        recommend_for_award: evalData.recommendForAward,
        status: evalData.status,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase saveEvaluation failed:', err);
    }
  },

  // Save channel message
  addChannelMessage: async (msg: ChannelMessage) => {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('channel_messages').insert({
        id: msg.id,
        submission_id: msg.submissionId,
        author_id: msg.authorId,
        author_name: msg.authorName,
        author_role: msg.authorRole,
        message: msg.message,
        tag: msg.tag || 'NOTE',
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase addChannelMessage failed:', err);
    }
  },

  // Upsert submission
  saveSubmission: async (sub: Submission) => {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('submissions').upsert({
        id: sub.id,
        submission_number: sub.submissionNumber,
        title: sub.title,
        category: sub.category,
        submitter_name: sub.submitterName,
        participant_category: sub.participantCategory,
        submitter_affiliation: sub.submitterAffiliation,
        national_heritage_name: sub.nationalHeritageName,
        baekje_related: sub.baekjeRelated,
        description: sub.description,
        ai_tools: sub.aiTools,
        post_editing_usage: sub.postEditingUsage,
        post_editing_details: sub.postEditingDetails,
        prompt_summary: sub.promptSummary,
        full_prompt: sub.fullPrompt,
        process_capture_drive_url: sub.processCaptureDriveUrl,
        drive_link: sub.driveLink,
        preview_image_url: sub.previewImageUrl,
        video_duration: sub.videoDuration,
        submitted_at: sub.submittedAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase saveSubmission failed:', err);
    }
  },

  // Upsert bulk submissions
  saveBulkSubmissions: async (subs: Submission[]) => {
    if (!supabase || !isSupabaseConfigured || subs.length === 0) return;
    try {
      const records = subs.map((sub) => ({
        id: sub.id,
        submission_number: sub.submissionNumber,
        title: sub.title,
        category: sub.category,
        submitter_name: sub.submitterName,
        participant_category: sub.participantCategory,
        submitter_affiliation: sub.submitterAffiliation,
        national_heritage_name: sub.nationalHeritageName,
        baekje_related: sub.baekjeRelated,
        description: sub.description,
        ai_tools: sub.aiTools,
        post_editing_usage: sub.postEditingUsage,
        post_editing_details: sub.postEditingDetails,
        prompt_summary: sub.promptSummary,
        full_prompt: sub.fullPrompt,
        process_capture_drive_url: sub.processCaptureDriveUrl,
        drive_link: sub.driveLink,
        preview_image_url: sub.previewImageUrl,
        video_duration: sub.videoDuration,
        submitted_at: sub.submittedAt || new Date().toISOString(),
      }));
      await supabase.from('submissions').upsert(records);
    } catch (err) {
      console.warn('Supabase saveBulkSubmissions failed:', err);
    }
  },

  // Delete submission
  deleteSubmission: async (id: string) => {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('submissions').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteSubmission failed:', err);
    }
  },

  // Save judge profile/oath
  saveJudge: async (judge: Judge) => {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('judges').upsert({
        id: judge.id,
        login_id: judge.loginId,
        password_hash: judge.password || 'password123',
        name: judge.name,
        affiliation: judge.affiliation,
        title: judge.title,
        specialty: judge.specialty,
        email: judge.email,
        phone: judge.phone,
        is_profile_complete: judge.isProfileComplete,
        oath_signed: judge.oathSigned,
        assigned_category: judge.assignedCategory || 'ALL',
        updated_at: new Date().toISOString(),
      });

      if (judge.oath) {
        await supabase.from('judge_oaths').upsert({
          judge_id: judge.id,
          judge_name: judge.name,
          signed_at: judge.oath.signedAt || new Date().toISOString(),
          signature_data_url: judge.oath.signatureDataUrl,
          is_agreed: judge.oath.isAgreed,
        });
      }
    } catch (err) {
      console.warn('Supabase saveJudge failed:', err);
    }
  },

  deleteJudge: async (id: string) => {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('judges').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteJudge failed:', err);
    }
  },
};
