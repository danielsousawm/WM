/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SurveyResponse {
  id: string;
  municipality: string;
  clientName?: string;
  clientPhone?: string;
  technicalQuality: number;
  resolutivity: number;
  deadlineCompliance: number;
  communication: number;
  overallSatisfaction: number;
  suggestions?: string;
  average: number;
  date: string;
}

export interface DashboardStats {
  generalAverage: number;
  totalResponses: number;
  responseRate: number; // For now fixed target or simulated
  averagesByCriteria: {
    technicalQuality: number;
    resolutivity: number;
    deadlineCompliance: number;
    communication: number;
    overallSatisfaction: number;
  };
}
