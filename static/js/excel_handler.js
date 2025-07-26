// GST Return Tracking System - Excel Handler
// Professional ExcelJS script for import/export functionality

class ExcelHandler {
    constructor() {
        this.workbook = null;
        this.worksheet = null;
        this.maxFileSize = 16 * 1024 * 1024; // 16MB
        this.supportedFormats = ['.xlsx', '.xls'];
    }

    // Initialize Excel handler
    initialize() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    // Setup event listeners
    setupEventListeners() {
        // File input change event
        document.addEventListener('change', (event) => {
            if (event.target.type === 'file' && event.target.accept.includes('excel')) {
                this.handleFileSelection(event.target);
            }
        });

        // Form submission for import
        document.addEventListener('submit', (event) => {
            if (event.target.id === 'importForm') {
                event.preventDefault();
                this.handleImportSubmission(event.target);
            }
        });
    }

    // Setup drag and drop functionality
    setupDragAndDrop() {
        const dropZones = document.querySelectorAll('.file-upload-label');
        
        dropZones.forEach(dropZone => {
            // Prevent default drag behaviors
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, this.preventDefaults, false);
            });

            // Highlight drop zone when item is dragged over it
            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.add('dragover');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.remove('dragover');
                }, false);
            });

            // Handle dropped files
            dropZone.addEventListener('drop', (event) => {
                const files = event.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelection(files[0]);
                }
            }, false);
        });
    }

    // Prevent default drag behaviors
    preventDefaults(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Handle file selection
    handleFileSelection(fileInput) {
        const file = fileInput.files ? fileInput.files[0] : fileInput;
        
        if (!file) {
            this.showError('No file selected');
            return;
        }

        // Validate file
        if (!this.validateFile(file)) {
            return;
        }

        // Preview file information
        this.displayFileInfo(file);
    }

    // Validate file
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            this.showError(`File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`);
            return false;
        }

        // Check file format
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(fileExtension)) {
            this.showError('Invalid file format. Please upload Excel files (.xlsx, .xls)');
            return false;
        }

        // Check file name for special characters
        const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        if (!fileNameRegex.test(fileName)) {
            this.showError('File name contains invalid characters. Please use only letters, numbers, dots, hyphens, and underscores.');
            return false;
        }

        return true;
    }

    // Display file information
    displayFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.innerHTML = `
                <div class="alert alert-info">
                    <strong>File Selected:</strong> ${file.name}<br>
                    <strong>Size:</strong> ${this.formatFileSize(file.size)}<br>
                    <strong>Type:</strong> ${file.type}
                </div>
            `;
        }
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Handle import submission
    async handleImportSubmission(form) {
        const fileInput = form.querySelector('input[type="file"]');
        const file = fileInput.files[0];

        if (!file) {
            this.showError('Please select a file to import');
            return;
        }

        this.showLoading(true);

        try {
            // Read Excel file
            const data = await this.readExcelFile(file);
            
            // Validate data
            const validationResult = this.validateImportData(data);
            if (!validationResult.isValid) {
                this.showError('Data validation failed:\n' + validationResult.errors.join('\n'));
                this.showLoading(false);
                return;
            }

            // Process import
            await this.processImport(data);

        } catch (error) {
            console.error('Import error:', error);
            this.showError('Error importing file: ' + error.message);
		}
	}
}
