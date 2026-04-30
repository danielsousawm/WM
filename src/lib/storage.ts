/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SurveyResponse } from '../types';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const COLLECTION_NAME = 'responses';

export const saveResponse = async (response: Omit<SurveyResponse, 'id' | 'average' | 'date'>) => {
  const scores = [
    response.technicalQuality,
    response.resolutivity,
    response.deadlineCompliance,
    response.communication,
    response.overallSatisfaction
  ];
  
  const average = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
  
  const dataToSave = {
    ...response,
    average,
    date: new Date().toISOString()
  };
  
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);
    return { ...dataToSave, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
  }
};

export const getResponses = async (): Promise<SurveyResponse[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as SurveyResponse[];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    return [];
  }
};

export const subscribeToResponses = (callback: (responses: SurveyResponse[]) => void, onError?: (error: any) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const responses = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as SurveyResponse[];
    callback(responses);
  }, (error) => {
    if (onError) {
      onError(error);
    } else {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    }
  });
};

export const calculateStats = (responses: SurveyResponse[], allResponses: SurveyResponse[]) => {
  if (responses.length === 0) {
    return {
      generalAverage: 0,
      totalResponses: 0,
      highSatisfactionPercent: 0,
      worstCriterion: { name: '-', value: 0 },
      criticalMunicipality: { name: '-', value: 0 },
      bestEvolution: { name: '-', value: 0 },
      averagesByCriteria: {
        technicalQuality: 0,
        resolutivity: 0,
        deadlineCompliance: 0,
        communication: 0,
        overallSatisfaction: 0,
      }
    };
  }

  interface Totals {
    technicalQuality: number;
    resolutivity: number;
    deadlineCompliance: number;
    communication: number;
    overallSatisfaction: number;
  }

  const totals = responses.reduce((acc: Totals, curr) => ({
    technicalQuality: acc.technicalQuality + curr.technicalQuality,
    resolutivity: acc.resolutivity + curr.resolutivity,
    deadlineCompliance: acc.deadlineCompliance + curr.deadlineCompliance,
    communication: acc.communication + curr.communication,
    overallSatisfaction: acc.overallSatisfaction + curr.overallSatisfaction,
  }), {
    technicalQuality: 0,
    resolutivity: 0,
    deadlineCompliance: 0,
    communication: 0,
    overallSatisfaction: 0,
  });

  const count = responses.length;
  const generalSum = responses.reduce((acc, curr) => acc + curr.average, 0);

  const averagesByCriteria = {
    technicalQuality: Number((totals.technicalQuality / count).toFixed(1)),
    resolutivity: Number((totals.resolutivity / count).toFixed(1)),
    deadlineCompliance: Number((totals.deadlineCompliance / count).toFixed(1)),
    communication: Number((totals.communication / count).toFixed(1)),
    overallSatisfaction: Number((totals.overallSatisfaction / count).toFixed(1)),
  };

  // Satisfação Alta: Média >= 8.0
  const highSatisfactionCount = responses.filter(r => Number(r.average) >= 8).length;
  const highSatisfactionPercent = count > 0 ? Math.round((highSatisfactionCount / count) * 100) : 0;

  // Worst Criterion
  const criteriaLabels: Record<string, string> = {
    technicalQuality: 'Qualidade Técnica',
    resolutivity: 'Resolutividade',
    deadlineCompliance: 'Prazo/Entrega',
    communication: 'Comunicação',
    overallSatisfaction: 'Satisfação Geral'
  };

  let worst = { name: '-', value: 11 };
  Object.entries(averagesByCriteria).forEach(([key, val]) => {
    if (val < worst.value) {
      worst = { name: criteriaLabels[key], value: val };
    }
  });

  // Critical Municipality
  const munGroups = responses.reduce((acc, curr) => {
    if (!acc[curr.municipality]) acc[curr.municipality] = [];
    acc[curr.municipality].push(curr.average);
    return acc;
  }, {} as Record<string, number[]>);

  let criticalMun = { name: '-', value: 11 };
  Object.entries(munGroups).forEach(([name, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < criticalMun.value) {
      criticalMun = { name, value: Number(avg.toFixed(1)) };
    }
  });

  // Best Evolution
  // For this, we compare the current month averages with previous month averages for all municipalities
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const getMonthAvg = (mun: string, month: number, year: number) => {
    const resps = allResponses.filter(r => {
      const d = new Date(r.date);
      return r.municipality === mun && d.getMonth() === month && d.getFullYear() === year;
    });
    if (resps.length === 0) return null;
    return resps.reduce((a, b) => a + b.average, 0) / resps.length;
  };

  const munList = Array.from(new Set(allResponses.map(r => r.municipality)));
  let bestEv = { name: '-', value: 0 };

  munList.forEach(mun => {
    const curAvg = getMonthAvg(mun, currentMonth, currentYear);
    const preAvg = getMonthAvg(mun, prevMonth, prevMonthYear);
    if (curAvg !== null && preAvg !== null) {
      const diff = curAvg - preAvg;
      if (diff > bestEv.value) {
        bestEv = { name: mun, value: Number(diff.toFixed(1)) };
      }
    }
  });

  return {
    generalAverage: Number((generalSum / count).toFixed(1)),
    totalResponses: count,
    highSatisfactionPercent,
    worstCriterion: worst,
    criticalMunicipality: criticalMun,
    bestEvolution: bestEv,
    averagesByCriteria
  };
};

export const exportToCSV = (responses: SurveyResponse[]) => {
  if (responses.length === 0) return;

  const headers = ['Data', 'Município', 'Nome', 'Telefone', 'Qualidade Técnica', 'Resolutividade', 'Prazo', 'Comunicação', 'Satisfação Geral', 'Média', 'Sugestões'];
  const rows = responses.map(r => [
    new Date(r.date).toLocaleDateString(),
    r.municipality,
    r.clientName || '-',
    r.clientPhone || '-',
    r.technicalQuality,
    r.resolutivity,
    r.deadlineCompliance,
    r.communication,
    r.overallSatisfaction,
    r.average,
    `"${(r.suggestions || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `satisfacao_clientes_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
