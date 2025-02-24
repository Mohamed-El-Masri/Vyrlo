import { authService } from '../services/authService.js';

export class AuthUI {
    constructor() {
        this.authService = authService;
        this.initializeEventListeners();
        this.updateUIForAuthState();

        // Listen for auth state changes
        window.addEventListener('authStateChanged', () => {
            this.updateUIForAuthState();
        });
    }

    async updateUIForAuthState() {
        const { isAuthenticated, user } = this.authService.getAuthData();
        
        // Guest elements (Login button & Add Business)
        document.querySelectorAll('.guest-only')
            .forEach(el => {
                el.classList.toggle('d-none', isAuthenticated);
                el.style.display = isAuthenticated ? 'none' : '';
            });
        
        // Auth elements (Avatar & dropdown)
        document.querySelectorAll('.auth-only')
            .forEach(el => {
                el.classList.toggle('d-none', !isAuthenticated);
                el.style.display = !isAuthenticated ? 'none' : '';
            });

        if (isAuthenticated && user) {
            // Update user info
            document.querySelectorAll('.masry-user-name')
                .forEach(el => el.textContent = user.username);

            // Update avatar
            document.querySelectorAll('.masry-user-image')
                .forEach(el => {
                    el.src = user.profilePic?.[0] || '../images/user/user-1.png';
                    el.alt = user.username;
                });

            // تحديث روابط الأعمال
            this.updateBusinessLinks(user);
        } else {
            // تنظيف أي بيانات مستخدم في الواجهة
            document.querySelectorAll('.masry-user-name').forEach(el => el.textContent = '');
            document.querySelectorAll('.masry-user-image').forEach(el => {
                el.src = '../images/user/user-1.png';
                el.alt = 'Guest';
            });
        }
    }

    updateBusinessLinks(user) {
        const businessLinkContainer = document.getElementById('businessLinkContainer');
        if (!businessLinkContainer) return;

        businessLinkContainer.innerHTML = `
            <a class="dropdown-item masry-dropdown-item" href="../pages/newAddListing.html">
                <i class="fa-solid fa-plus"></i> Add Listing
            </a>
            ${user.numberOfProjects > 0 ? `
            <a class="dropdown-item masry-dropdown-item" href="../pages/myListings.html">
                <i class="fa-solid fa-list"></i> My Listings (${user.numberOfProjects})
            </a>` : ''}
        `;
    }

