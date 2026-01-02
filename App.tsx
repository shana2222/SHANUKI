
import React, { useState, useRef } from 'react';
import { UnitFormInputs, GenerationResult } from './types';
import { generateLearningUnit, suggestInterdisciplinarity } from './services/geminiService';
import { INTERDISCIPLINARY_SUGGESTIONS, EDUCATIONAL_LEVELS } from './constants';

const App: React.FC = () => {
  const [inputs, setInputs] = useState<UnitFormInputs>({
    language: 'Python',
    topic: '',
    interdisciplinarySubject: '',
    context: '',
    level: EDUCATIONAL_LEVELS[0],
    programText: ''
  });
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = (window as any).pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    
    // Extraer las primeras 5 páginas para no saturar el prompt
    const numPages = Math.min(pdf.numPages, 5);
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + " ";
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      try {
        const text = await extractTextFromPDF(file);
        setInputs(prev => ({ ...prev, programText: text }));
        
        // Intentar sugerir interdisciplinariedad automáticamente
        setSuggesting(true);
        const suggestion = await suggestInterdisciplinarity(text, inputs.level);
        setInputs(prev => ({ ...prev, interdisciplinarySubject: suggestion }));
      } catch (err) {
        console.error("Error al leer PDF:", err);
        alert("No se pudo leer el contenido del PDF.");
      } finally {
        setSuggesting(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!inputs.topic || !inputs.context) {
      alert("Por favor, completa el tema y el contexto.");
      return;
    }

    setLoading(true);
    try {
      const data = await generateLearningUnit(inputs);
      setResult(data);
      setStep(2);
    } catch (error) {
      console.error(error);
      alert("Error al generar la unidad.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-800 bg-gray-900/80 backdrop-blur-md px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-4xl font-bold">rocket_launch</span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-white">SHANUKI</h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
          <span className="hidden sm:inline">Unidad con ABP</span>
          <div className="size-8 rounded-full border border-gray-700 bg-[url('https://api.dicebear.com/7.x/bottts/svg?seed=shanuki')] bg-cover" />
        </div>
      </header>

      <main className="flex-1 px-4 py-8 md:px-10 lg:px-20 max-w-6xl mx-auto w-full">
        {step === 1 ? (
          <div className="space-y-8 animate-in">
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">Panel de Creación ABP</h1>
              <p className="text-gray-400">Diseña una experiencia de aprendizaje basada en problemas integrando tu programa oficial.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Columna Izquierda: Configuración Base */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nivel Educativo</label>
                    <select 
                      name="level"
                      value={inputs.level}
                      onChange={handleInputChange}
                      className="w-full h-12 bg-gray-900 border border-gray-700 rounded-xl px-4 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                    >
                      {EDUCATIONAL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tecnología / Lenguaje</label>
                    <input 
                      name="language"
                      value={inputs.language}
                      onChange={handleInputChange}
                      className="w-full h-12 bg-gray-900 border border-gray-700 rounded-xl px-4 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                      placeholder="ej. Python"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Programa de Referencia (PDF)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${fileName ? 'border-primary bg-primary/5' : 'border-gray-700 hover:border-gray-500'}`}
                    >
                      <span className="material-symbols-outlined text-gray-500">{fileName ? 'picture_as_pdf' : 'upload_file'}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[80%] px-2">
                        {fileName || 'Cargar programa oficial'}
                      </span>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Detalle de la Actividad */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-800/40 p-8 rounded-3xl border border-gray-700 shadow-2xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tema Técnico</label>
                      <input 
                        name="topic"
                        value={inputs.topic}
                        onChange={handleInputChange}
                        className="w-full h-12 bg-gray-900 border border-gray-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary outline-none"
                        placeholder="ej. Condicionales If/Else"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {suggesting ? 'Buscando enlace...' : 'Materia Interdisciplinaria'}
                      </label>
                      <div className="relative">
                        <input 
                          name="interdisciplinarySubject"
                          value={inputs.interdisciplinarySubject}
                          onChange={handleInputChange}
                          className="w-full h-12 bg-gray-900 border border-gray-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-primary outline-none"
                          placeholder="ej. Biología: Células"
                        />
                        {suggesting && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contexto y Desafío Sugerido</label>
                    <textarea 
                      name="context"
                      value={inputs.context}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-primary outline-none resize-none"
                      placeholder="Describe la situación problemática que los alumnos deberán resolver..."
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="h-14 px-10 rounded-2xl bg-primary hover:bg-blue-600 text-white font-black text-lg flex items-center gap-3 transition-all disabled:opacity-50"
                    >
                      {loading ? 'GENERANDO...' : 'GENERAR UNIDAD INTERACTIVA'}
                      {!loading && <span className="material-symbols-outlined">magic_button</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-800/30 p-6 rounded-3xl border border-gray-800">
              <div>
                <h2 className="text-2xl font-black text-white">Unidad Lista: {inputs.topic}</h2>
                <p className="text-gray-400 text-sm">Integra {inputs.interdisciplinarySubject} para {inputs.level}</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setStep(1)} className="flex-1 md:flex-none h-12 px-6 rounded-xl border border-gray-700 text-white font-bold hover:bg-gray-800 transition-all">Editar</button>
                <button 
                  onClick={() => {
                    const blob = new Blob([result?.html || ''], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Shanuki_Unidad_${inputs.topic.replace(/\s/g, '_')}.html`;
                    a.click();
                  }}
                  className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined">download</span> Descargar HTML
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 p-5 bg-amber-900/10 border border-amber-600/20 rounded-2xl">
                <h3 className="text-amber-500 text-xs font-black uppercase tracking-widest mb-4">Claves de Validación</h3>
                <div className="grid grid-cols-2 gap-2">
                  {result?.distractorWords.map((w, i) => (
                    <div key={i} className="bg-gray-900 p-2 rounded-lg text-[10px] text-gray-400 font-bold border border-gray-800 text-center">{w}</div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-3 bg-white rounded-[2rem] overflow-hidden shadow-2xl h-[800px] border-8 border-gray-800">
                <iframe srcDoc={result?.html} className="w-full h-full border-none" />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-10 text-center border-t border-gray-800 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
        Shanuki 5.0 - Inteligencia Artificial Aplicada a la Educación de Uruguay
      </footer>
    </div>
  );
};

export default App;
