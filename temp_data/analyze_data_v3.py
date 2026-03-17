import pandas as pd
import json
import numpy as np

excel_path = r"d:\sntigravity\historial\@@ Plan de mantenimiento by felx matris.xlsm"
sheet_name = "base de datos para historico"
output_path = r"d:\sntigravity\historial\excel_analysis.json"

def analyze_excel():
    try:
        df = pd.read_excel(excel_path, sheet_name=sheet_name, engine='openpyxl')
        df.columns = [str(c).strip() for c in df.columns]
        
        # Detectar columnas
        fecha_col = next((c for c in df.columns if 'FECHA' in c.upper()), None)
        servicio_col = next((c for c in df.columns if 'SERVICIO' in c.upper()), None)
        serie_col = next((c for c in df.columns if 'SERIE' in c.upper()), None)
        equipo_col = next((c for c in df.columns if 'EQUIPO' in c.upper() or 'NOMBRE' in c.upper()), None)

        # Estadísticas
        total_mantenimientos = len(df)
        total_equipos = int(df[serie_col].nunique()) if serie_col else 0
        
        # Fechas y Años
        dist_anio = {}
        if fecha_col:
            df[fecha_col] = pd.to_datetime(df[fecha_col], errors='coerce')
            dist_anio = df[fecha_col].dt.year.value_counts().to_dict()
            dist_anio = {str(int(k)): int(v) for k, v in dist_anio.items() if not pd.isna(k)}

        # Servicios
        dist_servicio = {}
        if servicio_col:
            dist_servicio = df[servicio_col].value_counts().head(20).to_dict()
            dist_servicio = {str(k): int(v) for k, v in dist_servicio.items()}

        # Equipos Mas Intervenidos
        equipos_top = {}
        if serie_col:
            # Agrupar por serie y equipo para tener nombres
            top_df = df.groupby([serie_col, equipo_col]).size().sort_values(ascending=False).head(10)
            equipos_top = {f"{idx[0]} - {idx[1]}": int(val) for idx, val in top_df.items()}

        # Calidad
        nulos = df.isnull().sum().to_dict()
        nulos = {k: int(v) for k, v in nulos.items() if v > 0}
        
        # Limpiar DataFrame para Preview (convertir NaT/NaN a None)
        df_preview = df.head(15).replace({np.nan: None})
        # Convertir fechas a string para JSON
        if fecha_col:
            df_preview[fecha_col] = df_preview[fecha_col].apply(lambda x: x.isoformat() if hasattr(x, 'isoformat') else x)

        analysis = {
            "resumen": {
                "total_equipos": total_equipos,
                "total_mantenimientos": total_mantenimientos,
                "columnas_detectadas": {
                    "fecha": fecha_col,
                    "servicio": servicio_col,
                    "serie": serie_col,
                    "equipo": equipo_col
                }
            },
            "distribucion_por_año": dist_anio,
            "distribucion_por_servicio": dist_servicio,
            "equipos_con_mas_intervenciones": equipos_top,
            "problemas_datos": {
                "valores_nulos": nulos,
                "duplicados": int(df.duplicated().sum())
            },
            "preview": df_preview.to_dict(orient='records')
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=4, ensure_ascii=False)
            
        print("Análisis completado exitosamente.")

    except Exception as e:
        import traceback
        print(f"Error: {str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    analyze_excel()
