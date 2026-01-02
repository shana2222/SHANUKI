
import React, { useState, useRef } from 'react';
import { UnitFormInputs, GenerationResult, GenerationMode } from './types';
import { generateLearningUnit, suggestInterdisciplinarity, updateLearningUnit } from './services/geminiService';
import { INTERDISCIPLINARY_SUGGESTIONS, EDUCATIONAL_LEVELS, GAMIFIED_THEMES } from './constants';

const App: React.FC = () => {
  const [inputs, setInputs] = useState<UnitFormInputs>({
    language: 'Python',
    topic: '',
    level: EDUCATIONAL_LEVELS[0],
    csTheoryText: '',
    mode: 'gamified',
    interdisciplinarySubject: '',
    context: '',
    programText: '',
    narrativeTheme: GAMIFIED_THEMES[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  // File names for display
  const [csFileName, setCsFileName] = useState<string | null>(null);
  const [programFileName, setProgramFileName] = useState<string | null>(null);

  const csFileInputRef = useRef<HTMLInputElement>(null);
  const programFileInputRef = useRef<HTMLInputElement>(null);

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
    const numPages = Math.min(pdf.numPages, 6); // Read up to 6 pages
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + " ";
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cs' | 'program') => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Intentar extraer texto del PDF
      let text = "";
      try {
        text = await extractTextFromPDF(file);
      } catch (err) {
        console.error("Error al leer PDF:", err);
        alert("No se pudo leer el archivo PDF. Asegúrate de que no esté dañado.");
        return;
      }

      // 2. Procesar el texto según el tipo
      if (type === 'cs') {
        setCsFileName(file.name);
        setInputs(prev => ({ ...prev, csTheoryText: text }));
      } else {
        setProgramFileName(file.name);
        setInputs(prev => ({ ...prev, programText: text }));
        
        // Llamada a la IA para sugerencias (Manejo de error específico)
        try {
            setSuggesting(true);
            const suggestion = await suggestInterdisciplinarity(text, inputs.level);
            setInputs(prev => ({ ...prev, interdisciplinarySubject: suggestion }));
        } catch (apiError: any) {
            console.error("Error de API al analizar interdisciplinariedad:", apiError);
            let msg = "No se pudo conectar con la IA. ";
            if (apiError.toString().includes("429")) msg += "Cuota excedida. Intenta en un minuto.";
            else msg += "Verifica tu API Key.";
            alert(msg);
        } finally {
            setSuggesting(false);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!inputs.topic) {
      alert("Por favor, ingresa el tema técnico.");
      return;
    }
    if (inputs.mode === 'pbl' && (!inputs.context || !inputs.interdisciplinarySubject)) {
        alert("Para modo ABP, completa materia y contexto.");
        return;
    }

    setLoading(true);
    try {
      const data = await generateLearningUnit(inputs);
      setResult(data);
      setStep(2);
    } catch (error: any) {
      console.error("Error generando unidad:", error);
      let msg = "Error al generar la unidad. ";
      if (error.toString().includes("429")) msg += "Todos los modelos están saturados. Por favor espera un momento.";
      else msg += "Verifica la consola y tu API Key.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!result || !feedback) return;
    setIsRegenerating(true);
    try {
      const data = await updateLearningUnit(result.html, feedback);
      setResult(data);
      setFeedback("");
      alert("Unidad actualizada con éxito.");
    } catch (error: any) {
      console.error(error);
      let msg = "Error al actualizar. ";
      if (error.toString().includes("429")) msg += "Cuota excedida. Espera un momento.";
      alert(msg);
    } finally {
      setIsRegenerating(false);
    }
  };

  const isLowTierModel = result?.modelUsed === 'gemini-2.0-flash';

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
          <span className="hidden sm:inline">Generador Didáctico 5.0</span>
          <div className="size-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-950 border border-gray-700 flex items-center justify-center shadow-lg shadow-primary/20 hover:border-primary/50 transition-all cursor-help group" title="CPU Core - Shanuki AI">
             <span className="material-symbols-outlined text-primary text-2xl group-hover:text-white transition-colors">memory</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 md:px-10 lg:px-20 max-w-7xl mx-auto w-full">
        {step === 1 ? (
          <div className="space-y-8 animate-in">
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">Diseñador de Experiencias</h1>
                <p className="text-gray-400 mt-1">Crea recursos educativos potentes combinando teoría técnica y metodologías activas.</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start max-w-4xl">
                <span className="material-symbols-outlined text-blue-400 mt-0.5">integration_instructions</span>
                <p className="text-sm text-blue-100/90 leading-relaxed">
                  Se generará un HTML con estilo y programación listo para que lo copies y lo implementes en <strong>CREA</strong> o en <strong>Trinket</strong>, permitiéndote llevar la práctica al aula de forma inmediata.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Columna Izquierda: Datos Técnicos Base (4 columnas) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-gray-800/40 p-6 rounded-3xl border border-gray-700 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary">terminal</span>
                    <h3 className="font-bold text-white">Contenido Técnico</h3>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nivel Educativo</label>
                    <select 
                      name="level" value={inputs.level} onChange={handleInputChange}
                      className="w-full h-12 bg-gray-900 border border-gray-700 rounded-xl px-4 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                    >
                      {EDUCATIONAL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lenguaje / Tecnología</label>
                    <input 
                      name="language" value={inputs.language} onChange={handleInputChange}
                      className="w-full h-12 bg-gray-900 border border-gray-700 rounded-xl px-4 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                      placeholder="ej. Python"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tema Principal</label>
                    <input 
                      name="topic" value={inputs.topic} onChange={handleInputChange}
                      className="w-full h-12 bg-gray-900 border border-gray-700 rounded-xl px-4 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                      placeholder="ej. Ciclos For/While"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-700/50">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center justify-between">
                      Teórico de Informática (PDF)
                      <span className="material-symbols-outlined text-sm">school</span>
                    </label>
                    <div 
                      onClick={() => csFileInputRef.current?.click()}
                      className={`h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${csFileName ? 'border-primary bg-primary/10' : 'border-gray-700 hover:border-gray-500'}`}
                    >
                      <span className="text-gray-500 material-symbols-outlined text-xl">{csFileName ? 'check_circle' : 'upload_file'}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[90%] px-2">
                        {csFileName || 'Adjuntar material teórico'}
                      </span>
                    </div>
                    <input type="file" ref={csFileInputRef} onChange={(e) => handleFileUpload(e, 'cs')} accept=".pdf" className="hidden" />
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Configuración de la Experiencia (8 columnas) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Selector de Modo */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setInputs(prev => ({ ...prev, mode: 'gamified' }))}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${inputs.mode === 'gamified' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-800 hover:bg-gray-800'}`}
                  >
                    <div className={`size-12 rounded-full flex items-center justify-center ${inputs.mode === 'gamified' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                      <span className="material-symbols-outlined">sports_esports</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-white">Gamificación</h3>
                      <p className="text-xs text-gray-400">Narrativa y estilo juego visual</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setInputs(prev => ({ ...prev, mode: 'pbl' }))}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${inputs.mode === 'pbl' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 hover:bg-gray-800'}`}
                  >
                    <div className={`size-12 rounded-full flex items-center justify-center ${inputs.mode === 'pbl' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                      <span className="material-symbols-outlined">diversity_3</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-white">ABP Interdisciplinar</h3>
                      <p className="text-xs text-gray-400">Problemas reales con otras materias</p>
                    </div>
                  </button>
                </div>

                <div className="bg-gray-800/40 p-8 rounded-3xl border border-gray-700 shadow-2xl space-y-6">
                  
                  {inputs.mode === 'gamified' ? (
                     <div className="space-y-4 animate-in">
                       <div className="space-y-2">
                        <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Temática Narrativa</label>
                        <select 
                          name="narrativeTheme" value={inputs.narrativeTheme} onChange={handleInputChange}
                          className="w-full h-14 bg-gray-900 border border-purple-500/30 rounded-xl px-4 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                          {GAMIFIED_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                       </div>
                       <div className="p-4 bg-purple-900/20 rounded-xl border border-purple-500/20 text-sm text-purple-200">
                          <p><span className="font-bold">Nota:</span> Se generará una historia inmersiva donde el estudiante es el protagonista. Los colores, tipografías y el lenguaje se adaptarán al tema "{inputs.narrativeTheme}".</p>
                       </div>
                     </div>
                  ) : (
                    <div className="space-y-6 animate-in">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                            {suggesting ? 'Analizando...' : 'Materia Interdisciplinaria'}
                          </label>
                          <input 
                            name="interdisciplinarySubject" value={inputs.interdisciplinarySubject} onChange={handleInputChange}
                            className="w-full h-12 bg-gray-900 border border-gray-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="ej. Biología"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PDF Otra Asignatura</label>
                          <div 
                            onClick={() => programFileInputRef.current?.click()}
                            className={`h-12 border border-dashed rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${programFileName ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}`}
                          >
                            <span className="material-symbols-outlined text-gray-400 text-sm">{programFileName ? 'description' : 'upload'}</span>
                            <span className="text-xs text-gray-400 truncate max-w-[150px]">{programFileName || 'Programa asignatura'}</span>
                          </div>
                          <input type="file" ref={programFileInputRef} onChange={(e) => handleFileUpload(e, 'program')} accept=".pdf" className="hidden" />
                        </div>
                       </div>
                       <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contexto del Problema</label>
                        <textarea 
                          name="context" value={inputs.context} onChange={handleInputChange} rows={3}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                          placeholder="Describe brevemente la situación real a resolver..."
                        />
                       </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className={`h-14 px-12 rounded-2xl text-white font-black text-lg flex items-center gap-3 transition-all disabled:opacity-50 shadow-lg ${inputs.mode === 'gamified' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
                    >
                      {loading ? 'DISEÑANDO...' : 'GENERAR EXPERIENCIA'}
                      {!loading && <span className="material-symbols-outlined">auto_awesome</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in">
            {/* Header Result */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 bg-gray-800/40 p-6 rounded-3xl border border-gray-700 backdrop-blur-sm">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${inputs.mode === 'gamified' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {inputs.mode === 'gamified' ? 'Modo Gamificado' : 'Modo ABP'}
                  </span>
                  <h2 className="text-2xl font-black text-white">{inputs.topic}</h2>
                </div>
                <p className="text-gray-400 text-sm">
                  {inputs.mode === 'gamified' ? inputs.narrativeTheme : `Vinculado con ${inputs.interdisciplinarySubject}`}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                <button onClick={() => setStep(1)} className="flex-1 xl:flex-none h-11 px-5 rounded-xl border border-gray-600 text-gray-300 font-bold hover:bg-gray-800 hover:text-white transition-all text-sm">
                  Nuevo
                </button>
                <button 
                  onClick={() => {
                    const blob = new Blob([result?.html || ''], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Shanuki_${inputs.mode}_${inputs.topic.replace(/\s/g, '_')}.html`;
                    a.click();
                  }}
                  className="flex-1 xl:flex-none h-11 px-6 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-green-900/20"
                >
                  <span className="material-symbols-outlined text-lg">download</span> Descargar HTML
                </button>
              </div>
            </div>

            {/* Warning Banner for Low Tier Model */}
            {isLowTierModel && (
              <div className="bg-yellow-900/30 border border-yellow-600/50 p-4 rounded-xl flex items-start gap-3 animate-in">
                <span className="material-symbols-outlined text-yellow-500">warning</span>
                <div>
                  <h4 className="text-yellow-500 font-bold text-sm">Advertencia de Capacidad</h4>
                  <p className="text-yellow-200/80 text-xs">
                    El modelo disponible actualmente (Gemini 2.0/1.5) no generará experiencias visuales tan detalladas como los modelos Pro. 
                    Si deseas mejores resultados gráficos y narrativos, intenta generar nuevamente más tarde.
                  </p>
                </div>
              </div>
            )}

            {/* Main Content: Editor & Preview */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              
              {/* Left: Customization Panel */}
              <div className="xl:col-span-1 space-y-6">
                
                {/* Feedback / Edit Box */}
                <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-500">edit_note</span>
                        Personalizar Resultado
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">¿Algo no te convence? Describe los cambios y la IA regenerará el código.</p>
                    <textarea 
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full h-32 bg-gray-950 border border-gray-700 rounded-xl p-3 text-sm text-white mb-3 focus:ring-1 focus:ring-yellow-500 outline-none resize-none"
                        placeholder="Ej: Cambia las preguntas del quiz por unas más difíciles, o haz que el fondo sea más oscuro..."
                    />
                    <button 
                        onClick={handleUpdate}
                        disabled={isRegenerating || !feedback}
                        className="w-full h-10 rounded-lg bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold text-sm transition-all"
                    >
                        {isRegenerating ? 'Ajustando...' : 'Aplicar Cambios'}
                    </button>
                </div>

                {/* Validation Info */}
                <div className="p-5 bg-gray-900/50 border border-gray-800 rounded-2xl">
                  <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3">Validación Interna</h3>
                  <div className="flex flex-wrap gap-2">
                    {result?.distractorWords.map((w, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-400 font-mono border border-gray-700">{w}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Preview Iframe */}
              <div className="xl:col-span-3 bg-white rounded-2xl overflow-hidden shadow-2xl h-[800px] border-4 border-gray-800 relative">
                 <div className="absolute top-0 left-0 right-0 h-8 bg-gray-100 border-b flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="size-3 rounded-full bg-red-400"></div>
                        <div className="size-3 rounded-full bg-yellow-400"></div>
                        <div className="size-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 text-center text-[10px] text-gray-400 font-mono">vista_previa_estudiante.html</div>
                 </div>
                 <iframe srcDoc={result?.html} className="w-full h-full pt-8 border-none" title="Preview" />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 text-center border-t border-gray-800/50 bg-gray-900/30 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
        Shanuki 5.1 - Potenciando la Educación Digital en Uruguay
      </footer>
    </div>
  );
};

export default App;
