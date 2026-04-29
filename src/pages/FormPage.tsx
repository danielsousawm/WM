/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Send, Sun, Moon, AlertCircle, X } from 'lucide-react';
import { saveResponse } from '../lib/storage';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { MUNICIPALITIES } from '../constants/municipalities';
import { useTheme } from '../contexts/ThemeContext';

const QUESTIONS = [
  {
    id: 'technicalQuality',
    label: 'Qualidade Técnica',
    question: 'Como você avalia a qualidade técnica dos serviços prestados?',
    context: 'Considere a precisão das informações, o domínio do assunto pela equipe e a conformidade com as normas técnicas vigentes.',
    help: '0-4: Ruim | 5-6: Regular | 7-8: Bom | 9-10: Excelente'
  },
  {
    id: 'resolutivity',
    label: 'Resolutividade',
    question: 'O serviço prestado resolveu sua demanda?',
    context: 'Avalie se a solução apresentada foi definitiva, se atendeu às expectativas e se não gerou retrabalho.',
    help: '0-4: Não resolveu | 5-6: Parcial | 7-8: Resolvido | 9-10: Excelente'
  },
  {
    id: 'deadlineCompliance',
    label: 'Cumprimento de Prazo',
    question: 'Os prazos foram cumpridos?',
    context: 'Leve em conta o tempo de resposta inicial, o cumprimento do cronograma acordado e a pontualidade na entrega final.',
    help: '0-4: Atrasos frequentes | 5-6: Alguns atrasos | 7-8: Cumpriu | 9-10: Pontual'
  },
  {
    id: 'communication',
    label: 'Comunicação',
    question: 'Como você avalia a comunicação da equipe?',
    context: 'Analise a clareza nas explicações, a facilidade de contato com a equipe e a proatividade no envio de atualizações.',
    help: '0-4: Falha | 5-6: Regular | 7-8: Boa | 9-10: Excelente'
  },
  {
    id: 'overallSatisfaction',
    label: 'Satisfação Geral',
    question: 'Qual sua satisfação geral com o serviço?',
    context: 'Refletindo sobre todos os aspectos do atendimento, qual sua percepção de valor e confiança nos serviços prestados?',
    help: '0-4: Insatisfeito | 5-6: Parcial | 7-8: Satisfeito | 9-10: Muito satisfeito'
  }
];

