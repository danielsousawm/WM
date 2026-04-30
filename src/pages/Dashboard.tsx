/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, LabelList, AreaChart, Area
} from 'recharts';
import { 
  Search, Calendar, Filter, XCircle,
  ArrowUp, ArrowDown, ArrowUpDown, TrendingUp, TrendingDown, AlertCircle, ThumbsUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { subscribeToResponses, calculateStats } from '../lib/storage';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { MUNICIPALITIES } from '../constants/municipalities';
import { useAuth } from '../contexts/AuthContext';
import { SurveyResponse } from '../types';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export default function Dashboard() {
  const { user, loading: authLoading, signIn, logout } = useAuth();
  const [allResponses, setAllResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterMunicipality, setFilterMunicipality] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToResponses((data) => {
      setAllResponses(data);
      setLoading(false);
    }, (err) => {
      console.error("Erro de permissão ou dados:", err);
      setError("Acesso não autorizado. Verifique se seu e-mail tem permissão de administrador.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredResponses = useMemo(() => {
    let result = allResponses.filter(r => {
      const date = new Date(r.date);
      const matchMonth = filterMonth === '' || (date.getMonth() + 1).toString() === filterMonth;
      const matchYear = filterYear === '' || date.getFullYear().toString() === filterYear;
      const matchMunicipality = filterMunicipality === '' || r.municipality === filterMunicipality;
      return matchMonth && matchYear && matchMunicipality;
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [allResponses, filterMonth, filterYear, filterMunicipality, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const stats = useMemo(() => calculateStats(filteredResponses, allResponses), [filteredResponses, allResponses]);

  const getScoreColor = (value: number) => {
    if (value >= 9) return '#10b981'; // Excelente
    if (value >= 7) return '#3b82f6'; // Bom
    if (value >= 5) return '#f59e0b'; // Regular
    return '#ef4444'; // Ruim
  };

  const getScoreLabel = (value: number) => {
    if (value >= 9) return 'Excelente';
    if (value >= 7) return 'Bom';
    if (value >= 5) return 'Regular';
    return 'Ruim';
  };

  const chartData = [
    { name: 'Qualidade Técnica', value: stats.averagesByCriteria.technicalQuality, label: getScoreLabel(stats.averagesByCriteria.technicalQuality) },
    { name: 'Resolutividade', value: stats.averagesByCriteria.resolutivity, label: getScoreLabel(stats.averagesByCriteria.resolutivity) },
    { name: 'Prazo/Entrega', value: stats.averagesByCriteria.deadlineCompliance, label: getScoreLabel(stats.averagesByCriteria.deadlineCompliance) },
    { name: 'Comunicação', value: stats.averagesByCriteria.communication, label: getScoreLabel(stats.averagesByCriteria.communication) },
    { name: 'Satisfação Geral', value: stats.averagesByCriteria.overallSatisfaction, label: getScoreLabel(stats.averagesByCriteria.overallSatisfaction) },
  ];

  const evolutionData = useMemo(() => {
    const selectedYear = filterYear ? parseInt(filterYear) : new Date().getFullYear();
    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Check if Janeiro was somehow missing or if we need to be more explicit
    if (monthLabels[0] !== 'Jan') {
      monthLabels.unshift('Jan');
    }
    
    // We want evolution to respect municipality filter if set
    const baseData = filterMunicipality 
      ? allResponses.filter(r => r.municipality === filterMunicipality)
      : allResponses;

    return monthLabels.map((label, index) => {
      const monthIndex = index; 
      const monthResponses = baseData.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === monthIndex && d.getFullYear() === selectedYear;
      });

      const average = monthResponses.length > 0 
        ? Number((monthResponses.reduce((acc, curr) => acc + curr.average, 0) / monthResponses.length).toFixed(1))
        : 0;

      return { month: label, average };
    });
  }, [allResponses, filterYear, filterMunicipality]);

  const years = useMemo(() => {
    const yrs = Array.from(new Set(allResponses.map(r => new Date(r.date).getFullYear()))).sort((a: number, b: number) => b - a);
    return yrs.length > 0 ? yrs : [new Date().getFullYear()];
  }, [allResponses]);

  const months = [
    { v: '1', label: 'Janeiro' },
    { v: '2', label: 'Fevereiro' },
    { v: '3', label: 'Março' },
    { v: '4', label: 'Abril' },
    { v: '5', label: 'Maio' },
    { v: '6', label: 'Junho' },
    { v: '7', label: 'Julho' },
    { v: '8', label: 'Agosto' },
    { v: '9', label: 'Setembro' },
    { v: '10', label: 'Outubro' },
    { v: '11', label: 'Novembro' },
    { v: '12', label: 'Dezembro' }
  ];

  // If not authenticated or error occurred, show login/error page
  if (!authLoading && (!user || error)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg transition-colors duration-500">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full card shadow-2xl p-10 flex flex-col items-center text-center gap-6"
        >
          <div className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center mb-2",
            error ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
          )}>
            {error ? <AlertCircle size={40} /> : <LogIn size={40} />}
          </div>
          <div>
            <h1 className="text-3xl font-black text-text-main mb-2">
              {error ? "Acesso Negado" : "WM SAÚDE"}
            </h1>
            <p className="text-text-muted font-bold uppercase tracking-[.2em] text-sm">Dashboard de Satisfação</p>
          </div>
          <p className="text-text-muted">
            {error || "Acesse o painel administrativo para visualizar as avaliações dos clientes."}
          </p>
          
          {user && (
            <div className="bg-slate-100 p-3 rounded-xl border border-border flex flex-col gap-1 items-center">
              <span className="text-[10px] uppercase tracking-widest font-black text-text-muted">Logado como:</span>
              <span className="text-sm font-bold text-text-main">{user.email}</span>
            </div>
          )}
          
          {error ? (
            <button 
              onClick={() => logout()}
              className="w-full py-4 px-6 rounded-2xl bg-danger text-white font-black text-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-danger/20"
            >
              <LogOut size={22} />
              Sair e tentar outro e-mail
            </button>
          ) : (
            <button 
              onClick={() => signIn()}
              className="w-full py-4 px-6 rounded-2xl bg-primary text-white font-black text-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              Entrar com Google
            </button>
          )}
          
          <Link to="/form" className="text-primary font-bold hover:underline">Ir para Formulário</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg text-primary font-sans">
      {/* Header with Filters */}
      <header className="bg-[#0f172a] border-b border-slate-800 px-6 py-4 shrink-0 z-20 shadow-sm">
        {/* Top Row: Logo & User controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="https://raw.githubusercontent.com/francisco-wellington/logos-wm/ac3c8394a54a53584815e1d98d699464508d3e10/Logo_colorida_new.png" 
                alt="WM Logo" 
                className="h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="h-6 w-[1px] bg-slate-800 hidden lg:block"></div>
            <nav className="flex gap-2">
              <Link 
                to="/form" 
                className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg font-bold text-sm hover:bg-[#2563eb] transition-all shadow-sm flex items-center gap-2"
              >
                Novo Formulário
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-6 w-[1px] bg-slate-800 hidden lg:block"></div>
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{user.displayName}</span>
                  <span className="text-[10px] text-slate-500 font-bold">{user.email}</span>
                </div>
                <button 
                  onClick={() => logout()}
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg bg-slate-800 border border-slate-700"
                  title="Sair"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-5 flex flex-col gap-5 bg-bg/50 relative">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/40 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Carregando Dados...</p>
            </div>
          </div>
        )}

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4 py-2">
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
            <select 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="pl-9 pr-8 py-2 bg-card-bg border border-border rounded-xl text-sm font-bold text-text-main outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer hover:border-border/80 min-w-[160px]"
            >
              <option value="">Mês: Todos</option>
              {months.map(m => <option key={m.v} value={m.v}>{m.label}</option>)}
            </select>
          </div>

          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
            <select 
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="pl-9 pr-6 py-2 bg-card-bg border border-border rounded-xl text-sm font-bold text-text-main outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer hover:border-border/80 min-w-[140px]"
            >
              <option value="">Ano: Todos</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="relative group flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={14} />
            <select 
              value={filterMunicipality}
              onChange={(e) => setFilterMunicipality(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-card-bg border border-border rounded-xl text-sm font-bold text-text-main outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer hover:border-border/80"
            >
              <option value="">Município: Todos</option>
              {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {(filterMonth || filterYear || filterMunicipality) && (
            <button 
              onClick={() => {
                setFilterMonth('');
                setFilterYear('');
                setFilterMunicipality('');
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-danger hover:bg-danger/10 rounded-xl text-sm font-bold transition-all border border-transparent hover:border-danger/20"
            >
              <XCircle size={14} />
              Limpar Filtros
            </button>
          )}
        </div>
        
        {/* Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 shrink-0">
          <div className="card !p-5 bg-card-bg border-border flex flex-col items-center justify-center text-center">
            <div className="stat-label">Média</div>
            <div className={cn(
              "stat-val mt-1",
              stats.generalAverage >= 9 ? "text-success" : stats.generalAverage >= 7 ? "text-accent" : "text-danger"
            )}>
              {stats.generalAverage.toFixed(1)}
            </div>
          </div>

          <div className="card !p-5 bg-card-bg border-border flex flex-col items-center justify-center text-center">
            <div className="stat-label">Total de Respostas</div>
            <div className="stat-val mt-1 text-primary">
              {stats.totalResponses}
            </div>
          </div>

          <div className="card !p-5 bg-card-bg border-border flex flex-col items-center justify-center text-center">
            <div className="stat-label">% Satisfação Alta</div>
            <div className="stat-val mt-1 text-success">
              {stats.highSatisfactionPercent}%
            </div>
          </div>

          <div className="card !p-5 bg-card-bg border-border flex flex-col items-center justify-center text-center">
            <div className="stat-label">Pior Critério</div>
            <div className="stat-val mt-1 text-danger !text-[20px]">
              {stats.worstCriterion.name}
            </div>
            <div className="text-[14px] font-bold text-danger/70 mt-1">{stats.worstCriterion.value.toFixed(1)}</div>
          </div>

          <motion.div 
            whileHover={{ y: -2 }}
            onClick={() => setFilterMunicipality(stats.criticalMunicipality.name)}
            className="card !p-5 bg-card-bg border-border flex flex-col items-center justify-center text-center cursor-pointer group hover:border-warning/50 transition-all relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Filter size={12} className="text-warning" />
            </div>
            <div className="stat-label">Município Crítico</div>
            <div className="stat-val mt-1 text-warning !text-[20px]" style={{ color: '#f59e0b' }}>
              {stats.criticalMunicipality.name}
            </div>
            <div className="text-[14px] font-bold mt-1" style={{ color: '#f59e0b' }}>{stats.criticalMunicipality.value.toFixed(1)}</div>
            <div className="mt-2 text-[10px] uppercase tracking-widest font-black text-warning/50 group-hover:text-warning transition-colors flex items-center gap-1">
              <Filter size={10} /> Filtrar Município
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            onClick={() => setFilterMunicipality(stats.bestEvolution.name)}
            className="card !p-5 bg-card-bg border-border flex flex-col items-center justify-center text-center cursor-pointer group hover:border-accent/50 transition-all relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Filter size={12} className="text-accent" />
            </div>
            <div className="stat-label">Melhor Evolução</div>
            <div className="stat-val mt-1 text-accent !text-[20px]">
              {stats.bestEvolution.name}
            </div>
            <div className="text-[14px] font-bold text-accent/70 mt-1">+{stats.bestEvolution.value}</div>
            <div className="mt-2 text-[10px] uppercase tracking-widest font-black text-accent/50 group-hover:text-accent transition-colors flex items-center gap-1">
              <Filter size={10} /> Filtrar Município
            </div>
          </motion.div>
        </div>

        {/* Dashboard Grid Content */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5 h-[280px]">
            <div className="card !p-6 flex flex-col">
              <div className="stat-label pb-4 border-b border-border">Médias por Critério</div>
              <div className="flex-1 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} stroke="#e2e8f0" />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getScoreColor(entry.value)} 
                        />
                      ))}
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        fontSize={12} 
                        fontWeight={700}
                        fill="#475569"
                      />
                    </Bar>
                    <XAxis dataKey="name" fontSize={11} tick={{ fill: '#475569', fontWeight: 600 }} />
                    <YAxis domain={[0, 10]} fontSize={11} tick={{ fill: '#475569' }} />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }} 
                      formatter={(value: number) => [`${value.toFixed(1)} (${getScoreLabel(value)})`, 'Média']}
                      contentStyle={{ 
                        fontSize: '12px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: '#fff',
                        color: '#0f172a'
                      }} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card !p-6 flex flex-col">
              <div className="stat-label pb-4 border-b border-border">Evolução Mensal</div>
              <div className="flex-1 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} stroke="#e2e8f0" />
                    <Area 
                      type="monotone" 
                      dataKey="average" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      fillOpacity={1}
                      fill="url(#colorAvg)"
                      dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                    >
                      <LabelList 
                        dataKey="average" 
                        position="top" 
                        offset={10}
                        fontSize={11} 
                        fontWeight={700}
                        fill="#475569"
                      />
                    </Area>
                    <XAxis 
                      dataKey="month" 
                      fontSize={11} 
                      tick={{ fill: '#475569', fontWeight: 600 }}
                      interval={0}
                      padding={{ left: 15, right: 15 }}
                    />
                    <YAxis domain={[0, 10]} hide />
                    <Tooltip contentStyle={{ 
                      fontSize: '12px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      backgroundColor: '#fff',
                      color: '#0f172a'
                    }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card !p-0 flex flex-col min-h-[400px]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="stat-label !mb-0">Listagem de Avaliações</div>
              <span className="text-[12px] font-black text-text-muted bg-bg px-2 py-1 rounded">
                TOTAL: {filteredResponses.length}
              </span>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full border-collapse text-[16px]">
                <thead>
                  <tr className="bg-bg">
                    <th 
                      onClick={() => requestSort('municipality')}
                      className="text-left px-2 py-4 text-text-muted font-bold border-b border-border text-[14px] uppercase tracking-wider cursor-pointer hover:bg-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Município {getSortIcon('municipality')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('clientName')}
                      className="text-left px-2 py-4 text-text-muted font-bold border-b border-border text-[14px] uppercase tracking-wider cursor-pointer hover:bg-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Nome {getSortIcon('clientName')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('clientPhone')}
                      className="text-left px-2 py-4 text-text-muted font-bold border-b border-border text-[14px] uppercase tracking-wider cursor-pointer hover:bg-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Telefone {getSortIcon('clientPhone')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('technicalQuality')}
                      className="text-left px-2 py-4 text-text-muted font-bold border-b border-border text-[14px] uppercase tracking-wider cursor-pointer hover:bg-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Qualidade Técnica {getSortIcon('technicalQuality')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('resolutivity')}
                      className="text-left px-2 py-4 text-text-muted font-bold border-b border-border text-[14px] uppercase tracking-wider cursor-pointer hover:bg-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Resolutividade {getSortIcon('resolutivity')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('deadlineCompliance')}
                      className="text-left px-2 py-4 text-text-muted font-bold border-b border-border text-[14px] uppercase tracking-wider cursor-pointer hover:bg-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Prazo/Entrega {getSortIcon('deadlineCompliance')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('communication')}
                      className="text-left px-2 py-4 text-text-muted font-bold border-b border-border text-[14px] uppercase tracking-wider cursor-pointer hover:bg-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Comunicação {getSortIcon('communication')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('overallSatisfaction')}
                      className="text-left px-2 py-4 text-text-muted font-bold border-b border-border text-[14px] uppercase tracking-wider cursor-pointer hover:bg-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Satisfação Geral {getSortIcon('overallSatisfaction')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('average')}
                      className="text-left px-2 py-4 text-text-muted font-bold border-b border-border text-[14px] uppercase tracking-wider cursor-pointer hover:bg-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Média {getSortIcon('average')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('suggestions')}
                      className="text-left px-2 py-4 text-text-muted font-bold border-b border-border text-[14px] uppercase tracking-wider cursor-pointer hover:bg-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Observações {getSortIcon('suggestions')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('date')}
                      className="text-right px-2 py-4 text-text-muted font-bold border-b border-border text-[14px] uppercase tracking-wider cursor-pointer hover:bg-bg/80 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        Data {getSortIcon('date')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredResponses.length > 0 ? (
                    filteredResponses.map((r, i) => (
                      <motion.tr 
                        key={r.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-bg/50 transition-colors"
                      >
                        <td className="px-2 py-3.5 font-bold text-primary whitespace-nowrap">{r.municipality}</td>
                        <td className="px-2 py-3.5 text-text-muted whitespace-nowrap">{r.clientName || '-'}</td>
                        <td className="px-2 py-3.5 text-text-muted whitespace-nowrap">{r.clientPhone || '-'}</td>
                        <td className="px-2 py-3.5 text-text-main font-medium">{r.technicalQuality}</td>
                        <td className="px-2 py-3.5 text-text-main font-medium">{r.resolutivity}</td>
                        <td className="px-2 py-3.5 text-text-main font-medium">{r.deadlineCompliance}</td>
                        <td className="px-2 py-3.5 text-text-main font-medium">{r.communication}</td>
                        <td className="px-2 py-3.5 text-text-main font-medium">{r.overallSatisfaction}</td>
                        <td className="px-2 py-3.5">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg font-black text-[14px] shadow-xs border",
                            r.average >= 9 
                              ? "bg-success/20 text-[#10b981] border-success/20" 
                              : r.average >= 7 
                                ? "bg-accent/20 text-[#3b82f6] border-accent/20"
                                : "bg-danger/20 text-[#ef4444] border-danger/20"
                          )}>
                            {r.average.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 text-text-muted text-[13px] italic min-w-[300px]" title={r.suggestions}>
                          {r.suggestions || '-'}
                        </td>
                        <td className="px-2 py-3.5 text-text-muted text-right font-medium whitespace-nowrap">{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="p-12 text-center text-text-muted italic">
                        <div className="flex flex-col items-center gap-2">
                          <Filter size={32} className="opacity-20 mb-2" />
                          Nenhuma avaliação encontrada para os filtros selecionados.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

