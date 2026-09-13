    import { useState, useRef, useEffect } from 'react';
    import './DateFilterPicker.css';

    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const DIAS_SEMANA = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

    function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // lunes = 0
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
    }

function getWeekRange(date) {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(start.getDate() + 6); // 7 días en total: el día elegido + 6 más
  return [start, end];
}
    function isSameDay(a, b) {
    return a && b && a.toDateString() === b.toDateString();
    }

    export default function DateFilterPicker({ filtroTiempo, fechaSeleccionada, onChange }) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(fechaSeleccionada || new Date());
    const popRef = useRef(null);
useEffect(() => {
        function handleClickOutside(e) {
        if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

const fechaSeleccionadaTime = fechaSeleccionada?.getTime();


useEffect(() => {
    if (fechaSeleccionada) setViewDate(fechaSeleccionada);

}, [fechaSeleccionadaTime, filtroTiempo]); // eslint-disable-line react-hooks/exhaustive-deps

    function isInSelectedWeek(date) {
        if (!fechaSeleccionada) return false;
        const [start, end] = getWeekRange(fechaSeleccionada);
        return date >= start && date <= end;
    }

    function labelActual() {
        if (!fechaSeleccionada) return 'Seleccionar fecha';
        if (filtroTiempo === 'dia') {
        return fechaSeleccionada.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        if (filtroTiempo === 'semana') {
        const [start, end] = getWeekRange(fechaSeleccionada);
        return `${start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        }
        if (filtroTiempo === 'mes') {
        return `${MESES[fechaSeleccionada.getMonth()]} ${fechaSeleccionada.getFullYear()}`;
        }
        return `${fechaSeleccionada.getFullYear()}`;
    }

    const cambiarMes = (delta) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
    const cambiarAnio = (delta) => setViewDate(new Date(viewDate.getFullYear() + delta, viewDate.getMonth(), 1));

    return (
        <div className="date-filter-picker" ref={popRef}>
        <button className="date-filter-trigger" onClick={() => setOpen(o => !o)}>
            📅 {labelActual()}
        </button>

        {open && (
            <div className="date-filter-popover">
            {filtroTiempo === 'anio' && (
                <div className="year-picker">
                <div className="picker-nav">
                    <button onClick={() => cambiarAnio(-12)}>‹</button>
                    <span>{viewDate.getFullYear() - 6} - {viewDate.getFullYear() + 5}</span>
                    <button onClick={() => cambiarAnio(12)}>›</button>
                </div>
                <div className="year-grid">
                    {Array.from({ length: 12 }, (_, i) => viewDate.getFullYear() - 6 + i).map(y => (
                    <button
                        key={y}
                        className={fechaSeleccionada?.getFullYear() === y ? 'selected' : ''}
                        onClick={() => { onChange(new Date(y, 0, 1)); setOpen(false); }}
                    >
                        {y}
                    </button>
                    ))}
                </div>
                </div>
            )}

            {filtroTiempo === 'mes' && (
                <div className="month-picker">
                <div className="picker-nav">
                    <button onClick={() => cambiarAnio(-1)}>‹</button>
                    <span>{viewDate.getFullYear()}</span>
                    <button onClick={() => cambiarAnio(1)}>›</button>
                </div>
                <div className="month-grid">
                    {MESES.map((m, i) => (
                    <button
                        key={m}
                        className={fechaSeleccionada && fechaSeleccionada.getMonth() === i && fechaSeleccionada.getFullYear() === viewDate.getFullYear() ? 'selected' : ''}
                        onClick={() => { onChange(new Date(viewDate.getFullYear(), i, 1)); setOpen(false); }}
                    >
                        {m.slice(0, 3)}
                    </button>
                    ))}
                </div>
                </div>
            )}

            {(filtroTiempo === 'dia' || filtroTiempo === 'semana') && (
                <div className="day-week-picker">
                <div className="picker-nav">
                    <button onClick={() => cambiarMes(-1)}>‹</button>
                    <span>{MESES[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                    <button onClick={() => cambiarMes(1)}>›</button>
                </div>
                <div className="weekday-row">
                    {DIAS_SEMANA.map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="day-grid">
                    {getDaysInMonth(viewDate).map((date, i) => {
                    if (!date) return <span key={i} className="day-empty" />;
                    const selected = filtroTiempo === 'semana'
                        ? isInSelectedWeek(date)
                        : isSameDay(date, fechaSeleccionada);
                    return (
                        <button
                        key={i}
                        className={selected ? 'selected' : ''}
                        onClick={() => { onChange(date); setOpen(false); }}
                        >
                        {date.getDate()}
                        </button>
                    );
                    })}
                </div>
                </div>
                
            )}
            
            </div>
        )}
        
        </div>
        
    );
    }