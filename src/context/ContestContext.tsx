import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Category,
  ChannelMessage,
  Evaluation,
  Judge,
  RubricCriterion,
  Submission,
  SubmissionStats,
} from '../types';
import {
  INITIAL_CHANNEL_MESSAGES,
  INITIAL_EVALUATIONS,
  INITIAL_JUDGES,
  INITIAL_SUBMISSIONS,
  OFFICIAL_OATH_TEXT,
  RUBRIC_CRITERIA,
} from '../data/initialData';
import { SupabaseSync } from '../lib/supabaseSync';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface UserAuth {
  role: 'JUDGE' | 'ADMIN';
  judge?: Judge;
  name: string;
}

interface ContestContextType {
  currentUser: UserAuth | null;
  submissions: Submission[];
  judges: Judge[];
  evaluations: Evaluation[];
  channelMessages: ChannelMessage[];
  rubricCriteria: RubricCriterion[];
  oathText: string;
  oathUploadNotice: string | null;
  activeWorkId: string | null;
  setActiveWorkId: (id: string | null) => void;
  isCloudConnected: boolean;
  // Auth methods
  loginAsJudge: (loginId: string, password?: string) => { success: boolean; message?: string; judge?: Judge };
  loginAsAdmin: () => void;
  logout: () => void;
  quickSwitchJudge: (judgeId: string) => void;
  updateJudgeProfile: (judgeId: string, data: Partial<Judge>) => void;
  signJudgeOath: (judgeId: string, signatureDataUrl: string) => void;
  // Evaluation methods
  saveEvaluation: (evaluation: Omit<Evaluation, 'id' | 'updatedAt'> & { id?: string }) => Evaluation;
  getSubmissionEvaluationByJudge: (submissionId: string, judgeId: string) => Evaluation | undefined;
  getSubmissionStats: (submissionId: string) => SubmissionStats;
  // Channel methods
  getChannelMessages: (submissionId: string) => ChannelMessage[];
  addChannelMessage: (submissionId: string, message: string, tag?: 'NOTE' | 'QUESTION' | 'HIGHLIGHT') => void;
  // Admin methods
  addSubmission: (submission: Partial<Submission> & Pick<Submission, 'title' | 'category' | 'submitterName' | 'description' | 'aiTools' | 'driveLink' | 'previewImageUrl'>) => Submission;
  addBulkSubmissions: (
    submissions: Array<Partial<Submission> & Pick<Submission, 'title' | 'category' | 'submitterName' | 'description' | 'aiTools' | 'driveLink' | 'previewImageUrl'>>,
    options?: { updateExisting?: boolean },
  ) => Promise<number>;
  updateSubmission: (id: string, submission: Partial<Submission>) => void;
  deleteSubmission: (id: string) => void;
  addJudge: (judge: Omit<Judge, 'id' | 'isProfileComplete' | 'oathSigned'>) => Judge;
  updateJudge: (id: string, judge: Partial<Judge>) => void;
  deleteJudge: (id: string) => void;
  updateOathText: (text: string) => void;
  setOathUploadNotice: (notice: string | null) => void;
  resetToDefaultData: () => void;
}

const STORAGE_KEYS = {
  SUBMISSIONS: 'ai_heritage_submissions_v4_clean',
  JUDGES: 'ai_heritage_judges_v5_clean',
  EVALUATIONS: 'ai_heritage_evaluations_v4_clean',
  CHANNELS: 'ai_heritage_channel_messages_v4_clean',
  AUTH: 'ai_heritage_current_user_v5_clean',
  OATH: 'ai_heritage_oath_text_v4_clean',
  OATH_NOTICE: 'ai_heritage_oath_notice_v4_clean',
};

const ContestContext = createContext<ContestContextType | undefined>(undefined);

