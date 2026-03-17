import pandas as pd
import json

excel_path = r"d:\sntigravity\historial\@@ Plan de mantenimiento by felx matris.xlsm"

def list_sheets():
    try:
        xl = pd.ExcelFile(excel_path, engine='openpyxl')
        print(f"Hojas encontradas: {xl.sheet_names}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    list_sheets()
