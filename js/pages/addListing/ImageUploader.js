export class ImageUploader {
    constructor(targetElementId, options = {}) { // تغيير لاستقبال معرف العنصر
        this.config = {
            uploadPath: '../images/listings/{username}/{listingName}',
            maxSize: 5 * 1024 * 1024,
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            dimensions: {
                thumbnail: { width: 300, height: 200 },
                regular: { width: 800, height: 600 }
            },
            maxFiles: 10,
            ...options
        };

        this.container = document.getElementById(targetElementId); // الحصول على العنصر بواسطة المعرف
        if (!this.container) {
            throw new Error(`Element with id "${targetElementId}" not found`);
        }

        this.uploadQueue = [];
        this.uploadedFiles = [];
        
        this.initializeUI();
        this.bindEvents();
    }

    initializeUI() {
        this.container.innerHTML = `
            <div class="masry-image-upload">
                <div class="masry-dropzone">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag & drop images here or click to browse</p>
                    <span class="masry-dropzone__info">
                        Max ${this.config.maxFiles} images, ${this.config.maxSize / (1024 * 1024)}MB each (JPG, PNG)
                    </span>
                </div>
                <div class="masry-preview"></div>
            </div>
        `;

        this.dropzone = this.container.querySelector('.masry-dropzone');
        this.preview = this.container.querySelector('.masry-preview');
    }

    async uploadFiles(files) {
        const validFiles = this.validateFiles(files);
        if (!validFiles.isValid) {
            throw new Error(validFiles.error);
        }

        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('images', file);
        });

        try {
            // Implement API call for image upload
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            return await response.json();
        } catch (error) {
            throw new Error('Failed to upload images');
        }
    }

    validateFiles(files) {
        // Implement file validation
    }

    bindEvents() {
        if (!this.dropzone) return;

        // تحميل الصور عند السحب والإفلات
        this.dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropzone.classList.add('dragover');
        });

        this.dropzone.addEventListener('dragleave', () => {
            this.dropzone.classList.remove('dragover');
        });

        this.dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropzone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        // تحميل الصور عند النقر
        this.dropzone.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            input.onchange = (e) => this.handleFiles(e.target.files);
            input.click();
        });
    }

    handleFiles(files) {
        if (!files.length) return;
        
        // التحقق من الملفات قبل الرفع
        const validFiles = Array.from(files).filter(file => {
            const isValidType = this.config.allowedTypes.includes(file.type);
            const isValidSize = file.size <= this.config.maxSize;
            return isValidType && isValidSize;
        });

        if (validFiles.length) {
            this.uploadQueue.push(...validFiles);
            this.updatePreview();
        }
    }

    updatePreview() {
        if (!this.preview) return;

        this.preview.innerHTML = this.uploadQueue.map((file, index) => `
            <div class="preview-item">
                <img src="${URL.createObjectURL(file)}" alt="Preview ${index + 1}">
                <button type="button" class="remove-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        // إضافة معالجات أحداث لأزرار الحذف
        this.preview.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                this.uploadQueue.splice(index, 1);
                this.updatePreview();
            };
        });
    }
}
