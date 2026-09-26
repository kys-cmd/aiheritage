import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Category,
  ChannelMessage,
  Evaluation,
  Judge,
  RubricCriterion,
  Submission,
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

interface SubmissionStats {
  submissionId: string;
  evaluatedCount: number;
  totalJudges: number;
  averageScore: number;
  totalScoreSum: number;
  evaluations: Evaluation[];
  isEvaluatedByCurrentJudge: boolean;
  currentJudgeEvaluation?: Evaluation;
}

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
  SUBMISSIONS: 'ai_heritage_submissions_v3',
  JUDGES: 'ai_heritage_judges_v3',
  EVALUATIONS: 'ai_heritage_evaluations_v3',
  CHANNELS: 'ai_heritage_channel_messages_v3',
  AUTH: 'ai_heritage_current_user_v3',
  OATH: 'ai_heritage_oath_text_v3',
  OATH_NOTICE: 'ai_heritage_oath_notice_v3',
};

const ContestContext = createContext<ContestContextType | undefined>(undefined);

export const ContestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial dataset
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!saved) return INITIAL_SUBMISSIONS;
    try {
      const parsed: Submission[] = JSON.parse(saved);
      // Merge saved with initial data so all 11 works exist
      const existingIds = new Set(parsed.map((s) => s.id));
      const missingInitial = INITIAL_SUBMISSIONS.filter((s) => !existingIds.has(s.id));
      const merged = parsed.map((item) => {
        const found = INITIAL_SUBMISSIONS.find((s) => s.id === item.id);
        return found ? { ...found, ...item } : item;
      });
      return [...merged, ...missingInitial];
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  });

  const [judges, setJudges] = useState<Judge[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.JUDGES);
    return saved ? JSON.parse(saved) : INITIAL_JUDGES;
  });

  const [evaluations, setEvaluations] = useState<Evaluation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
    if (!saved) return INITIAL_EVALUATIONS;
    try {
      const parsed: Evaluation[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((e) => e.id));
      const missingEvals = INITIAL_EVALUATIONS.filter((e) => !existingIds.has(e.id));
      return [...parsed, ...missingEvals];
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
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return null;
  });

  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(isSupabaseConfigured);

  // Initialize data from Supabase if configured, with automatic fallback
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;
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

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JUDGES, JSON.stringify(judges));
  }, [judges]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channelMessages));
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
    const found = judges.find(
      (j) => j.loginId.toLowerCase() === loginId.trim().toLowerCase(),
    );
    if (!found) {
      return { success: false, message: '등록되지 않은 심사위원 아이디입니다.' };
    }
    if (password && found.password && found.password !== password) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
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

    const totalScoreSum = submissionEvals.reduce((acc, curr) => acc + curr.totalScore, 0);
    const averageScore = evaluatedCount > 0 ? Number((totalScoreSum / (evaluatedCount * 5)).toFixed(2)) : 0; // average on 5.0 scale

    const currentJudgeId = currentUser?.judge?.id;
    const currentJudgeEval = currentJudgeId
      ? evaluations.find((e) => e.submissionId === submissionId && e.judgeId === currentJudgeId)
      : undefined;

    const isEvaluatedByCurrentJudge = currentJudgeEval?.status === 'SUBMITTED';

    return {
      submissionId,
      evaluatedCount,
      totalJudges,
      averageScore,
      totalScoreSum,
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
    const defaultJudge = INITIAL_JUDGES[0];
    setCurrentUser({
      role: 'JUDGE',
      judge: defaultJudge,
      name: defaultJudge.name,
    });
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
