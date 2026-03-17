import pandas as pd
import json
import os
import sys

# Definir rutas
excel_path = r"d:\sntigravity\historial\@@ Plan de mantenimiento by felx matris.xlsm"
sheet_name = "base de datos para historial"

def analyze_excel():
    try:
        # Verificar dependencias
        try:
            import openpyxl
        except ImportError:
            print("Error: Se requiere instalar 'openpyxl'. Ejecute: pip install openpyxl")
            return

        # Cargar la hoja
        df = pd.read_excel(excel_path, sheet_name=sheet_name, engine='openpyxl')
        
        # Análisis Básico
        analysis = {
            "columns": df.columns.tolist(),
            "shape": df.shape,
            "dtypes": df.dtypes.astype(str).to_dict(),
            "missing_values": df.isnull().sum().to_dict(),
            "summary": {
                "total_records": len(df),
                "unique_equipment": int(df['N° DE SERIE'].nunique()) if 'N° DE SERIE' in df.columns else "N/A",
                "unique_services": int(df['SERVICIO'].nunique()) if 'SERVICIO' in df.columns else "N/A",
            }
        }
        
        # Preview de datos
        analysis["head"] = df.head(5).fillna("null").to_dict(orient='records')
        
        # Guardar resultados en un JSON para lectura fácil
        output_path = r"d:\sntigravity\historial\excel_analysis.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=4, ensure_ascii=False)
            
        print(f"Análisis completado. Resultados guardados en: {output_path}")
        
    except Exception as e:
        print(f"Error durante el análisis: {str(e)}")

if __name__ == "__main__":
    analyze_excel()
