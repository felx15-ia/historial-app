"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { exportToPDF, exportToExcel } from '@/lib/export-utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Settings,
  BarChart3,
  Activity,
  LayoutDashboard,
  History,
  FileText,
  Download,
  Printer,
  ChevronRight,
  Stethoscope,
  Info,
  PieChart as PieChartIcon,
  Filter,
  ArrowRight,
  Plus,
  Box,
  ClipboardList,
  Sun,
  Moon,
  ChevronDown,
  User as UserIcon,
  Bell,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Definición de tipos
interface MaintenanceRecord {
  date: string;
  type: string;
  description: string;
  responsible: string;
  duration: string;
  status: string;
  year: number;
  month: string;
}

interface Equipment {
  serialNumber: string;
  assetTag: string;
  service: string;
  name: string;
  brand: string;
  model: string;
  item: string;
  status: string;
  history: MaintenanceRecord[];
}

export default function Home() {
  const [data, setData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Filtros adicionales
  const [globalServiceFilter, setGlobalServiceFilter] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState('');

  const toggleGlobalService = (service: string) => {
    setGlobalServiceFilter(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };
  const [nameFilter, setNameFilter] = useState('');
  const [serialFilter, setSerialFilter] = useState('');

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(d => {
        if (Array.isArray(d)) {
          const normalizedData = d.map((item: any) => ({
            ...item,
            service: item.service ? item.service.trim() : ''
          }));
          setData(normalizedData);
        } else {
          console.error('Data received is not an array:', d);
          setData([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Lógica de filtrado mejorada
  const baseFilteredData = useMemo(() => {
    return data.filter(e => globalServiceFilter.length === 0 || globalServiceFilter.includes(e.service));
  }, [data, globalServiceFilter]);

  const filteredData = useMemo(() => {
    return baseFilteredData.filter(e => {
      const matchSearch = searchTerm === '' ||
        e.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchService = serviceFilter === '' || e.service === serviceFilter;
      const matchName = nameFilter === '' || e.name === nameFilter;
      const matchSerial = serialFilter === '' || e.serialNumber.toLowerCase().includes(serialFilter.toLowerCase());

      return matchSearch && matchService && matchName && matchSerial;
    });
  }, [baseFilteredData, searchTerm, serviceFilter, nameFilter, serialFilter]);

  // Valores únicos para filtros
  const uniqueServices = useMemo(() => Array.from(new Set(data.map(e => e.service))).sort(), [data]);
  const uniqueNames = useMemo(() => Array.from(new Set(data.map(e => e.name))).sort(), [data]);

  // Helper: un equipo es baja si su status incluye 'baja'
  const isBaja = (e: Equipment) => e.status.toLowerCase().includes('baja');

  // Estadísticas para Dashboard
  const bajaEquipments = useMemo(() => baseFilteredData.filter(isBaja), [baseFilteredData]);
  const activeEquipments = useMemo(() => baseFilteredData.filter(e => !isBaja(e)), [baseFilteredData]);

  const totalGlobalEquipments = baseFilteredData.length;
  const totalActivos = activeEquipments.length;
  const functionalEquipments = activeEquipments.filter(e => e.status.toLowerCase() === 'operativo').length;
  const inoperativeEquipments = activeEquipments.filter(e => e.status.toLowerCase() === 'inoperativo').length;
  const availabilityRate = totalActivos > 0 ? Math.round((functionalEquipments / totalActivos) * 100) : 0;
  const totalEquipments = totalGlobalEquipments; // compat

  // Histórico y tendencias
  const yearsInData = Array.from(new Set(baseFilteredData.flatMap(e => e.history.map(h => h.year)))).sort();
  const displayYears = yearsInData.length > 0 ? yearsInData : [2022, 2023, 2024, 2025];
  const currentYear = Math.max(...displayYears);

  const ALL_MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const interventionsByMonth = useMemo(() => {
    const monthlyData = ALL_MONTHS.map(m => ({ name: m.substring(0, 3), full: m, total: 0 }));
    activeEquipments.forEach(eq => {
      eq.history.forEach(h => {
        if (h.year === currentYear) {
          const monthIndex = ALL_MONTHS.findIndex(m => m.toLowerCase() === h.month.toLowerCase());
          if (monthIndex !== -1) {
            monthlyData[monthIndex].total++;
          }
        }
      });
    });
    return monthlyData;
  }, [activeEquipments, currentYear]);

  const serviceDistribution = useMemo(() => Object.entries(
    activeEquipments.reduce((acc: Record<string, number>, curr) => {
      acc[curr.service] = (acc[curr.service] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5), [activeEquipments]);

  // Estado General: agrupa todo lo que no es Operativo en un solo bucket 'Inoperativo'
  const statusDistribution = useMemo(() => {
    let operativo = 0;
    let inoperativo = 0;
    activeEquipments.forEach(e => {
      if (e.status.toLowerCase() === 'operativo') {
        operativo++;
      } else if (e.status.toLowerCase() === 'inoperativo') {
        inoperativo++;
      }
    });
    const result: { name: string; value: number }[] = [];
    if (operativo > 0) result.push({ name: 'Operativo', value: operativo });
    if (inoperativo > 0) result.push({ name: 'Inoperativo', value: inoperativo });
    return result;
  }, [activeEquipments]);

  const inoperativeList = useMemo(() => {
    return [...activeEquipments]
      .filter(e => e.status.toLowerCase() === 'inoperativo')
      .sort((a, b) => b.history.length - a.history.length)
      .slice(0, 10);
  }, [activeEquipments]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/10 rounded-full"></div>
            <div className="absolute top-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">BioMed Pro</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Iniciando plataforma...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans text-slate-900 dark:text-slate-100 bg-[var(--background)] transition-colors duration-300">

      {/* Sidebar - Solid Blue/Navy Style inspired by user image */}
      <aside className="w-64 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] hidden md:flex flex-col sticky top-0 h-screen shadow-xl z-50 transition-colors duration-300">
        <div className="p-6 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-inner">
            <Cpu size={22} className="text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">BioMed Engine</h1>
        </div>

        <div className="px-4 mb-2">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2">General</p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-item w-full ${activeTab === 'dashboard' ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <LayoutDashboard size={18} />
              <span className="text-sm">Panel General</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`nav-item w-full ${activeTab === 'inventory' ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <Box size={18} />
              <span className="text-sm">Inventario</span>
            </button>
          </nav>
        </div>

        <div className="px-4 mt-6">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2">Mantenimiento</p>
          <nav className="space-y-1">
            <div className="nav-item w-full nav-item-inactive cursor-not-allowed opacity-50">
              <ClipboardList size={18} />
              <span className="text-sm">Órdenes de Trabajo</span>
            </div>
            <div className="nav-item w-full nav-item-inactive cursor-not-allowed opacity-50">
              <Activity size={18} />
              <span className="text-sm">Tecnovigilancia</span>
            </div>
          </nav>

          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2 mt-8">Filtros Globales</p>
          <div className="px-2 mb-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col max-h-[260px]">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-white/80">
                  <Filter size={14} className="text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">SERVICIOS</span>
                </div>
                {globalServiceFilter.length > 0 ? (
                  <button
                    onClick={() => setGlobalServiceFilter([])}
                    className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
                  >
                    Limpiar
                  </button>
                ) : (
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">TODOS</span>
                )}
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-1">
                {uniqueServices.map((s, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors group">
                    <div className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-all ${globalServiceFilter.includes(s) ? 'bg-blue-500 border-blue-500' : 'border-white/20 group-hover:border-white/40 bg-black/20'}`}>
                      {globalServiceFilter.includes(s) && <CheckCircle2 size={10} className="text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={globalServiceFilter.includes(s)}
                      onChange={() => toggleGlobalService(s)}
                    />
                    <span className="text-[10px] uppercase truncate flex-1 text-white/80 select-none" title={s}>{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold border border-blue-500/30">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">Administrador</p>
              <p className="text-[10px] text-white/40 truncate">admin@biomed.pro</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">

        {/* Header - Modern & Functional */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-8 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {activeTab === 'dashboard' ? 'Panel de Gestión' : 'Control de Activos'}
              <ChevronRight size={14} className="text-slate-400" />
              <span className="text-slate-400 dark:text-slate-500 font-medium text-xs">Principal</span>
            </h2>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative group hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar activo..."
                className="bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 rounded-lg py-1.5 pl-9 pr-4 text-xs font-medium w-64 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={containerVariants}
                className="space-y-8"
              >
                {/* Intro */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Indicadores Clave</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-medium italic">Estado general del inventario biomédico</p>
                </div>

                {/* KPIs - Structured with Color Bars from user image */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'Global', value: totalGlobalEquipments, icon: Box, color: 'blue', desc: 'Total absoluto de activos' },
                    { title: 'Disponibilidad', value: `${availabilityRate}%`, icon: CheckCircle2, color: 'green', desc: 'Equipos activos operativos' },
                    { title: 'Inoperativos', value: inoperativeEquipments, icon: AlertCircle, color: 'red', desc: 'Esperando ser operativizados' },
                    { title: `Intervenciones ${currentYear}`, value: interventionsByMonth.reduce((acc, m) => acc + m.total, 0), icon: Clock, color: 'yellow', desc: 'Mantenimientos en el ano' },
                  ].map((kpi, i) => (
                    <motion.div
                      key={i}
                      variants={itemVariants}
                      className="premium-card group"
                    >
                      <div className={`status-bar status-bar-${kpi.color}`}></div>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg bg-${kpi.color}-50 dark:bg-${kpi.color}-500/10 text-${kpi.color}-600 dark:text-${kpi.color}-400`}>
                          <kpi.icon size={20} />
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black text-slate-900 dark:text-white transition-colors">{kpi.value}</span>
                        </div>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-tight mb-0.5">{kpi.title}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{kpi.desc}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Area - Cleaner & More Scientific */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Tendencia Mensual */}
                  <motion.div variants={itemVariants} className="lg:col-span-2 premium-card">
                    <div className="flex justify-between items-center mb-8 border-b border-slate-50 dark:border-slate-800/50 pb-4">
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Activity size={18} className="text-blue-500" />
                          Tendencia de Mantenimientos
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Línea de tiempo mensual ({currentYear})</p>
                      </div>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={interventionsByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={theme === 'dark' ? '#3b82f6' : '#2563eb'} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={theme === 'dark' ? '#3b82f6' : '#2563eb'} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#334155'} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
                              border: '1px solid ' + (theme === 'dark' ? '#1e293b' : '#e2e8f0'),
                              borderRadius: '12px',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke={theme === 'dark' ? '#3b82f6' : '#2563eb'}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Estado General Pie chart */}
                  <motion.div variants={itemVariants} className="premium-card">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-50 dark:border-slate-800/50 pb-4 flex items-center gap-2">
                      <PieChartIcon size={18} className="text-emerald-500" />
                      Estado General
                    </h4>

                    <div className="h-[200px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.name === 'Operativo' ? '#10b981' : '#ef4444'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{totalActivos}</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2 max-h-[140px] overflow-y-auto">
                      {statusDistribution.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.name === 'Operativo' ? '#10b981' : '#ef4444' }}></div>
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase truncate max-w-[120px]">{s.name}</span>
                          </div>
                          <span className="text-[11px] font-black">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Equipos Inoperativos Pendientes */}
                  <motion.div variants={itemVariants} className="lg:col-span-2 xl:col-span-3 premium-card relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-40 h-40 bg-rose-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-6 border-b border-slate-50 dark:border-slate-800/50 pb-4">
                      <h4 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                        <AlertCircle size={18} />
                        Equipos Inoperativos Pendientes
                      </h4>
                      <span className="px-3 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-full">
                        {inoperativeList.length} esperando gestion
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {inoperativeList.map((eq, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border-l-4 border-l-rose-500 border border-slate-100 dark:border-slate-800/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" onClick={() => { setSelectedEquipment(eq); setActiveTab('inventory'); }}>
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1 flex-1 pr-2">{eq.name}</h5>
                            <span className="text-[9px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-black uppercase whitespace-nowrap">{eq.status}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium"><span className="font-bold text-slate-500 dark:text-slate-300">S/N:</span> {eq.serialNumber}</p>
                          <p className="text-[10px] text-blue-500 font-bold uppercase truncate mt-0.5">{eq.service}</p>
                        </div>
                      ))}
                      {inoperativeList.length === 0 && (
                        <div className="col-span-full py-10 flex flex-col items-center gap-3 bg-emerald-50 dark:bg-emerald-500/5 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-500/20">
                          <CheckCircle2 size={32} className="text-emerald-500 opacity-60" />
                          <p className="text-emerald-700 dark:text-emerald-400 font-bold text-sm text-center">Sin equipos inoperativos!</p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="premium-card">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-8 border-b border-slate-50 dark:border-slate-800/50 pb-4">
                      Top 5 Áreas de Servicio
                    </h4>

                    <div className="h-[250px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={serviceDistribution}
                            innerRadius={75}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {serviceDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{totalActivos}</span>
                      </div>
                    </div>

                    <div className="mt-8 space-y-3">
                      {serviceDistribution.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[150px] group-hover:text-blue-500 transition-colors uppercase">{s.name}</span>
                          </div>
                          <span className="text-[11px] font-bold dark:text-slate-400">{s.value} EQ</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Registro de Equipos Dados de Baja */}
                <motion.div variants={itemVariants} className="premium-card overflow-hidden mt-2">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <History size={18} className="text-slate-400" />
                        Registro de Equipos Dados de Baja
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">Activos retirados permanentemente — solo consulta historica</p>
                    </div>
                    <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black px-3 py-1 rounded-lg">
                      {bajaEquipments.length} Registros
                    </span>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          {['Equipo', 'Marca / Modelo', 'S/N Serie', 'Servicio Original', 'Ver'].map(h => (
                            <th key={h} className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bajaEquipments.length > 0 ? bajaEquipments.map((eq, i) => (
                          <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition-colors">
                            <td className="py-3 px-4 min-w-[200px]"><span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{eq.name}</span></td>
                            <td className="py-3 px-4 min-w-[160px]"><span className="text-[11px] text-slate-500 dark:text-slate-400">{eq.brand || 'N/A'} - {eq.model || 'N/A'}</span></td>
                            <td className="py-3 px-4"><span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">{eq.serialNumber}</span></td>
                            <td className="py-3 px-4 min-w-[150px]"><span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded font-bold uppercase">{eq.service}</span></td>
                            <td className="py-3 px-4 text-right">
                              <button onClick={() => { setSelectedEquipment(eq); setActiveTab('inventory'); }} className="text-[10px] text-blue-500 hover:text-blue-600 font-bold uppercase tracking-wider transition-colors">Ver ficha</button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-sm">No hay equipos de baja registrados.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <AnimatePresence mode="wait">
                  {selectedEquipment ? (
                    <motion.div
                      key="detail"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6"
                    >
                      <button
                        onClick={() => setSelectedEquipment(null)}
                        className="group flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
                      >
                        <ChevronRight className="rotate-180" size={16} /> Volver al listado completo
                      </button>

                      <div className="premium-card p-10">
                        <div className={`status-bar ${selectedEquipment.status.toLowerCase().includes('op') ? 'status-bar-green' : 'status-bar-red'}`}></div>

                        <div className="flex flex-col xl:flex-row justify-between xl:items-start gap-10 mb-12">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="bg-blue-600 text-white text-[9px] font-extrabold px-3 py-1 rounded-md uppercase tracking-widest shadow-lg shadow-blue-500/20">
                                BioMed Asset
                              </span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-extrabold px-3 py-1 rounded-md uppercase tracking-widest">
                                {selectedEquipment.status}
                              </span>
                            </div>
                            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">{selectedEquipment.name}</h2>
                            <div className="flex items-center gap-4 mt-4">
                              <span className="text-lg text-slate-400 font-medium">{selectedEquipment.brand}</span>
                              <span className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
                              <span className="text-lg text-slate-400 font-medium">{selectedEquipment.model}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => exportToExcel(selectedEquipment)}
                              className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:scale-105 transition-transform flex items-center gap-2 font-bold text-xs border border-emerald-100 dark:border-emerald-500/20"
                              title="Descargar Excel"
                            >
                              <FileText size={18} />
                              <span className="hidden sm:inline">EXCEL</span>
                            </button>
                            <button
                              onClick={() => exportToPDF(selectedEquipment)}
                              className="btn-premium px-6 flex items-center gap-2"
                            >
                              <Download size={18} />
                              <span className="text-sm">DESCARGAR REPORTE PDF</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                          {/* Info Column */}
                          <div className="lg:col-span-5 space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Especificaciones Técnicas</h4>
                              <div className="space-y-4">
                                {[
                                  { label: 'S/N Serie', value: selectedEquipment.serialNumber },
                                  { label: 'Placa / Tag', value: selectedEquipment.assetTag },
                                  { label: 'Servicio / Área', value: selectedEquipment.service },
                                  { label: 'Número de Item', value: selectedEquipment.item }
                                ].map((spec, i) => (
                                  <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{spec.label}</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{spec.value || 'N/A'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                  {selectedEquipment.history.length}
                                </div>
                                <div>
                                  <h5 className="font-bold text-slate-900 dark:text-white">Total Intervenciones</h5>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Registros históricos del equipo</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* History Column */}
                          <div className="lg:col-span-7 space-y-6">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <History size={20} className="text-blue-600" />
                              Trazabilidad de Mantenimiento
                            </h4>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                              {selectedEquipment.history.length > 0 ? (
                                selectedEquipment.history.map((h, i) => (
                                  <div key={i} className="group p-5 bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                      <div>
                                        <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{h.month} {h.year}</p>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{h.date}</p>
                                      </div>
                                      <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase ${h.type === 'Correctivo' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                        {h.type}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{h.description}</p>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                                          {h.responsible.substring(0, 2)}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{h.responsible}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                        <div className="flex items-center gap-1">
                                          <Clock size={12} />
                                          {h.duration} hrs
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                  <p className="text-slate-400 dark:text-slate-600 font-bold italic">No se han encontrado registros recientes.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      {/* Subheader with Filters */}
                      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Inventario de Equipamiento</h3>
                          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">Gestión de {filteredData.length} activos en tiempo real</p>
                        </div>

                        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                          {/* Filter By Service */}
                          <div className="relative group min-w-[200px] flex-1">
                            <Stethoscope size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                            <select
                              value={serviceFilter}
                              onChange={(e) => setServiceFilter(e.target.value)}
                              className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 text-[10px] font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                            >
                              <option value="">TODOS LOS SERVICIOS</option>
                              {uniqueServices.map((s, i) => <option key={i} value={s}>{s.toUpperCase()}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>

                          {/* Filter By Name */}
                          <div className="relative group min-w-[200px] flex-1">
                            <Cpu size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                            <select
                              value={nameFilter}
                              onChange={(e) => setNameFilter(e.target.value)}
                              className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 text-[10px] font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                            >
                              <option value="">TODAS LAS DENOMINACIONES</option>
                              {uniqueNames.map((n, i) => <option key={i} value={n}>{n.toUpperCase()}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>

                          {/* Search by Serial */}
                          <div className="relative group min-w-[200px] flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                            <input
                              type="text"
                              placeholder="BUSCAR POR SERIE..."
                              value={serialFilter}
                              onChange={(e) => setSerialFilter(e.target.value)}
                              className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all uppercase"
                            />
                          </div>

                          {/* Clear Filters */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setServiceFilter('');
                              setNameFilter('');
                              setSerialFilter('');
                            }}
                            className="h-10 px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-xl transition-colors"
                            title="Limpiar filtros"
                          >
                            <Filter size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredData.slice(0, 48).map((eq, i) => (
                          <motion.div
                            key={i}
                            variants={itemVariants}
                            onClick={() => setSelectedEquipment(eq)}
                            className="premium-card group cursor-pointer hover:border-blue-500 dark:hover:border-blue-400"
                          >
                            <div className={`status-bar ${eq.status.toLowerCase().includes('op') ? 'status-bar-green' : 'status-bar-red'}`}></div>

                            <div className="flex justify-between items-start mb-6 pt-2">
                              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                <Stethoscope size={20} />
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-0.5">S/N Serie</p>
                                <p className="text-[11px] font-black text-slate-900 dark:text-slate-100 transition-colors">{eq.serialNumber}</p>
                              </div>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight mb-4 uppercase line-clamp-2 min-h-[40px]">
                              {eq.name}
                            </h4>

                            <div className="space-y-3 mb-6">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">TAG</span>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">{eq.assetTag || 'Sin tag'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Servicio</span>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase truncate max-w-[120px]">{eq.service}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${eq.status.toLowerCase().includes('op') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{eq.status}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                <History size={10} className="text-slate-300 dark:text-slate-600" />
                                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">{eq.history.length}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {filteredData.length > 48 && (
                        <div className="text-center py-16">
                          <div className="inline-block px-12 py-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                            <p className="text-slate-400 dark:text-slate-500 font-bold mb-4 italic text-sm">Mostrando los primeros 48 resultados</p>
                            <button className="btn-premium px-8">EXPLORAR INVENTARIO COMPLETO</button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer simple */}
        <footer className="p-8 text-center border-t border-slate-100 dark:border-slate-800/50 mt-auto">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">BioMed Engine © 2026 - Gestión Profesional de Equipamiento</p>
        </footer>
      </main>
    </div>
  );
}
