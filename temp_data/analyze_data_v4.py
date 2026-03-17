import pandas as pd
import json
import numpy as np

excel_path = r"d:\sntigravity\historial\@@ Plan de mantenimiento by felx matris.xlsm"
sheet_name = "base de datos para historico"
output_path = r"d:\sntigravity\historial\excel_analysis.json"

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if pd.isna(obj):
        return None
    return str(obj)

def analyze_excel():
    try:
        df = pd.read_excel(excel_path, sheet_name=sheet_name, engine='openpyxl')
        df.columns = [str(c).strip() for c in df.columns]
        
        # Detectar columnas clave
        fecha_col = next((c for c in df.columns if 'FECHA' in c.upper()), None)
        servicio_col = next((c for c in df.columns if 'SERVICIO' in c.upper()), None)
        serie_col = next((c for c in df.columns if 'SERIE' in c.upper()), None)
        equipo_col = next((c for c in df.columns if 'EQUIPO' in c.upper() or 'NOMBRE' in c.upper()), None)
        marca_col = next((c for c in df.columns if 'MARCA' in c.upper()), None)
        modelo_col = next((c for c in df.columns if 'MODELO' in c.upper()), None)

        # Estadísticas básicas
        resumen = {
            "total_mantenimientos": len(df),
            "total_equipos": int(df[serie_col].nunique()) if serie_col else 0,
            "columnas": df.columns.tolist(),
            "mapeo": {
                "fecha": fecha_col,
                "servicio": servicio_col,
                "serie": serie_col,
                "equipo": equipo_col,
                "marca": marca_col,
                "modelo": modelo_col
            }
        }
        
        # Distribución años
        dist_anio = {}
        if fecha_col:
            df[fecha_col] = pd.to_datetime(df[fecha_col], errors='coerce')
            dist_anio = df[fecha_col].dt.year.value_counts().to_dict()
            dist_anio = {str(int(k)): int(v) for k, v in dist_anio.items() if not pd.isna(k)}

        # Distribución servicios
        dist_servicio = {}
        if servicio_col:
            dist_servicio = df[servicio_col].value_counts().head(20).to_dict()
            dist_servicio = {str(k): int(v) for k, v in dist_servicio.items()}

        # Top equipos
        top_equipos = {}
        if serie_col:
            top_df = df.groupby([serie_col, equipo_col]).size().sort_values(ascending=False).head(15)
            top_equipos = {f"{idx[0]} - {idx[1]}": int(val) for idx, val in top_df.items()}

        # Calidad de datos
        calidad = {
            "nulos": df.isnull().sum().to_dict(),
            "duplicados": int(df.duplicated().sum())
        }

        # Resultado final
        analysis = {
            "resumen": resumen,
            "distribucion_anio": dist_anio,
            "distribucion_servicio": dist_servicio,
            "top_equipos": top_equipos,
            "calidad": calidad,
            "preview": df.head(50).to_dict(orient='records')
        }

        # Escribir usando el serializador personalizado
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, default=json_serial, indent=4, ensure_ascii=False)
            
        print("Análisis finalizado con éxito.")

    except Exception as e:
        import traceback
        print(f"Error fatal: {str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    analyze_excel()
