from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
from processing.pdf_processor import PDFProcessor
from PyPDF2 import PdfMerger
import time

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return "PDF to JSON Dataset Builder API"

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    saved_paths = []
    
    for file in files:
        if file.filename and (file.filename.lower().endswith('.pdf') or file.filename.lower().endswith('.json')):
            filename = f"{int(time.time())}_{file.filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            saved_paths.append(file_path)
    
    return jsonify({'message': f'Uploaded {len(saved_paths)} files', 'paths': saved_paths})

@app.route('/process', methods=['POST'])
def process_pdfs():
    if not request.json:
        return jsonify({'error': 'No data provided'}), 400
    
    data = request.json
    pdf_paths = data.get('pdf_paths', [])
    output_filename = data.get('output_filename', 'dataset.json')
    output_format = data.get('output_format', 'json')
    
    if not pdf_paths:
        return jsonify({'error': 'No PDF paths provided'}), 400
    
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
    processor = PDFProcessor()
    
    try:
        if output_format == 'txt':
            result = processor.process_pdfs_to_txt(pdf_paths, output_path)
        elif output_format == 'ton':
            result = processor.process_pdfs_to_ton(pdf_paths, output_path)
        else:
            result = processor.process_pdfs(pdf_paths, output_path)
        
        return jsonify({
            'message': f'Processed {len(pdf_paths)} PDF(s) to {output_format.upper()}',
            'output_filename': output_filename
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/merge-pdfs', methods=['POST'])
def merge_pdfs():
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        output_filename = request.form.get('output_filename', 'merged.pdf')
        
        pdf_files = [file for file in files if file.filename and file.filename.lower().endswith('.pdf')]
        if not pdf_files:
            return jsonify({'error': 'No PDF files found'}), 400
        
        temp_paths = []
        for file in pdf_files:
            filename = f"{int(time.time())}_{file.filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            temp_paths.append(file_path)
        
        merger = PdfMerger()
        for pdf_path in temp_paths:
            merger.append(pdf_path)
        
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        merger.write(output_path)
        merger.close()
        
        for temp_path in temp_paths:
            try:
                os.remove(temp_path)
            except:
                pass
        
        return jsonify({'message': f'Merged {len(pdf_files)} PDFs', 'output_filename': output_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/merge-json', methods=['POST'])
def merge_json():
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        output_filename = request.form.get('output_filename', 'merged.json')
        
        json_files = [file for file in files if file.filename and (file.filename.lower().endswith('.json') or file.filename.lower().endswith('.ton'))]
        if not json_files:
            return jsonify({'error': 'No JSON/TON files found'}), 400
        
        merged_data = []
        for file in json_files:
            try:
                file.seek(0)
                data = json.load(file)
                if isinstance(data, list):
                    merged_data.extend(data)
                else:
                    merged_data.append(data)
            except json.JSONDecodeError:
                return jsonify({'error': f'Invalid JSON/TON file: {file.filename}'}), 400
        
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, ensure_ascii=False, indent=4)
        
        return jsonify({'message': f'Merged {len(json_files)} files', 'output_filename': output_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    return send_file(file_path, as_attachment=True)

@app.route('/outputs')
def list_outputs():
    try:
        files = os.listdir(app.config['OUTPUT_FOLDER'])
        return jsonify({'output_files': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/cleanup', methods=['POST'])
def cleanup_files():
    try:
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass
        return jsonify({'message': 'Cleanup completed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)