// Pastel color generator for scores 0-10
const getPastelColor = (score: number, isSelected: boolean, isDark: boolean) => {
  // HSL scale: Red (0) to Green (120)
  const hue = (score * 12);
  const saturation = isSelected ? (isDark ? 50 : 70) : (isDark ? 30 : 40);
  const lightness = isSelected ? (isDark ? 30 : 80) : (isDark ? 15 : 95);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export default function FormPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    municipality: '',
    clientName: '',
    clientPhone: '',
    technicalQuality: 0,
    resolutivity: 0,
    deadlineCompliance: 0,
    communication: 0,
    overallSatisfaction: 0,
    suggestions: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModalError, setShowModalError] = useState(false);

  const isMunicipalitySelected = MUNICIPALITIES.includes(formData.municipality.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.municipality.trim()) {
      newErrors.municipality = 'Selecione um município primeiro';
    } else if (!isMunicipalitySelected) {
      setShowModalError(true);
      return;
    }

    if (formData.clientPhone && formData.clientPhone.length !== 11) {
      newErrors.clientPhone = 'O telefone deve ter exatamente 11 dígitos (DDD + número)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await saveResponse(formData);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Ocorreu um erro ao enviar sua avaliação. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      municipality: '',
      clientName: '',
      clientPhone: '',
      technicalQuality: 0,
      resolutivity: 0,
      deadlineCompliance: 0,
      communication: 0,
      overallSatisfaction: 0,
      suggestions: ''
    });
    setErrors({});
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col h-screen bg-bg text-primary overflow-hidden font-sans">
        <header className="h-[60px] bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="https://raw.githubusercontent.com/francisco-wellington/logos-wm/ac3c8394a54a53584815e1d98d699464508d3e10/Logo_colorida_new.png" 
                alt="WM Logo" 
                className="h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 flex items-center justify-center bg-bg/50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full card shadow-2xl !p-10 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                <Send size={32} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-[32px] font-black text-primary">Obrigado!</h2>
              <p className="text-text-main font-medium leading-relaxed">
                Sua avaliação foi enviada com sucesso. Sua opinião é fundamental para a melhoria contínua dos nossos processos.
              </p>
            </div>

            <div className="pt-6">
              <Link 
                to="/" 
                className="w-full py-4 bg-primary text-card-bg rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Fechar
              </Link>
            </div>
            
            <p className="text-[12px] text-text-muted uppercase tracking-[0.1em] font-bold opacity-70 pt-4">
              WM Saúde - Gestão e Tecnologia
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg text-primary overflow-hidden font-sans">
      {/* Header */}
      <header className="h-[60px] bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="https://raw.githubusercontent.com/francisco-wellington/logos-wm/ac3c8394a54a53584815e1d98d699464508d3e10/Logo_colorida_new.png" 
              alt="WM Logo" 
              className="h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 overflow-y-auto bg-bg/50">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="card !p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-4 border-b border-border pb-4">
              <div>
                <h2 className="text-[26px] font-bold text-primary">Pesquisa de Satisfação</h2>
                <p className="text-base text-text-muted uppercase tracking-wider font-semibold">Avaliação de Desempenho e Qualidade de Atendimento</p>
              </div>
              <div className="hidden md:block w-32"></div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="block text-[18px] font-bold text-[#475569]">
                  IDENTIFICAÇÃO DO MUNICÍPIO 
                </label>
                  <input 
                    type="text"
                    list="municipalities-list"
                    value={formData.municipality}
                    onChange={(e) => updateField('municipality', e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 border rounded-xl text-base transition-all outline-none bg-card-bg text-primary",
                      errors.municipality ? "border-danger ring-2 ring-danger/10" : "border-[#cbd5e1] dark:border-border dark:focus:border-accent focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/5"
                    )}
                    placeholder="Digite o nome do município..."
                  />
                  <datalist id="municipalities-list">
                    {MUNICIPALITIES.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                {errors.municipality && <p className="text-[13px] text-[#ef4444] mt-1 italic font-medium">{errors.municipality}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-2">
                  <label className="block text-[16px] font-bold text-text-muted uppercase tracking-wider">
                    Seu Nome <span className="text-[13px] lowercase font-normal italic opacity-70">(opcional)</span>
                  </label>
                  <input 
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                    className="w-full px-4 py-3 border border-[#cbd5e1] dark:border-border rounded-xl text-base bg-card-bg text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all"
                    placeholder="Como podemos te chamar?"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[16px] font-bold text-text-muted uppercase tracking-wider">
                    Seu Telefone <span className="text-[13px] lowercase font-normal italic opacity-70">(opcional)</span>
                  </label>
                  <input 
                    type="text"
                    value={formData.clientPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      updateField('clientPhone', val);
                    }}
                    className={cn(
                      "w-full px-4 py-3 border rounded-xl text-base bg-card-bg text-primary outline-none focus:ring-4 focus:ring-accent/5 transition-all",
                      errors.clientPhone ? "border-danger ring-2 ring-danger/10" : "border-[#cbd5e1] dark:border-border focus:border-accent"
                    )}
                    placeholder="Somente números (DDD + número)"
                  />
                  {errors.clientPhone && <p className="text-[13px] text-[#ef4444] mt-1 italic font-medium">{errors.clientPhone}</p>}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pb-12">
            {QUESTIONS.map((q) => (
              <motion.div 
                key={q.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card !p-6 space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-7 bg-accent rounded-full"></span>
                    <h3 className="font-bold text-[22px] text-primary">{q.label}</h3>
                  </div>
                  <p className="text-[20px] text-text-main font-medium pl-4 italic leading-tight">{q.question}</p>
                  <p className="text-[16px] text-text-muted pl-4 leading-relaxed">{q.context}</p>
                </div>

                <div className="pl-4 space-y-5">
                  <div className="flex flex-wrap gap-2.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const isSelected = formData[q.id as keyof typeof formData] === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => updateField(q.id, num)}
                          style={{ 
                            backgroundColor: getPastelColor(num, isSelected, theme === 'dark'),
                            borderColor: isSelected ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)'
                          }}
                          className={cn(
                            "w-12 h-12 rounded-lg text-[18px] font-black transition-all border shadow-sm flex items-center justify-center",
                            isSelected 
                              ? "scale-110 ring-2 ring-offset-4 ring-accent/30 text-primary z-10" 
                              : "text-text-muted hover:brightness-95 active:scale-95" 
                          )}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center bg-bg p-3.5 rounded-xl border border-border">
                    <p className="text-[15px] text-text-muted font-bold uppercase tracking-wider">{q.help}</p>
                    <span className="text-[15px] font-black text-primary bg-card-bg px-3 py-1 rounded-lg shadow-sm border border-border min-w-[70px] text-center">
                      VOTO: {formData[q.id as keyof typeof formData]}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Suggestions */}
            <div className="card !p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-7 bg-zinc-400 rounded-full"></span>
                <h3 className="font-bold text-[22px] text-primary">Observações Adicionais</h3>
              </div>
              <textarea 
                rows={5}
                value={formData.suggestions}
                onChange={(e) => updateField('suggestions', e.target.value)}
                className="w-full px-4 py-4 border border-[#cbd5e1] dark:border-border dark:focus:border-accent rounded-xl text-base focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/5 outline-none transition-all resize-none bg-card-bg text-primary"
                placeholder="Neste espaço, você pode detalhar críticas, sugestões de melhoria ou elogios à equipe..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "px-12 py-5 rounded-2xl font-black text-[20px] transition-all flex items-center gap-4 shadow-xl border-none",
                  isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-[#10b981] text-white hover:opacity-95 active:scale-[0.98] shadow-emerald-500/10"
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={22} />
                    Finalizar e Enviar Avaliação
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Error Modal */}
      {showModalError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card-bg w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-primary">Atenção</h3>
                <p className="text-sm text-text-main leading-relaxed">
                  Por favor, selecione um município válido da lista antes de prosseguir com a avaliação.
                </p>
              </div>
              <button 
                onClick={() => setShowModalError(false)}
                className="w-full py-3 bg-danger text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-danger/20"
              >
                Entendi
              </button>
            </div>
            <div className="bg-bg/50 px-6 py-3 flex justify-center border-t border-border">
              <p className="text-[11px] text-text-muted uppercase tracking-widest font-bold">WM Saúde • Validação</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


