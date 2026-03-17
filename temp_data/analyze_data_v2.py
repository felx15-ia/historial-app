import pandas as pd
import json
import os

excel_path = r"d:\sntigravity\historial\@@ Plan de mantenimiento by felx matris.xlsm"
sheet_name = "base de datos para historico"
output_path = r"d:\sntigravity\historial\excel_analysis.json"

def analyze_excel():
    try:
        # Cargar la hoja
        df = pd.read_excel(excel_path, sheet_name=sheet_name, engine='openpyxl')
        
        # Limpiar nombres de columnas (quitar espacios extras)
        df.columns = [str(c).strip() for c in df.columns]
        
        # Detectar columnas relevantes (basado en el prompt)
        # N° DE SERIE, SERVICIO, EQUIPO, MARCA, MODELO, FECHA, TIPO MANTENIMIENTO, OBSERVACIONES, ESTADO
        
        # Análisis de Calidad
        missing_values = df.isnull().sum().to_dict()
        duplicates = int(df.duplicated().sum())
        
        # Estadísticas por año (asumiendo columna FECHA o similar)
        # Intentar detectar columna de fecha
        fecha_col = None
        for col in df.columns:
            if 'FECHA' in col.upper():
                fecha_col = col
                break
        
        dist_por_anio = {}
        if fecha_col:
            df[fecha_col] = pd.to_datetime(df[fecha_col], errors='coerce')
            df_fechas = df[df[fecha_col].notnull()]
            dist_por_anio = df_fechas[fecha_col].dt.year.value_counts().to_dict()
            # Convertir llaves de int a str para JSON
            dist_por_anio = {str(k): int(v) for k, v in dist_por_anio.items()}

        # Distribución por servicio
        servicio_col = 'SERVICIO' if 'SERVICIO' in df.columns else None
        dist_por_servicio = {}
        if servicio_col:
            dist_por_servicio = df[servicio_col].value_counts().head(20).to_dict()
            dist_por_servicio = {str(k): int(v) for k, v in dist_por_servicio.items()}

        # Equipos con más intervenciones
        serie_col = 'N° DE SERIE' if 'N° DE SERIE' in df.columns else None
        equipos_mas_intervenciones = {}
        if serie_col:
            equipos_mas_intervenciones = df[serie_col].value_counts().head(10).to_dict()
            equipos_mas_intervenciones = {str(k): int(v) for k, v in equipos_mas_intervenciones.items()}

        # Consistencia de Tipos
        dtypes = df.dtypes.astype(str).to_dict()

        # Resumen Final
        analysis = {
            "num_total_equipos": int(df[serie_col].nunique()) if serie_col else 0,
            "num_total_mantenimientos": len(df),
            "columnas": df.columns.tolist(),
            "distribucion_anio": dist_por_anio,
            "distribucion_servicio": dist_por_servicio,
            "equipos_mas_intervenciones": equipos_mas_intervenciones,
            "calidad_datos": {
                "valores_nulos": {k: int(v) for k, v in missing_values.items() if v > 0},
                "duplicados": duplicates
            },
            "preview": df.head(10).fillna("").to_dict(orient='records')
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=4, ensure_ascii=False)
            
        print(f"Análisis exitoso. Resultados en {output_path}")

    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    analyze_excel()
