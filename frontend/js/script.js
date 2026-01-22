document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const pdfFileInput = document.getElementById('pdf-file-input');
    const selectPdfFilesBtn = document.getElementById('select-pdf-files-btn');
    const pdfUploadZone = document.getElementById('pdf-upload-zone');
    const selectedPdfFiles = document.getElementById('selected-pdf-files');
    const jsonOutputPath = document.getElementById('json-output-path');
    const outputFormat = document.getElementById('output-format');
    const processBtn = document.getElementById('process-btn');
    
    const pdfMergeFileInput = document.getElementById('pdf-merge-file-input');
    const selectPdfMergeFilesBtn = document.getElementById('select-pdf-merge-files-btn');
    const pdfMergeUploadZone = document.getElementById('pdf-merge-upload-zone');
    const selectedPdfMergeFiles = document.getElementById('selected-pdf-merge-files');
    const pdfOutputPath = document.getElementById('pdf-output-path');
    const mergePdfsBtn = document.getElementById('merge-pdfs-btn');
    
    const jsonMergeFileInput = document.getElementById('json-merge-file-input');
    const selectJsonMergeFilesBtn = document.getElementById('select-json-merge-files-btn');
    const jsonMergeUploadZone = document.getElementById('json-merge-upload-zone');
    const selectedJsonMergeFiles = document.getElementById('selected-json-merge-files');
    const jsonMergeOutputPath = document.getElementById('json-merge-output-path');
    const mergeJsonBtn = document.getElementById('merge-json-btn');
    
    const progressFill = document.querySelector('.progress-fill');
    const progressPercentage = document.querySelector('.progress-percentage');
    const progressPanel = document.getElementById('progress-panel');
    const navProcessingStatus = document.getElementById('nav-processing-status');
    const navStatusText = document.getElementById('nav-status-text');
    const resultSection = document.getElementById('result-section');
    const resultMessage = document.getElementById('result-message');
    const downloadBtn = document.getElementById('download-btn');
    const newProcessBtn = document.getElementById('new-process-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    const loadingFill = document.querySelector('.loading-fill');
    const loadingPercent = document.querySelector('.loading-percent');
    
    // Navigation stats
    const totalFiles = document.getElementById('total-files');
    const totalSize = document.getElementById('total-size');
    const navbar = document.getElementById('navbar');
    const navbarTrigger = document.querySelector('.navbar-trigger');
    
    // Tool status indicators
    const pdfJsonStatus = document.getElementById('pdf-json-status');
    const pdfMergeStatus = document.getElementById('pdf-merge-status');
    const jsonMergeStatus = document.getElementById('json-merge-status');
    
    let uploadedPdfFiles = [];
    let uploadedPdfMergeFiles = [];
    let uploadedJsonMergeFiles = [];
    let processingResult = null;
    let currentTool = null;

    // Event Listeners
    selectPdfFilesBtn.addEventListener('click', () => pdfFileInput.click());
    pdfFileInput.addEventListener('change', (e) => handleFileSelection(e, uploadedPdfFiles, selectedPdfFiles, 'pdf'));
    outputFormat.addEventListener('change', updateOutputFilename);
    processBtn.addEventListener('click', processPdfsToJson);
    
    selectPdfMergeFilesBtn.addEventListener('click', () => pdfMergeFileInput.click());
    pdfMergeFileInput.addEventListener('change', (e) => handleFileSelection(e, uploadedPdfMergeFiles, selectedPdfMergeFiles, 'pdf'));
    mergePdfsBtn.addEventListener('click', mergePdfs);
    
    selectJsonMergeFilesBtn.addEventListener('click', () => jsonMergeFileInput.click());
    jsonMergeFileInput.addEventListener('change', (e) => handleFileSelection(e, uploadedJsonMergeFiles, selectedJsonMergeFiles, 'json'));
    mergeJsonBtn.addEventListener('click', mergeJsonFiles);
    
    downloadBtn.addEventListener('click', downloadResult);
    newProcessBtn.addEventListener('click', resetInterface);
    
    // Drag and Drop Events
    setupDragAndDrop(pdfUploadZone, pdfFileInput, uploadedPdfFiles, selectedPdfFiles, 'pdf');
    setupDragAndDrop(pdfMergeUploadZone, pdfMergeFileInput, uploadedPdfMergeFiles, selectedPdfMergeFiles, 'pdf');
    setupDragAndDrop(jsonMergeUploadZone, jsonMergeFileInput, uploadedJsonMergeFiles, selectedJsonMergeFiles, 'json');
    
    // Navbar auto-hide functionality
    navbarTrigger.addEventListener('mouseenter', () => {
        navbar.classList.add('show');
    });
    
    navbar.addEventListener('mouseleave', () => {
        navbar.classList.remove('show');
    });

    // Drag and Drop Setup
    function setupDragAndDrop(zone, input, fileArray, container, fileType) {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        
        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            const extension = fileType === 'pdf' ? '.pdf' : '.json';
            const filteredFiles = files.filter(file => file.name.toLowerCase().endsWith(extension));
            
            if (filteredFiles.length > 0) {
                // Create a mock event for handleFileSelection
                const mockEvent = {
                    target: {
                        files: filteredFiles
                    }
                };
                handleFileSelection(mockEvent, fileArray, container, fileType);
            } else {
                showNotification(`Please drop valid ${fileType.toUpperCase()} files`, 'error');
            }
        });
    }

    function handleFileSelection(event, fileArray, container, fileType) {
        const files = Array.from(event.target.files);
        const extension = fileType === 'pdf' ? '.pdf' : fileType === 'json' ? '.json' : '.ton';
        const filteredFiles = files.filter(file => {
            const fileName = file.name.toLowerCase();
            return fileName.endsWith('.pdf') || fileName.endsWith('.json') || fileName.endsWith('.ton');
        });
        
        if (filteredFiles.length === 0) {
            showNotification(`Please select valid ${fileType.toUpperCase()} files`, 'error');
            return;
        }
        
        fileArray.length = 0;
        container.innerHTML = '';
        
        filteredFiles.forEach((file, index) => {
            fileArray.push(file);
            addFileToUI(file, container, () => removeFile(index, fileArray, container, fileType));
        });
        
        updateStats();
        updateToolStatus(fileType, fileArray.length > 0 ? 'active' : 'inactive');
        showNotification(`${filteredFiles.length} ${fileType.toUpperCase()} file(s) selected`, 'success');
    }

    function addFileToUI(file, container, removeCallback) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item fade-in';
        
        const icon = document.createElement('i');
        icon.className = file.name.toLowerCase().endsWith('.pdf') ? 'fas fa-file-pdf' : 'fas fa-file-code';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const fileSize = document.createElement('div');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);
        
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener('click', removeCallback);
        
        fileItem.appendChild(icon);
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);
        
        container.appendChild(fileItem);
    }

    function removeFile(index, fileArray, container, fileType) {
        fileArray.splice(index, 1);
        container.children[index].remove();
        updateStats();
        updateToolStatus(fileType, fileArray.length > 0 ? 'active' : 'inactive');
        showNotification('File removed', 'success');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updateStats() {
        const allFiles = [...uploadedPdfFiles, ...uploadedPdfMergeFiles, ...uploadedJsonMergeFiles];
        const totalFileCount = allFiles.length;
        const totalSizeBytes = allFiles.reduce((acc, file) => acc + file.size, 0);
        
        totalFiles.textContent = totalFileCount;
        totalSize.textContent = formatFileSize(totalSizeBytes);
    }

    function updateToolStatus(toolType, status) {
        let statusElement;
        switch(toolType) {
            case 'pdf':
                statusElement = pdfJsonStatus;
                break;
            case 'pdf-merge':
                statusElement = pdfMergeStatus;
                break;
            case 'json':
                statusElement = jsonMergeStatus;
                break;
        }
        
        if (statusElement) {
            statusElement.className = `tool-status ${status}`;
        }
    }

    function updateProgress(percentage, message = '') {
        progressFill.style.width = percentage + '%';
        progressPercentage.textContent = percentage + '%';
        
        loadingFill.style.width = percentage + '%';
        loadingPercent.textContent = percentage + '%';
        
        // Show/hide progress panel based on processing
        if (percentage > 0 && percentage < 100) {
            progressPanel.style.display = 'block';
        } else if (percentage === 100) {
            setTimeout(() => {
                progressPanel.style.display = 'none';
            }, 2000);
        }
        
        if (message) {
            loadingMessage.textContent = message;
        }
    }

    function showNotification(message, type = 'info') {
        // Update navbar status
        navStatusText.textContent = message;
        navProcessingStatus.className = `stat-item processing-status ${type}`;
        
        const iconClass = type === 'success' ? 'fa-check-circle' :
                         type === 'error' ? 'fa-exclamation-circle' :
                         type === 'processing' ? 'fa-spinner fa-spin' :
                         'fa-info-circle';
        
        navProcessingStatus.querySelector('i').className = `fas ${iconClass}`;
    }

    function showLoading(show = true, message = 'Processing files...') {
        if (show) {
            loadingMessage.textContent = message;
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    }

    function resetInterface() {
        uploadedPdfFiles.length = 0;
        uploadedPdfMergeFiles.length = 0;
        uploadedJsonMergeFiles.length = 0;
        
        selectedPdfFiles.innerHTML = '';
        selectedPdfMergeFiles.innerHTML = '';
        selectedJsonMergeFiles.innerHTML = '';
        
        resultSection.classList.add('hidden');
        updateProgress(0);
        updateStats();
        
        updateToolStatus('pdf', 'inactive');
        updateToolStatus('pdf-merge', 'inactive');
        updateToolStatus('json', 'inactive');
        
        showNotification('Ready to process new files', 'info');
    }

    function updateOutputFilename() {
        const format = outputFormat.value;
        const currentName = jsonOutputPath.value;
        const baseName = currentName.split('.')[0];
        
        const extensions = {
            'json': '.json',
            'txt': '.txt',
            'ton': '.ton'
        };
        
        jsonOutputPath.value = baseName + extensions[format];
    }

    async function processPdfsToJson() {
        if (uploadedPdfFiles.length === 0) {
            showNotification('Please select PDF files first', 'error');
            return;
        }
        
        currentTool = 'pdf-to-json';
        updateToolStatus('pdf', 'processing');
        showLoading(true, 'Uploading PDF files...');
        showNotification('Starting PDF to JSON conversion...', 'processing');
        updateProgress(10, 'Uploading files...');
        
        const formData = new FormData();
        uploadedPdfFiles.forEach(file => formData.append('files', file));
        
        try {
            const uploadResponse = await fetch('http://127.0.0.1:5000/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }
            
            const uploadData = await uploadResponse.json();
            updateProgress(50, 'Processing PDF content...');
            showNotification('Files uploaded, processing content...', 'processing');
            
            const processResponse = await fetch('http://127.0.0.1:5000/process', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    pdf_paths: uploadData.paths,
                    output_filename: jsonOutputPath.value,
                    output_format: outputFormat.value
                })
            });
            
            if (!processResponse.ok) {
                throw new Error(`Processing failed: ${processResponse.statusText}`);
            }
            
            const processData = await processResponse.json();
            updateProgress(100, 'Processing complete!');
            
            processingResult = processData;
            resultMessage.textContent = processData.message;
            resultSection.classList.remove('hidden');
            
            // Auto-download after 2 seconds
            setTimeout(() => {
                autoDownloadResult();
            }, 2000);
            
            showLoading(false);
            updateToolStatus('pdf', 'active');
            showNotification(`PDF to ${outputFormat.value.toUpperCase()} conversion completed successfully!`, 'success');
            
        } catch (error) {
            console.error('Processing error:', error);
            showNotification(`Error: ${error.message}`, 'error');
            updateProgress(0);
            showLoading(false);
            updateToolStatus('pdf', 'active');
        }
    }

    async function mergePdfs() {
        if (uploadedPdfMergeFiles.length === 0) {
            showNotification('Please select PDF files to merge', 'error');
            return;
        }
        
        currentTool = 'pdf-merge';
        updateToolStatus('pdf-merge', 'processing');
        showLoading(true, 'Merging PDF files...');
        showNotification('Starting PDF merge process...', 'processing');
        updateProgress(25, 'Preparing files for merge...');
        
        const formData = new FormData();
        uploadedPdfMergeFiles.forEach(file => formData.append('files', file));
        formData.append('output_filename', pdfOutputPath.value);
        
        try {
            updateProgress(75, 'Merging PDF files...');
            
            const response = await fetch('http://127.0.0.1:5000/merge-pdfs', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Merge failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            updateProgress(100, 'Merge complete!');
            
            processingResult = data;
            resultMessage.textContent = data.message;
            resultSection.classList.remove('hidden');
            
            // Auto-download after 2 seconds
            setTimeout(() => {
                autoDownloadResult();
            }, 2000);
            
            showLoading(false);
            updateToolStatus('pdf-merge', 'active');
            showNotification('PDF files merged successfully!', 'success');
            
        } catch (error) {
            console.error('Merge error:', error);
            showNotification(`Error: ${error.message}`, 'error');
            updateProgress(0);
            showLoading(false);
            updateToolStatus('pdf-merge', 'active');
        }
    }

    async function mergeJsonFiles() {
        if (uploadedJsonMergeFiles.length === 0) {
            showNotification('Please select JSON files to merge', 'error');
            return;
        }
        
        currentTool = 'json-merge';
        updateToolStatus('json', 'processing');
        showLoading(true, 'Merging JSON datasets...');
        showNotification('Starting JSON merge process...', 'processing');
        updateProgress(25, 'Analyzing JSON structure...');
        
        const formData = new FormData();
        uploadedJsonMergeFiles.forEach(file => formData.append('files', file));
        formData.append('output_filename', jsonMergeOutputPath.value);
        
        try {
            updateProgress(75, 'Merging JSON data...');
            
            const response = await fetch('http://127.0.0.1:5000/merge-json', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`JSON merge failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            updateProgress(100, 'JSON merge complete!');
            
            processingResult = data;
            resultMessage.textContent = data.message;
            resultSection.classList.remove('hidden');
            
            // Auto-download after 2 seconds
            setTimeout(() => {
                autoDownloadResult();
            }, 2000);
            
            showLoading(false);
            updateToolStatus('json', 'active');
            showNotification('JSON files merged successfully!', 'success');
            
        } catch (error) {
            console.error('JSON merge error:', error);
            showNotification(`Error: ${error.message}`, 'error');
            updateProgress(0);
            showLoading(false);
            updateToolStatus('json', 'active');
        }
    }

    function downloadResult() {
        if (processingResult && processingResult.output_filename) {
            showNotification('Starting download...', 'processing');
            const downloadUrl = 'http://127.0.0.1:5000/download/' + processingResult.output_filename;
            
            // Create a temporary link element for download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = processingResult.output_filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Download started successfully!', 'success');
        } else {
            showNotification('No file available for download', 'error');
        }
    }
    
    function autoDownloadResult() {
        if (processingResult && processingResult.output_filename) {
            const downloadUrl = 'http://127.0.0.1:5000/download/' + processingResult.output_filename;
            
            // Create invisible iframe for silent download
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = downloadUrl;
            document.body.appendChild(iframe);
            
            // Remove iframe after download starts
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 3000);
            
            // Update UI to show download completed
            const autoDownloadInfo = document.querySelector('.auto-download-info');
            if (autoDownloadInfo) {
                autoDownloadInfo.innerHTML = '<i class="fas fa-check"></i><span>Download completed!</span>';
                autoDownloadInfo.style.background = 'rgba(16, 185, 129, 0.2)';
            }
            
            showNotification('File downloaded automatically!', 'success');
        }
    }
    
    // Initialize interface
    updateStats();
    showNotification('Welcome! Select files to get started', 'info');
});