export const ContestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial dataset (clean empty dataset by default)
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!saved) return INITIAL_SUBMISSIONS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  });

  const [judges, setJudges] = useState<Judge[]>(() => {
    // Clear out any old v4 judges storage if exists
    try {
      localStorage.removeItem('ai_heritage_judges_v4_clean');
    } catch {}

    const saved = localStorage.getItem(STORAGE_KEYS.JUDGES);
    if (!saved) return INITIAL_JUDGES;
    try {
      const parsed: Judge[] = JSON.parse(saved);
      // Filter out dummy judges
      return parsed.filter(
        (j) =>
          !['judge-01', 'judge-02', 'judge-03'].includes(j.id) &&
          !['judge1', 'judge2', 'judge3'].includes(j.loginId),
      );
    } catch {
      return INITIAL_JUDGES;
    }
  });

  const [evaluations, setEvaluations] = useState<Evaluation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
    if (!saved) return INITIAL_EVALUATIONS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_EVALUATIONS;
    }
  });

  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHANNELS);
    return saved ? JSON.parse(saved) : INITIAL_CHANNEL_MESSAGES;
  });

  const [oathText, setOathText] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OATH);
    return saved || OFFICIAL_OATH_TEXT;
  });

  const [oathUploadNotice, setOathUploadNoticeState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.OATH_NOTICE) || '2026_AI_디지털헤리티지_공모전_심사위원_공정서약서_공식서식_v1.2.pdf';
  });

  // Initial user state: null so the user lands on the Login Page first
  const [currentUser, setCurrentUser] = useState<UserAuth | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          parsed?.judge &&
          (['judge-01', 'judge-02', 'judge-03'].includes(parsed.judge.id) ||
            ['judge1', 'judge2', 'judge3'].includes(parsed.judge.loginId))
        ) {
          localStorage.removeItem(STORAGE_KEYS.AUTH);
          return null;
        }
        return parsed;
      } catch {
        // fallback
      }
    }
    return null;
  });

  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(isSupabaseConfigured);
  const isServerLoaded = useRef(false);

  // Sync state to backend server persistent file
  const syncToServer = async (payload: {
    submissions?: Submission[];
    judges?: Judge[];
    evaluations?: Evaluation[];
    channelMessages?: ChannelMessage[];
  }) => {
    if (!isServerLoaded.current) return;
    try {
      await fetch('/api/contest-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // ignore
    }
  };

  // Initialize data from server database and Supabase (if configured)
  useEffect(() => {
    let isMounted = true;

    // 1. Load from persistent server DB (data/contest_db.json)
    fetch('/api/contest-data')
      .then((res) => {
        if (!res.ok) throw new Error('API not ok');
        return res.json();
      })
      .then((serverData) => {
        if (!isMounted || !serverData) return;
        isServerLoaded.current = true;

        if (Array.isArray(serverData.judges) && serverData.judges.length > 0) {
          setJudges(serverData.judges);
          localStorage.setItem(STORAGE_KEYS.JUDGES, JSON.stringify(serverData.judges));
        }
        if (Array.isArray(serverData.submissions) && serverData.submissions.length > 0) {
          setSubmissions(serverData.submissions);
          localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(serverData.submissions));
        }
        if (Array.isArray(serverData.evaluations) && serverData.evaluations.length > 0) {
          setEvaluations(serverData.evaluations);
          localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(serverData.evaluations));
        }
        if (Array.isArray(serverData.channelMessages) && serverData.channelMessages.length > 0) {
          setChannelMessages(serverData.channelMessages);
          localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(serverData.channelMessages));
        }
      })
      .catch(() => {
        isServerLoaded.current = true;
      });

    // 2. Initialize from Supabase if configured
    if (isSupabaseConfigured) {
      SupabaseSync.loadAllData().then((cloudData) => {
        if (!isMounted || !cloudData) return;
        if (cloudData.submissions && cloudData.submissions.length > 0) {
          setSubmissions(cloudData.submissions);
        }
        if (cloudData.judges && cloudData.judges.length > 0) {
          setJudges(cloudData.judges);
        }
        if (cloudData.evaluations) {
          setEvaluations(cloudData.evaluations);
        }
        if (cloudData.channelMessages) {
          setChannelMessages(cloudData.channelMessages);
        }
        setIsCloudConnected(true);
      });

      // Real-time synchronization subscription
      if (supabase) {
        const channel = supabase
          .channel('contest_realtime_sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluations' }, (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const e: any = payload.new;
              const updatedEval: Evaluation = {
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
              };
              setEvaluations((prev) => {
                const idx = prev.findIndex((item) => item.id === updatedEval.id);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = updatedEval;
                  return next;
                }
                return [...prev, updatedEval];
              });
            }
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channel_messages' }, (payload) => {
            const m: any = payload.new;
            const newMsg: ChannelMessage = {
              id: m.id,
              submissionId: m.submission_id,
              authorId: m.author_id,
              authorName: m.author_name,
              authorRole: m.author_role,
              message: m.message,
              tag: m.tag,
              createdAt: m.created_at,
            };
            setChannelMessages((prev) => {
              if (prev.some((item) => item.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          })
          .subscribe();

        return () => {
          isMounted = false;
          if (supabase) {
            supabase.removeChannel(channel);
          }
        };
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage and server
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    syncToServer({ submissions });
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JUDGES, JSON.stringify(judges));
    syncToServer({ judges });
  }, [judges]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evaluations));
    syncToServer({ evaluations });
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channelMessages));
    syncToServer({ channelMessages });
  }, [channelMessages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OATH, oathText);
  }, [oathText]);

  useEffect(() => {
    if (oathUploadNotice) {
      localStorage.setItem(STORAGE_KEYS.OATH_NOTICE, oathUploadNotice);
    } else {
      localStorage.removeItem(STORAGE_KEYS.OATH_NOTICE);
    }
  }, [oathUploadNotice]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  }, [currentUser]);

  // Auth functions
  const loginAsJudge = (loginId: string, password?: string) => {
    const trimmed = loginId.trim().toLowerCase();
    const found = judges.find(
      (j) => j.loginId.toLowerCase() === trimmed,
    );
    if (!found) {
      return { success: false, message: '등록되지 않은 심사위원 아이디입니다.' };
    }
    if (password && found.password && found.password !== password) {
      // Allow 'test' password for 'test' loginId as convenience
      if (trimmed === 'test' && (password === 'test' || password === 'password123')) {
        // match
      } else {
        return { success: false, message: '비밀번호가 일치하지 않습니다.' };
      }
    }
    const user: UserAuth = {
      role: 'JUDGE',
      judge: found,
      name: found.name,
    };
    setCurrentUser(user);
    return { success: true, judge: found };
  };

  const loginAsAdmin = () => {
    setCurrentUser({
      role: 'ADMIN',
      name: '공모전 운영사무국 (총괄관리자)',
    });
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const quickSwitchJudge = (judgeId: string) => {
    const found = judges.find((j) => j.id === judgeId);
    if (found) {
      setCurrentUser({
        role: 'JUDGE',
        judge: found,
        name: found.name,
      });
    }
  };

  const updateJudgeProfile = (judgeId: string, data: Partial<Judge>) => {
    setJudges((prev) =>
      prev.map((j) => {
        if (j.id === judgeId) {
          const updated = { ...j, ...data, isProfileComplete: true };
          if (currentUser?.judge?.id === judgeId) {
            setCurrentUser({
              ...currentUser,
              judge: updated,
              name: updated.name,
            });
          }
          return updated;
        }
        return j;
      }),
    );
  };

  const signJudgeOath = (judgeId: string, signatureDataUrl: string) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setJudges((prev) =>
      prev.map((j) => {
        if (j.id === judgeId) {
          const oathRecord = {
            judgeId: j.id,
            judgeName: j.name,
            signedAt: formattedDate,
            isAgreed: true,
            signatureDataUrl,
          };
          const updated = {
            ...j,
            oathSigned: true,
            oath: oathRecord,
          };
          if (currentUser?.judge?.id === judgeId) {
            setCurrentUser({
              ...currentUser,
              judge: updated,
            });
          }
          // Sync oath to Supabase if configured
          SupabaseSync.saveJudge(updated);
          return updated;
        }
        return j;
      }),
    );
  };

  // Evaluation functions
  const saveEvaluation = (evaluationData: Omit<Evaluation, 'id' | 'updatedAt'> & { id?: string }): Evaluation => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    let savedEval: Evaluation;

    setEvaluations((prev) => {
      const existingIdx = prev.findIndex(
        (e) => e.submissionId === evaluationData.submissionId && e.judgeId === evaluationData.judgeId,
      );

      if (existingIdx >= 0) {
        savedEval = {
          ...prev[existingIdx],
          ...evaluationData,
          id: prev[existingIdx].id,
          updatedAt: formattedDate,
        };
        const next = [...prev];
        next[existingIdx] = savedEval;
        return next;
      } else {
        savedEval = {
          ...evaluationData,
          id: `eval-${Date.now()}`,
          updatedAt: formattedDate,
        };
        return [...prev, savedEval];
      }
    });

    // Cloud DB sync (Supabase)
    if (savedEval!) {
      SupabaseSync.saveEvaluation(savedEval);
    }

    // Also auto-add a channel note log if submitted
    if (evaluationData.status === 'SUBMITTED') {
      const logMessage = `[평가 완료 기록] ${evaluationData.judgeName} 심사위원이 평가를 완료했습니다. (평점: ${evaluationData.averageScore.toFixed(1)} / 5.0, 총점: ${evaluationData.totalScore}점 / 25점)`;
      addChannelMessage(evaluationData.submissionId, logMessage, 'NOTE');
    }

    return savedEval!;
  };

  const getSubmissionEvaluationByJudge = (submissionId: string, judgeId: string) => {
    return evaluations.find((e) => e.submissionId === submissionId && e.judgeId === judgeId);
  };

  const getSubmissionStats = (submissionId: string): SubmissionStats => {
    const submissionEvals = evaluations.filter(
      (e) => e.submissionId === submissionId && e.status === 'SUBMITTED',
    );
    const evaluatedCount = submissionEvals.length;
    const totalJudges = judges.length;

    const sub = submissions.find((s) => s.id === submissionId);
    const isBaekjeRelated = sub?.baekjeRelated === '사용함';
    const baekjeBonus = isBaekjeRelated ? 2 : 0;

    const totalScoreSum = submissionEvals.reduce((acc, curr) => acc + curr.totalScore, 0);

    // Base scores (out of 25.0 scale and 5.0 scale)
    const baseTotalScore = evaluatedCount > 0 ? Number((totalScoreSum / evaluatedCount).toFixed(1)) : 0;
    const baseAverageScore = evaluatedCount > 0 ? Number((totalScoreSum / (evaluatedCount * 5)).toFixed(2)) : 0;

    // Final scores with +2 Baekje bonus applied
    const finalTotalScore = evaluatedCount > 0 ? Number((baseTotalScore + baekjeBonus).toFixed(1)) : 0;
    const finalAverageScore = evaluatedCount > 0 ? Number(((totalScoreSum / evaluatedCount + baekjeBonus) / 5).toFixed(2)) : 0;

    const currentJudgeId = currentUser?.judge?.id;
    const currentJudgeEval = currentJudgeId
      ? evaluations.find((e) => e.submissionId === submissionId && e.judgeId === currentJudgeId)
      : undefined;

    const isEvaluatedByCurrentJudge = currentJudgeEval?.status === 'SUBMITTED';

    return {
      submissionId,
      evaluatedCount,
      totalJudges,
      averageScore: finalAverageScore,
      totalScoreSum,
      baseAverageScore,
      baseTotalScore,
      baekjeBonus,
      hasBaekjeBonus: isBaekjeRelated,
      finalTotalScore,
      finalAverageScore,
      evaluations: submissionEvals,
      isEvaluatedByCurrentJudge,
      currentJudgeEvaluation: currentJudgeEval,
    };
  };

  // Channel methods
  const getChannelMessages = (submissionId: string) => {
    return channelMessages.filter((m) => m.submissionId === submissionId);
  };

  const addChannelMessage = (
    submissionId: string,
    message: string,
    tag: 'NOTE' | 'QUESTION' | 'HIGHLIGHT' = 'NOTE',
  ) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsg: ChannelMessage = {
      id: `msg-${Date.now()}`,
      submissionId,
      authorId: currentUser?.judge?.id || 'admin',
      authorName: currentUser?.role === 'ADMIN' ? '공모전 운영사무국' : (currentUser?.judge?.name ? `${currentUser.judge.name} 심사위원` : '심사위원'),
      authorRole: currentUser?.role || 'JUDGE',
      message,
      createdAt: formattedDate,
      tag,
    };

    setChannelMessages((prev) => [...prev, newMsg]);
    SupabaseSync.addChannelMessage(newMsg);
  };

  // Admin methods
  const addSubmission = (data: Partial<Submission> & Pick<Submission, 'title' | 'category' | 'submitterName' | 'description' | 'aiTools' | 'driveLink' | 'previewImageUrl'>) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nextSeq = submissions.length + 1;
    const prefix = data.category === 'IMAGE' ? 'DH-IMG' : 'DH-VID';
    const submissionNumber = data.submissionNumber || `${prefix}-${String(nextSeq).padStart(3, '0')}`;

    const newSub: Submission = {
      participantCategory: data.participantCategory || '일반인',
      submitterAffiliation: data.submitterAffiliation || '',
      nationalHeritageName: data.nationalHeritageName || (data as any).heritageSubject || '한국 전통 문화유산',
      baekjeRelated: data.baekjeRelated || '사용하지 않음',
      postEditingUsage: data.postEditingUsage || '사용하지 않음',
      postEditingDetails: data.postEditingDetails || '',
      fullPrompt: data.fullPrompt || data.promptSummary || '프롬프트 정보 없음',
      processCaptureDriveUrl: data.processCaptureDriveUrl || data.driveLink || 'https://drive.google.com',
      ...data,
      id: `sub-${Date.now()}`,
      submissionNumber,
      submittedAt: formattedDate,
    };

    setSubmissions((prev) => [newSub, ...prev]);
    SupabaseSync.saveSubmission(newSub);

    // Initial system channel message
    const welcomeMsg: ChannelMessage = {
      id: `msg-${Date.now()}`,
      submissionId: newSub.id,
      authorId: 'admin',
      authorName: '공모전 운영사무국',
      authorRole: 'ADMIN',
      message: `[채널 개설] '${newSub.title}' 작품의 심사 및 의견 기록 전용 채널이 생성되었습니다. 구글 드라이브 원본 링크 및 AI 세부 사양을 검토 후 평가해 주시기 바랍니다.`,
      createdAt: formattedDate,
      tag: 'NOTE',
    };
    setChannelMessages((prev) => [...prev, welcomeMsg]);
    SupabaseSync.addChannelMessage(welcomeMsg);

    return newSub;
  };

  const addBulkSubmissions = async (
    items: Array<Partial<Submission> & Pick<Submission, 'title' | 'category' | 'submitterName' | 'description' | 'aiTools' | 'driveLink' | 'previewImageUrl'>>,
    options?: { updateExisting?: boolean },
  ): Promise<number> => {
    if (!items || items.length === 0) return 0;

    const updateExisting = options?.updateExisting !== false; // default true
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let currentList = [...submissions];
    const newMsgs: ChannelMessage[] = [];
    const modifiedOrCreated: Submission[] = [];
    let sequenceCounter = currentList.length;

    for (let i = 0; i < items.length; i++) {
      const data = items[i];

      let existingIndex = -1;
      if (updateExisting) {
        existingIndex = currentList.findIndex((s) => {
          if (data.id && s.id === data.id) return true;
          if (data.submissionNumber && s.submissionNumber && s.submissionNumber.trim().toUpperCase() === data.submissionNumber.trim().toUpperCase()) return true;
          if (data.title && data.submitterName && s.title.trim() === data.title.trim() && s.submitterName.trim() === data.submitterName.trim()) return true;
          return false;
        });
      }

      if (existingIndex !== -1) {
        // Update existing entry with new values (including corrected baekjeRelated & postEditingUsage)
        const existing = currentList[existingIndex];
        const updated: Submission = {
          ...existing,
          ...data,
          id: existing.id,
          submissionNumber: data.submissionNumber || existing.submissionNumber,
          category: data.category || existing.category,
          title: data.title || existing.title,
          submitterName: data.submitterName || existing.submitterName,
          participantCategory: data.participantCategory || existing.participantCategory,
          submitterAffiliation: data.submitterAffiliation !== undefined ? data.submitterAffiliation : existing.submitterAffiliation,
          nationalHeritageName: data.nationalHeritageName || existing.nationalHeritageName,
          heritageSubject: data.heritageSubject || (data as any).heritageSubject || existing.heritageSubject,
          baekjeRelated: data.baekjeRelated || '사용하지 않음',
          description: data.description || existing.description,
          aiTools: data.aiTools || existing.aiTools,
          postEditingUsage: data.postEditingUsage || '사용하지 않음',
          postEditingDetails: data.postEditingDetails !== undefined ? data.postEditingDetails : existing.postEditingDetails,
          fullPrompt: data.fullPrompt || existing.fullPrompt,
          driveLink: data.driveLink || existing.driveLink,
          processCaptureDriveUrl: data.processCaptureDriveUrl || existing.processCaptureDriveUrl,
          previewImageUrl: data.previewImageUrl || existing.previewImageUrl,
          videoUrl: data.videoUrl || existing.videoUrl,
        };
        currentList[existingIndex] = updated;
        modifiedOrCreated.push(updated);
      } else {
        // Create new entry
        sequenceCounter++;
        const prefix = data.category === 'IMAGE' ? 'DH-IMG' : 'DH-VID';
        const submissionNumber = data.submissionNumber || `${prefix}-${String(sequenceCounter).padStart(3, '0')}`;
        const id = data.id || `sub-${Date.now()}-${i}`;

        const sub: Submission = {
          ...data,
          id,
          submissionNumber,
          title: data.title,
          category: data.category,
          submitterName: data.submitterName,
          participantCategory: data.participantCategory || '일반인',
          submitterAffiliation: data.submitterAffiliation || '',
          nationalHeritageName: data.nationalHeritageName || (data as any).heritageSubject || '한국 전통 문화유산',
          heritageSubject: (data as any).heritageSubject || data.nationalHeritageName || '한국 전통 문화유산',
          baekjeRelated: data.baekjeRelated || '사용하지 않음',
          description: data.description || '작품 설명 없음',
          aiTools: data.aiTools || ['Midjourney v6'],
          postEditingUsage: data.postEditingUsage || '사용하지 않음',
          postEditingDetails: data.postEditingDetails || '',
          fullPrompt: data.fullPrompt || '프롬프트 정보 없음',
          processCaptureDriveUrl: data.processCaptureDriveUrl || data.driveLink || 'https://drive.google.com',
          driveLink: data.driveLink,
          previewImageUrl: data.previewImageUrl,
          videoUrl: data.videoUrl,
          submittedAt: formattedDate,
        };
        currentList.push(sub);
        modifiedOrCreated.push(sub);

        newMsgs.push({
          id: `msg-${Date.now()}-${i}`,
          submissionId: id,
          authorId: 'admin',
          authorName: '공모전 운영사무국',
          authorRole: 'ADMIN',
          message: `[채널 개설] '${sub.title}' 작품의 심사 및 의견 기록 전용 채널이 생성되었습니다. 구글 드라이브 원본 링크 및 AI 세부 사양을 검토 후 평가해 주시기 바랍니다.`,
          createdAt: formattedDate,
          tag: 'NOTE',
        });
      }
    }

    setSubmissions(currentList);
    if (newMsgs.length > 0) {
      setChannelMessages((prev) => [...prev, ...newMsgs]);
    }

    // Persist to server db
    syncToServer({ submissions: currentList });

    // Bulk sync to Supabase
    SupabaseSync.saveBulkSubmissions(modifiedOrCreated);

    return modifiedOrCreated.length;
  };

  const updateSubmission = (id: string, data: Partial<Submission>) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...data };
          SupabaseSync.saveSubmission(updated);
          return updated;
        }
        return s;
      }),
    );
  };

  const deleteSubmission = (id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    setEvaluations((prev) => prev.filter((e) => e.submissionId !== id));
    setChannelMessages((prev) => prev.filter((m) => m.submissionId !== id));
    SupabaseSync.deleteSubmission(id);
  };

  const addJudge = (data: Omit<Judge, 'id' | 'isProfileComplete' | 'oathSigned'>) => {
    const newJudge: Judge = {
      ...data,
      id: `judge-${Date.now()}`,
      isProfileComplete: !!(data.name && data.affiliation && data.email),
      oathSigned: false,
    };
    setJudges((prev) => [...prev, newJudge]);
    SupabaseSync.saveJudge(newJudge);
    return newJudge;
  };

  const updateJudge = (id: string, data: Partial<Judge>) => {
    setJudges((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          const updated = { ...j, ...data };
          if (currentUser?.judge?.id === id) {
            setCurrentUser({
              ...currentUser,
              judge: updated,
              name: updated.name,
            });
          }
          SupabaseSync.saveJudge(updated);
          return updated;
        }
        return j;
      }),
    );
  };

  const deleteJudge = (id: string) => {
    setJudges((prev) => prev.filter((j) => j.id !== id));
    SupabaseSync.deleteJudge(id);
    if (currentUser?.judge?.id === id) {
      logout();
    }
  };

  const updateOathText = (text: string) => {
    setOathText(text);
  };

  const setOathUploadNotice = (notice: string | null) => {
    setOathUploadNoticeState(notice);
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    setSubmissions(INITIAL_SUBMISSIONS);
    setJudges(INITIAL_JUDGES);
    setEvaluations(INITIAL_EVALUATIONS);
    setChannelMessages(INITIAL_CHANNEL_MESSAGES);
    setOathText(OFFICIAL_OATH_TEXT);
    setOathUploadNoticeState('2026_AI_디지털헤리티지_공모전_심사위원_공정서약서_공식서식_v1.2.pdf');
    if (INITIAL_JUDGES.length > 0) {
      const defaultJudge = INITIAL_JUDGES[0];
      setCurrentUser({
        role: 'JUDGE',
        judge: defaultJudge,
        name: defaultJudge.name,
      });
    } else {
      setCurrentUser(null);
    }
  };

  return (
    <ContestContext.Provider
      value={{
        currentUser,
        submissions,
        judges,
        evaluations,
        channelMessages,
        rubricCriteria: RUBRIC_CRITERIA,
        oathText,
        oathUploadNotice,
        activeWorkId,
        setActiveWorkId,
        isCloudConnected,
        loginAsJudge,
        loginAsAdmin,
        logout,
        quickSwitchJudge,
        updateJudgeProfile,
        signJudgeOath,
        saveEvaluation,
        getSubmissionEvaluationByJudge,
        getSubmissionStats,
        getChannelMessages,
        addChannelMessage,
        addSubmission,
        addBulkSubmissions,
        updateSubmission,
        deleteSubmission,
        addJudge,
        updateJudge,
        deleteJudge,
        updateOathText,
        setOathUploadNotice,
        resetToDefaultData,
      }}
    >
      {children}
    </ContestContext.Provider>
  );
};

export const useContest = () => {
  const context = useContext(ContestContext);
  if (!context) {
    throw new Error('useContest must be used within a ContestProvider');
  }
  return context;
};