    initializeEventListeners() {
        // Login Form
        const loginForm = document.getElementById('loginForm');
        loginForm?.addEventListener('submit', this.handleLogin.bind(this));

        // Register Form
        const signUpForm = document.getElementById('signUpForm');
        signUpForm?.addEventListener('submit', this.handleRegister.bind(this));

        // Password Reset Form
        const forgetPasswordForm = document.getElementById('forgetPasswordForm');
        forgetPasswordForm?.addEventListener('submit', this.handlePasswordReset.bind(this));

        // Verification Code Form
        const verificationForm = document.querySelector('#verificationModal form');
        verificationForm?.addEventListener('submit', this.handleVerification.bind(this));

        // Password Toggle Buttons
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', this.togglePasswordVisibility);
        });

        // Password Input Validation
        document.querySelectorAll('input[type="password"]').forEach(input => {
            input.addEventListener('input', this.validatePassword);
        });

        // إضافة مستمع لحدث تسجيل الخروج
        window.addEventListener('userLoggedOut', () => {
            this.showLogoutNotification();
        });

        // تحديث معالج حدث تسجيل الخروج
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.removeEventListener('click', this.handleLogout); // إزالة المعالج القديم إن وجد
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
    }

    showLogoutNotification() {
        return new Promise((resolve) => {
            this.showToast('You have been successfully logged out', 'success');
            setTimeout(resolve, 1500);
        });
    }

    async handleLogout(e) {
        e.preventDefault();
        console.log('AuthUI: Logout handler started');
        
        try {
            // 1. تسجيل الخروج من الخدمة
            await this.authService.logout();
            
            // 2. عرض الإشعار وانتظار اكتماله
            console.log('AuthUI: Showing logout notification');
            await this.showLogoutNotification();
            
            // 3. تحديث واجهة المستخدم فقط بدون reload
            console.log('AuthUI: Updating UI state');
            this.updateUIForAuthState();
            
            // إزالة أي محاولة لإعادة تحميل الصفحة
            // location.reload(); // تم إزالتها
        } catch (error) {
            console.error('AuthUI: Logout error:', error);
            this.showToast('Logout failed', 'error');
        }
    }

    showLogoutNotification() {
        return new Promise((resolve) => {
            console.log('AuthUI: Creating logout notification');
            
            const toast = document.createElement('div');
            toast.className = 'toast logout-toast show';
            toast.innerHTML = `
                <div class="toast-header">
                    <i class="fas fa-sign-out-alt me-2"></i>
                    <strong class="me-auto">Logged Out</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    You have been successfully logged out.
                </div>
            `;

            // إنشاء أو الحصول على حاوية الإشعارات
            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container position-fixed top-0 end-0 p-3';
                container.style.zIndex = '9999';
                document.body.appendChild(container);
                console.log('AuthUI: Created new toast container');
            }

            container.appendChild(toast);
            console.log('AuthUI: Toast added to container');

            // تأخير إزالة الإشعار
            setTimeout(() => {
                console.log('AuthUI: Starting toast removal');
                toast.classList.add('hiding');
                setTimeout(() => {
                    toast.remove();
                    console.log('AuthUI: Toast removed');
                    resolve();
                }, 500); // زيادة وقت الأنيميشن
            }, 3000); // زيادة مدة ظهور الإشعار
        });
    }

    // Add form validation methods
    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateInput(input) {
        const { name, value } = input;
        let isValid = true;
        let message = '';

        switch (name) {
            case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                message = 'Please enter a valid email address';
                break;

            case 'password':
                const requirements = {
                    length: value.length >= 8,
                    uppercase: /[A-Z]/.test(value),
                    lowercase: /[a-z]/.test(value),
                    number: /[0-9]/.test(value),
                    special: /[!@#$%^&*]/.test(value)
                };
                isValid = Object.values(requirements).every(Boolean);
                message = 'Password must meet all requirements';
                this.updatePasswordRequirements(requirements, input);
                break;

            case 'confirmPassword':
                const password = input.form.querySelector('input[name="password"]');
                isValid = value === password.value;
                message = 'Passwords do not match';
                break;

            case 'username':
                isValid = value.length >= 3;
                message = 'Username must be at least 3 characters';
                break;
        }

        // تحديث حالة الحقل
        this.updateInputState(input, isValid, message);
        return isValid;
    }

    updateInputState(input, isValid, message) {
        // إزالة الحالات السابقة
        input.classList.remove('is-valid', 'is-invalid');
        
        // إضافة الحالة الجديدة
        input.classList.add(isValid ? 'is-valid' : 'is-invalid');

        // تحديث رسالة التحقق
        const feedback = input.parentElement.querySelector(
            isValid ? '.valid-feedback' : '.invalid-feedback'
        );
        if (feedback) {
            feedback.textContent = message;
            feedback.style.display = isValid ? 'none' : 'block';
        }

        // تحديث لون الأيقونة
        const icon = input.parentElement.querySelector('.input-icon');
        if (icon) {
            icon.style.color = isValid ? '#28a745' : '#e4074e';
        }
    }

    updatePasswordRequirements(requirements, input) {
        const requirementsList = input.closest('.form-group')
            .querySelector('.password-requirements');
        
        if (requirementsList) {
            Object.entries(requirements).forEach(([key, met]) => {
                const req = requirementsList.querySelector(`.requirement-${key}`);
                if (req) {
                    req.classList.toggle('valid', met);
                    const icon = req.querySelector('i');
                    if (icon) {
                        icon.className = `fas fa-${met ? 'check' : 'times'}`;
                    }
                }
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        
        if (!this.validateForm(form)) return;

        const button = form.querySelector('button[type="submit"]');
        try {
            this.showLoadingState(button, 'Signing in...');
            const response = await this.authService.login({
                email: form.email.value,
                password: form.password.value
            });

            if (response.success) {
                this.handleLoginSuccess(response.data);
            }
        } catch (error) {
            this.handleLoginError(error, form);
        } finally {
            this.hideLoadingState(button, 'Sign In');
        }
    }

    handleLoginSuccess(userData) {
        $('#loginModal').modal('hide');
        this.showToast(`Welcome back, ${userData.username}!`, 'success');
        this.updateUIForAuthState();
    }

    showLoadingState(button, text) {
        button.disabled = true;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            ${text}
        `;
    }

    hideLoadingState(button, text) {
        button.disabled = false;
        button.innerHTML = text;
    }

    handleLoginError(error, form) {
        const passwordInput = form.querySelector('[name="password"]');
        passwordInput.value = '';
        passwordInput.focus();
        
        this.showToast(error.message || 'Invalid email or password', 'error');
    }

    showToast(message, type = 'success') {
        return new Promise(resolve => {
            console.log(`Showing ${type} toast:`, message);
            
            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container position-fixed top-0 end-0 p-3';
                container.style.zIndex = '9999';
                document.body.appendChild(container);
                console.log('Created new toast container');
            }

            const toast = document.createElement('div');
            toast.className = `toast toast-${type} show`;
            toast.setAttribute('role', 'alert');
            toast.innerHTML = `
                <div class="toast-header">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2" 
                       style="color: ${type === 'success' ? '#28a745' : '#e4074e'}"></i>
                    <strong class="me-auto">${type === 'success' ? 'Success' : 'Error'}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">${message}</div>
            `;

            container.appendChild(toast);
            console.log('Toast element added to container');

            // إضافة تأثيرات حركية
            toast.style.animation = 'slideIn 0.3s ease forwards';

            // معالج زر الإغلاق
            const closeBtn = toast.querySelector('.btn-close');
            closeBtn?.addEventListener('click', () => {
                console.log('Toast close button clicked');
                toast.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
                resolve();
            });

            // إزالة تلقائية
            setTimeout(() => {
                console.log('Starting automatic toast removal');
                toast.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => {
                    toast.remove();
                    resolve();
                }, 300);
            }, 3000);
        });
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        if (!form.checkValidity()) return;

        this.showLoading(form);
        try {
            const formData = new FormData(form);
            const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password')
            };

            const response = await this.authService.register(userData);
            if (response.success) {
                this.showSuccess('Registration successful');
                // Show verification modal
                const verificationModal = new bootstrap.Modal(document.getElementById('verificationModal'));
                verificationModal.show();
            }
        } catch (error) {
            this.showError('Registration failed', error.message);
        } finally {
            this.hideLoading(form);
        }
    }

    async handlePasswordReset(e) {
        e.preventDefault();
        const form = e.target;
        if (!form.checkValidity()) return;

        this.showLoading(form);
        try {
            const formData = new FormData(form);
            const response = await this.authService.requestPasswordReset(formData.get('email'));
            if (response.success) {
                this.showSuccess('Password reset email sent');
                // Show verification modal
                const verificationModal = new bootstrap.Modal(document.getElementById('verificationModal'));
                verificationModal.show();
            }
        } catch (error) {
            this.showError('Password reset failed', error.message);
        } finally {
            this.hideLoading(form);
        }
    }

    async handleVerification(e) {
        e.preventDefault();
        const form = e.target;
        
        const code = Array.from(form.querySelectorAll('.code-input'))
            .map(input => input.value)
            .join('');

        if (code.length !== 6) {
            this.showError('Verification failed', 'Please enter a valid code');
            return;
        }

        this.showLoading(form);
        try {
            // API call will be implemented here
            this.showSuccess('Verification successful');
            bootstrap.Modal.getInstance(document.getElementById('verificationModal')).hide();
        } catch (error) {
            this.showError('Verification failed', error.message);
        } finally {
            this.hideLoading(form);
        }
    }

    // UI Helper Methods
    showLoading(form) {
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.classList.add('loading');
    }

    hideLoading(form) {
        const button = form.querySelector('button[type="submit"]');
        button.disabled = false;
        button.classList.remove('loading');
    }

    showError(title, message) {
        const toast = this.createToast('error', title, message);
        document.querySelector('.toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    showSuccess(message) {
        const toast = this.createToast('success', 'Success', message);
        document.querySelector('.toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    createToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-header">
                <strong>${title}</strong>
                <button type="button" class="toast-close">&times;</button>
            </div>
            <div class="toast-body">${message}</div>
        `;
        return toast;
    }

    togglePasswordVisibility(e) {
        const button = e.currentTarget;
        const input = button.parentElement.querySelector('input');
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        button.innerHTML = `<i class="fa-solid fa-eye${type === 'password' ? '' : '-slash'}"></i>`;
    }

    validatePassword(e) {
        const input = e.target;
        const password = input.value;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };

        Object.entries(requirements).forEach(([key, valid]) => {
            const requirement = document.querySelector(`.requirement-${key}`);
            if (requirement) {
                const icon = requirement.querySelector('i');
                icon.className = `fas fa-${valid ? 'check' : 'times'}`;
                requirement.classList.toggle('valid', valid);
            }
        });

        return Object.values(requirements).every(Boolean);
    }

    initializeValidation() {
        // تحقق مباشر لجميع النماذج
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required]');
            inputs.forEach(input => {
                // تحقق أثناء الكتابة
                input.addEventListener('input', () => {
                    this.validateInput(input);
                });

                // تحقق عند فقدان التركيز
                input.addEventListener('blur', () => {
                    this.validateInput(input);
                });
            });

            // خاص بتأكيد كلمة المرور
            const confirmPassword = form.querySelector('input[name="confirmPassword"]');
            if (confirmPassword) {
                const password = form.querySelector('input[name="password"]');
                password?.addEventListener('input', () => {
                    if (confirmPassword.value) {
                        this.validateInput(confirmPassword);
                    }
                });
            }
        });
    }
}

// Initialize auth UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const authUI = new AuthUI();
    authUI.initializeValidation();
});

