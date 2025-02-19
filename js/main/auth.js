// signin api url : https://virlo.vercel.app/signin
// signup api url : https://virlo.vercel.app/signup
// reset password api url : https://virlo.vercel.app/reset
// send-otp api url : https://virlo.vercel.app/send-otp
// Get profile api url : https://virlo.vercel.app/profile/67a899f51909bc60ccdc26a7


class AuthValidator {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePassword(password) {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };
    }

    static validateUsername(username) {
        return username.length >= 3;
    }
}

class AuthUI {
    static showLoading(button) {
        button.disabled = true;
        button.classList.add('loading');
    }

    static hideLoading(button) {
        button.disabled = false;
        button.classList.remove('loading');
    }

    static showError(input, message) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        const feedback = input.nextElementSibling.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = message;
            feedback.style.display = 'block';
        }
    }

    static showSuccess(input) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        const feedback = input.nextElementSibling.nextElementSibling;
        if (feedback) {
            feedback.style.display = 'none';
        }
    }

    static clearValidation(input) {
        input.classList.remove('is-invalid', 'is-valid');
        const feedback = input.nextElementSibling.nextElementSibling;
        if (feedback) {
            feedback.style.display = 'none';
        }
    }

    static startVerificationTimer(timerElement, duration = 60) {
        let timeLeft = duration;
        
        const timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timer);
                timerElement.innerHTML = `<a href="#" class="auth-switch-link">Resend Code</a>`;
                return;
            }
            
            timerElement.textContent = `Resend code in ${timeLeft} seconds`;
            timeLeft--;
        }, 1000);
    }

    static showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.querySelector('.toast-container').appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    static async updateUIForAuthState() {
        const isAuth = AuthService.isAuthenticated();
        const userData = AuthService.getAuthData().user;

        // Guest Elements
        const guestElements = document.querySelectorAll('.guest-only');
        // Auth Elements
        const authElements = document.querySelectorAll('.auth-only');

        if (isAuth && userData) {
            // Hide Guest Elements
            guestElements.forEach(el => el.classList.add('d-none'));
            // Show Auth Elements
            authElements.forEach(el => el.classList.remove('d-none'));

            // Update User Info
            const userNameElements = document.querySelectorAll('.masry-user-name');
            userNameElements.forEach(el => el.textContent = userData.username);

            const userImageElements = document.querySelectorAll('.masry-user-image');
            userImageElements.forEach(el => {
                el.src = userData.profileImage || '../images/user/user-1.png';
                el.alt = userData.username;
            });

            // Update Business Link
            const businessLinkContainer = document.getElementById('businessLinkContainer');
            if (businessLinkContainer) {
                if (userData.hasBusiness) {
                    businessLinkContainer.innerHTML = `
                        <a class="dropdown-item masry-dropdown-item" href="../pages/myBusiness.html">
                            <i class="fa-solid fa-store"></i> My Business
                        </a>
                    `;
                } else {
                    businessLinkContainer.innerHTML = `
                        <a class="dropdown-item masry-dropdown-item" href="../pages/newAddListing.html">
                            <i class="fa-solid fa-plus"></i> Add Business
                        </a>
                    `;
                }
            }
        } else {
            // Show Guest Elements
            guestElements.forEach(el => el.classList.remove('d-none'));
            // Hide Auth Elements
            authElements.forEach(el => el.classList.add('d-none'));
        }
    }

    static showSessionExpiredAlert() {
        const modalHtml = `
            <div class="modal fade" id="sessionExpiredModal">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-body text-center p-4">
                            <i class="fas fa-clock fa-3x text-warning mb-3"></i>
                            <h4>Session Expired</h4>
                            <p>Your session has expired. Please log in again to continue.</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                Log In Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('sessionExpiredModal'));
        modal.show();
    }

    static showErrorModal(message) {
        const modalHtml = `
            <div class="modal fade" id="errorModal">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-body text-center p-4">
                            <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                            <h4>Login Error</h4>
                            <p>${message}</p>
                            <button class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('errorModal'));
        modal.show();

        // Remove modal from DOM after it's hidden
        document.getElementById('errorModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    static getErrorMessage(error) {
        const errorMessages = {
            'email_exists': 'This email is already registered',
            'email_not_verified': 'Please verify your email first',
            'invalid_credentials': 'Invalid email or password',
            'user_not_found': 'Account not found',
            'default': 'An error occurred. Please try again'
        };

        return errorMessages[error] || errorMessages.default;
    }

    static updateUIForAuthState() {
        const isAuth = AuthService.isAuthenticated();
        const userData = AuthService.getAuthData().user;

        // Guest elements (Login button & Add Business)
        const guestElements = document.querySelectorAll('.guest-only');
        // Auth elements (Avatar & dropdown)
        const authElements = document.querySelectorAll('.auth-only');

        if (isAuth && userData) {
            // Hide guest elements
            guestElements.forEach(el => el.classList.add('d-none'));
            
            // Show auth elements
            authElements.forEach(el => el.classList.remove('d-none'));

            // Update user info
            const userNameElements = document.querySelectorAll('.masry-user-name');
            userNameElements.forEach(el => {
                el.textContent = userData.username;
            });

            // Update avatar
            const userImageElements = document.querySelectorAll('.masry-user-image');
            userImageElements.forEach(el => {
                el.src = userData.profileImage || '../images/user/user-1.png';
                el.alt = userData.username;
            });

            // Update business link in dropdown
            const businessLinkContainer = document.getElementById('businessLinkContainer');
            if (businessLinkContainer) {
                if (userData.hasBusiness) {
                    businessLinkContainer.innerHTML = `
                        <a class="dropdown-item masry-dropdown-item" href="../pages/myBusiness.html">
                            <i class="fa-solid fa-store"></i> My Business
                        </a>
                    `;
                } else {
                    businessLinkContainer.innerHTML = `
                        <a class="dropdown-item masry-dropdown-item" href="../pages/newAddListing.html">
                            <i class="fa-solid fa-plus"></i> Add Business
                        </a>
                    `;
                }
            }

            // Enable logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    AuthService.logout();
                    AuthUI.showLogoutModal();
                });
            }
        } else {
            // Show guest elements
            guestElements.forEach(el => el.classList.remove('d-none'));
            // Hide auth elements
            authElements.forEach(el => el.classList.add('d-none'));
        }
    }

    static showNetworkError() {
        this.showErrorModal(`
            <div class="text-center">
                <h5>Connection Error</h5>
                <p>Unable to connect to the server. Please check your internet connection and try again.</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">
                    Retry
                </button>
            </div>
        `);
    }

    static showVerificationModal(email, userId) {
        console.log('Showing verification modal for:', email);
        
        // حفظ البريد الإلكتروني وID المستخدم في Local Storage للتحقق لاحقاً
        localStorage.setItem('pendingVerificationEmail', email);
        localStorage.setItem('pendingVerificationUserId', userId);

        const modalHtml = `
            <div class="modal fade" id="verificationModal" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <h5 class="modal-title">Verify Your Email</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div class="verification-icon mb-4">
                                <i class="fas fa-envelope-open-text fa-3x" style="color: #e4074e;"></i>
                            </div>
                            <p class="verification-text mb-4">
                                We've sent a verification code to <strong>${email}</strong>
                            </p>
                            <div class="verification-code-container mb-4">
                                <input type="text" class="code-input" maxlength="1" pattern="[0-9]" autofocus>
                                <input type="text" class="code-input" maxlength="1" pattern="[0-9]">
                                <input type="text" class="code-input" maxlength="1" pattern="[0-9]">
                                <input type="text" class="code-input" maxlength="1" pattern="[0-9]">
                                <input type="text" class="code-input" maxlength="1" pattern="[0-9]">
                                <input type="text" class="code-input" maxlength="1" pattern="[0-9]">
                            </div>
                            <button class="btn paste-btn mb-3">
                                <i class="fas fa-clipboard me-2"></i>Paste Code
                            </button>
                            <div class="timer text-muted mb-3">
                                Resend code in <span class="countdown">60</span> seconds
                            </div>
                            <button class="btn verify-btn w-100 mb-3" disabled>
                                Verify Code
                            </button>
                            <p class="text-muted small">
                                Please enter the verification code sent to your email to complete registration
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #verificationModal .modal-content {
                border: none;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }

            .verification-code-container {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin: 20px auto;
            }

            .code-input {
                width: 45px;
                height: 45px;
                border: 2px solid #e1e1e1;
                border-radius: 8px;
                text-align: center;
                font-size: 1.2rem;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .code-input:focus {
                border-color: #e4074e;
                box-shadow: 0 0 0 3px rgba(228, 7, 78, 0.1);
                outline: none;
            }

            .verify-btn {
                background: #e4074e;
                color: white;
                padding: 12px;
                border-radius: 10px;
                transition: all 0.3s ease;
            }

            .verify-btn:disabled {
                background: #cccccc;
                cursor: not-allowed;
            }

            .verify-btn:not(:disabled):hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(228, 7, 78, 0.2);
            }
        `;
        document.head.appendChild(style);

        // إزالة المودال السابق إذا وجد
        const existingModal = document.getElementById('verificationModal');
        if (existingModal) existingModal.remove();

        // إضافة المودال الجديد
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // إظهار المودال
        const modal = new bootstrap.Modal(document.getElementById('verificationModal'), {
            backdrop: 'static',
            keyboard: false
        });
        modal.show();

        // تفعيل التحقق من الكود
        this.initializeCodeVerification();
        
        // Clear any existing countdown
        this.clearCountdown();
        
        // Initialize countdown after modal is shown
        const modalElement = document.getElementById('verificationModal');
        modalElement.addEventListener('shown.bs.modal', () => {
            console.log('Modal shown, initializing countdown...');
            this.startCountdown();
            // Focus first input
            const firstInput = modalElement.querySelector('.code-input');
            if (firstInput) firstInput.focus();
        });
    }

    static initializeCodeVerification() {
        const codeInputs = document.querySelectorAll('.code-input');
        const verifyBtn = document.querySelector('.verify-btn');

        // تحديث حالة زر التحقق
        const updateVerifyButton = () => {
            const code = Array.from(codeInputs).map(input => input.value).join('');
            verifyBtn.disabled = code.length !== 6; // تم تغيير الطول إلى 6
        };

        // معالجة إدخال الكود
        codeInputs.forEach((input, index) => {
            input.addEventListener('keyup', (e) => {
                if (e.key >= '0' && e.key <= '9') {
                    input.value = e.key;
                    if (index < codeInputs.length - 1) {
                        codeInputs[index + 1].focus();
                    }
                } else if (e.key === 'Backspace') {
                    input.value = '';
                    if (index > 0) {
                        codeInputs[index - 1].focus();
                    }
                }
                updateVerifyButton();
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').slice(0, 4);
                [...pastedData].forEach((char, i) => {
                    if (i < codeInputs.length && /[0-9]/.test(char)) {
                        codeInputs[i].value = char;
                    }
                });
                updateVerifyButton();
            });
        });

        // معالجة زر التحقق
        verifyBtn.addEventListener('click', async () => {
            const code = Array.from(codeInputs).map(input => input.value).join('');
            const email = localStorage.getItem('pendingVerificationEmail');

            try {
                verifyBtn.disabled = true;
                verifyBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Verifying...
                `;

                await AuthService.verifyOTP(email, code);
                
                // نجاح التحقق
                localStorage.removeItem('pendingVerificationEmail');
                localStorage.removeItem('registrationPending');
                
                document.getElementById('verificationModal').remove();
                AuthUI.showToast('Email verified successfully! You can now login.');
                
                // إظهار مودال تسجيل الدخول
                $('#loginModal').modal('show');

            } catch (error) {
                AuthUI.showToast(error.message || 'Invalid verification code', 'error');
                // تفريغ حقول الإدخال
                codeInputs.forEach(input => input.value = '');
                codeInputs[0].focus();
                verifyBtn.disabled = true;
            } finally {
                verifyBtn.innerHTML = 'Verify Code';
            }
        });

        // بدء العد التنازلي
        this.startCountdown();
    }

    static startCountdown(duration = 60) {
        const timerEl = document.querySelector('.timer');
        if (!timerEl) {
            console.error('Timer element not found:', {
                selector: '.timer',
                container: document.querySelector('.modal-content')
            });
            return;
        }

        console.log('Starting countdown timer...');
        
        // تحديث الواجهة مباشرة
        timerEl.innerHTML = `
            <div class="d-flex align-items-center justify-content-center gap-2">
                <span class="countdown-text">Resend code in</span>
                <span class="countdown-number">${duration}</span>
                <span class="countdown-text">seconds</span>
            </div>
        `;

        const countdownEl = timerEl.querySelector('.countdown-number');
        let timeLeft = duration;

        const interval = setInterval(() => {
            timeLeft--;
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                this.showResendButton(timerEl);
            } else if (countdownEl) {
                countdownEl.textContent = timeLeft;
            }
        }, 1000);

        // تخزين الفاصل الزمني للتنظيف
        timerEl.dataset.timerId = interval;
    }

    static showResendButton(timerEl) {
        timerEl.innerHTML = `
            <button class="resend-code-btn">
                <i class="fas fa-redo-alt me-2"></i>Resend Code
            </button>
        `;

        const resendBtn = timerEl.querySelector('.resend-code-btn');
        if (resendBtn) {
            resendBtn.addEventListener('click', async () => {
                const email = localStorage.getItem('pendingVerificationEmail');
                if (!email) {
                    this.showToast('Verification session expired', 'error');
                    return;
                }

                try {
                    resendBtn.disabled = true;
                    resendBtn.innerHTML = `
                        <span class="spinner-border spinner-border-sm me-2"></span>
                        Sending...
                    `;
                    
                    await AuthService.resendOTP(email);
                    this.showToast('Verification code resent successfully');
                    this.startCountdown(); // إعادة تشغيل العد التنازلي
                } catch (error) {
                    this.showToast(error.message || 'Failed to resend code', 'error');
                    resendBtn.disabled = false;
                    resendBtn.innerHTML = `
                        <i class="fas fa-redo-alt me-2"></i>Resend Code
                    `;
                }
            });
        }
    }

    static clearCountdown() {
        const timerEl = document.querySelector('.timer');
        if (timerEl && timerEl.dataset.timerId) {
            clearInterval(Number(timerEl.dataset.timerId));
        }
    }

    static showExistingAccountModal(email) {
        const modalHtml = `
            <div class="modal fade" id="existingAccountModal">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-body text-center p-4">
                            <i class="fas fa-user-check fa-3x text-primary mb-3"></i>
                            <h4>Account Already Exists</h4>
                            <p>An account with the email <strong>${email}</strong> already exists.</p>
                            <p class="text-muted">Would you like to:</p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#loginModal">
                                    Sign In
                                </button>
                                <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#forgetPasswordModal">
                                    Reset Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if it exists
        const existingModal = document.getElementById('existingAccountModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Hide signup modal and show existing account modal
        $('#signUpModal').modal('hide');
        const modal = new bootstrap.Modal(document.getElementById('existingAccountModal'));
        modal.show();

        // Handle modal buttons
        document.getElementById('existingAccountModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    static showExistingEmailModal(email) {
        const modalHtml = `
            <div class="modal fade" id="existingEmailModal">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center pb-4">
                            <i class="fas fa-user-check fa-3x mb-3" style="color: #e4074e;"></i>
                            <h4 class="mb-3" style="color: #1c1c28;">Account Already Exists</h4>
                            <p class="mb-4">There's already an account registered with <strong>${email}</strong></p>
                            <div class="d-grid gap-3">
                                <button class="btn w-100" 
                                    style="background-color: #e4074e; color: white; transition: all 0.3s ease;"
                                    onmouseover="this.style.backgroundColor='#c8063f'"
                                    onmouseout="this.style.backgroundColor='#e4074e'"
                                    onclick="$('#existingEmailModal').modal('hide'); $('#loginModal').modal('show');">
                                    <i class="fas fa-sign-in-alt me-2"></i>Sign In
                                </button>
                                <button class="btn w-100" 
                                    style="border: 2px solid #e4074e; color: #e4074e; background: transparent; transition: all 0.3s ease;"
                                    onmouseover="this.style.backgroundColor='#e4074e'; this.style.color='white'"
                                    onmouseout="this.style.backgroundColor='transparent'; this.style.color='#e4074e'"
                                    onclick="$('#existingEmailModal').modal('hide'); $('#forgetPasswordModal').modal('show');">
                                    <i class="fas fa-key me-2"></i>Reset Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // إزالة المودال القديم إذا كان موجوداً
        const existingModal = document.getElementById('existingEmailModal');
        if (existingModal) existingModal.remove();

        // إضافة المودال الجديد وعرضه
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        $('#signUpModal').modal('hide');
        const modal = new bootstrap.Modal(document.getElementById('existingEmailModal'));
        modal.show();

        // تطبيق تأثير الظل عند ظهور المودال
        const modalContent = document.querySelector('#existingEmailModal .modal-content');
        if (modalContent) {
            modalContent.style.animation = 'modalFadeIn 0.3s ease';
            modalContent.style.boxShadow = '0 5px 15px rgba(228, 7, 78, 0.2)';
        }
    }

    static showLoginSuccessModal() {
        const modalHtml = `
            <div class="modal fade" id="loginSuccessModal">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 320px;">
                    <div class="modal-content">
                        <div class="modal-body text-center p-4 d-flex flex-column align-items-center justify-content-center">
                            <div class="success-animation">
                                <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                    <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                                    <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                                </svg>
                            </div>
                            <h4 class="mt-3" style="color: #1c1c28;">Welcome Back!</h4>
                            <p class="text-muted">You have successfully logged in</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .success-animation {
                margin: 20px auto;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .checkmark {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                display: block;
                stroke-width: 2;
                stroke: #e4074e;
                stroke-miterlimit: 10;
                margin: 10% auto;
                box-shadow: 0 0 20px rgba(228, 7, 78, 0.2);
                animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
            }
            .checkmark__circle {
                stroke-dasharray: 166;
                stroke-dashoffset: 166;
                stroke-width: 2;
                stroke-miterlimit: 10;
                stroke: #e4074e;
                fill: none;
                animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }
            .checkmark__check {
                transform-origin: 50% 50%;
                stroke-dasharray: 48;
                stroke-dashoffset: 48;
                animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
            }
            @keyframes stroke { 100% { stroke-dashoffset: 0; } }
            @keyframes scale { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1, 1.1, 1); } }
            @keyframes fill { 100% { box-shadow: inset 0 0 0 30px #fff; } }

            #loginSuccessModal .modal-content {
                border: none;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }

            #loginSuccessModal .modal-body {
                min-height: 250px;
            }
        `;
        document.head.appendChild(style);

        // Remove existing modal if present
        const existingModal = document.getElementById('loginSuccessModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal and show it
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('loginSuccessModal'));
        modal.show();

        // Auto close after exactly 2 seconds
        setTimeout(() => {
            modal.hide();
            setTimeout(() => {
                document.getElementById('loginSuccessModal')?.remove();
            }, 150); // Allow for hide animation
        }, 4000);
    }

    static showLoginErrorModal(error) {
        const modalHtml = `
            <div class="modal fade" id="loginErrorModal">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-body text-center p-4">
                            <div class="error-animation mb-3">
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                            <h4 style="color: #1c1c28;">Login Failed</h4>
                            <p class="text-muted">${error}</p>
                            <button class="btn mt-3" onclick="$('#loginErrorModal').modal('hide');">
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add error animation styles
        const style = document.createElement('style');
        style.textContent = `
            .error-animation {
                font-size: 48px;
                color: #e4074e;
                animation: shake 0.5s ease-in-out;
            }
            .error-animation i {
                display: inline-block;
            }
            #loginErrorModal .modal-content {
                border-top: 4px solid #e4074e;
            }
            #loginErrorModal .btn {
                background-color: #e4074e;
                color: white;
                padding: 8px 24px;
                border-radius: 25px;
                transition: all 0.3s ease;
            }
            #loginErrorModal .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(228, 7, 78, 0.2);
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
        `;
        document.head.appendChild(style);

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('loginErrorModal'));
        modal.show();

        // Remove modal when hidden
        document.getElementById('loginErrorModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    static showLogoutModal() {
        const modalHtml = `
            <div class="modal fade" id="logoutSuccessModal">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 320px;">
                    <div class="modal-content">
                        <div class="modal-body text-center p-4 d-flex flex-column align-items-center justify-content-center">
                            <div class="logout-animation">
                                <i class="fas fa-sign-out-alt"></i>
                            </div>
                            <h4 class="mt-3" style="color: #1c1c28;">Goodbye!</h4>
                            <p class="text-muted">You have been successfully logged out</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .logout-animation {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(145deg, #e4074e, #ff6b6b);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 20px auto;
                animation: pulse 2s infinite;
            }

            .logout-animation i {
                font-size: 35px;
                color: white;
                animation: slide-out 1s ease forwards;
            }

            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(228, 7, 78, 0.4); }
                70% { box-shadow: 0 0 0 15px rgba(228, 7, 78, 0); }
                100% { box-shadow: 0 0 0 0 rgba(228, 7, 78, 0); }
            }

            @keyframes slide-out {
                0% { transform: translateX(0) rotate(0); opacity: 1; }
                50% { transform: translateX(10px) rotate(10deg); opacity: 0.5; }
                100% { transform: translateX(0) rotate(0); opacity: 1; }
            }

            #logoutSuccessModal .modal-content {
                border: none;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                animation: modalFadeIn 0.3s ease forwards;
            }

            @keyframes modalFadeIn {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Remove existing modal if present
        const existingModal = document.getElementById('logoutSuccessModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal and show it
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('logoutSuccessModal'));
        modal.show();

        // Auto close after 4 seconds
        setTimeout(() => {
            modal.hide();
            setTimeout(() => {
                document.getElementById('logoutSuccessModal')?.remove();
                location.reload(); // Reload page after modal is hidden
            }, 150);
        }, 4000);
    }

    static showConnectionErrorModal() {
        const modalHtml = `
            <div class="modal fade" id="connectionErrorModal">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-body text-center p-4">
                            <div class="connection-error-animation mb-4">
                                <i class="fas fa-wifi"></i>
                                <i class="fas fa-exclamation-circle"></i>
                            </div>
                            <h4 style="color: #1c1c28;">Connection Error</h4>
                            <p class="text-muted mb-4">Unable to connect to the server. Please check your internet connection and try again.</p>
                            <button class="btn retry-btn" onclick="location.reload()">
                                <i class="fas fa-sync-alt me-2"></i>Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .connection-error-animation {
                position: relative;
                width: 100px;
                height: 100px;
                margin: 0 auto;
            }

            .connection-error-animation .fa-wifi {
                font-size: 50px;
                color: #e4074e;
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                animation: pulse 2s infinite;
            }

            .connection-error-animation .fa-exclamation-circle {
                position: absolute;
                right: 10px;
                top: 10px;
                font-size: 24px;
                color: #e4074e;
                background: white;
                border-radius: 50%;
                animation: bounce 1s infinite;
            }

            #connectionErrorModal .modal-content {
                border: none;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border-top: 4px solid #e4074e;
            }

            .retry-btn {
                background: #e4074e;
                color: white;
                padding: 12px 30px;
                border-radius: 25px;
                border: 2px solid #e4074e;
                transition: all 0.3s ease;
            }

            .retry-btn:hover {
                background: transparent;
                color: #e4074e;
                transform: translateY(-2px);
            }

            .retry-btn i {
                transition: transform 0.3s ease;
            }

            .retry-btn:hover i {
                transform: rotate(180deg);
            }

            @keyframes pulse {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
                100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }

            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
        `;
        document.head.appendChild(style);

        // Remove existing modal if present
        const existingModal = document.getElementById('connectionErrorModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('connectionErrorModal'));
        modal.show();

        // Remove modal when hidden
        document.getElementById('connectionErrorModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    static showRegistrationErrorModal(error) {
        const modalHtml = `
            <div class="modal fade" id="registrationErrorModal">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-body text-center p-4">
                            <div class="error-animation mb-4">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <h4 style="color: #1c1c28;">Registration Failed</h4>
                            <p class="text-muted mb-4">${error}</p>
                            <div class="d-grid gap-3">
                                <button class="btn retry-btn w-100" onclick="AuthUI.retryRegistration()">
                                    <i class="fas fa-redo me-2"></i>Try Again
                                </button>
                                <button class="btn btn-outline-secondary w-100" data-bs-dismiss="modal">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #registrationErrorModal .error-animation {
                color: #e4074e;
                font-size: 48px;
                animation: shake 0.5s ease-in-out;
            }

            #registrationErrorModal .retry-btn {
                background: #e4074e;
                color: white;
                transition: all 0.3s ease;
            }

            #registrationErrorModal .retry-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(228, 7, 78, 0.2);
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
        `;
        document.head.appendChild(style);

        // إزالة المودال السابق إذا وجد
        const existingModal = document.getElementById('registrationErrorModal');
        if (existingModal) existingModal.remove();

        // إضافة المودال الجديد
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('registrationErrorModal'));
        modal.show();
    }

    static retryRegistration() {
        // إغلاق مودال الخطأ
        const errorModal = bootstrap.Modal.getInstance(document.getElementById('registrationErrorModal'));
        errorModal.hide();

        // إعادة فتح مودال التسجيل
        setTimeout(() => {
            const signUpModal = new bootstrap.Modal(document.getElementById('signUpModal'));
            signUpModal.show();
        }, 500);
    }
}

// إضافة CSS للأنيميشن
const style = document.createElement('style');
style.textContent = `
    @keyframes modalFadeIn {
        from {
            transform: translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    #existingEmailModal .modal-content {
        border-radius: 15px;
        border-top: 4px solid #e4074e;
    }

    #existingEmailModal .btn:focus {
        box-shadow: 0 0 0 0.25rem rgba(228, 7, 78, 0.25);
    }

    .countdown-text {
        color: #666;
        font-size: 0.9rem;
    }

    .countdown-number {
        color: #e4074e;
        font-weight: 600;
        font-size: 1.1rem;
        min-width: 25px;
        text-align: center;
    }

    .resend-code-btn {
        background: none;
        border: none;
        color: #e4074e;
        font-weight: 500;
        padding: 8px 16px;
        border-radius: 20px;
        transition: all 0.3s ease;
        border: 1px solid #e4074e;
    }

    .resend-code-btn:hover {
        background: #e4074e;
        color: white;
        transform: translateY(-2px);
    }

    .resend-code-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }

    .resend-code-btn .spinner-border {
        width: 1rem;
        height: 1rem;
    }
`;
document.head.appendChild(style);

// Form Handler Class
class AuthFormHandler {
    constructor() {
        this.initializeEventListeners();
        this.initializePasswordToggles();
        this.verificationEmail = ''; // Store email for verification flow
    }

    initializeEventListeners() {
        // Real-time validation for all forms
        const forms = document.querySelectorAll('form.auth-form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.validateInput(input));
                input.addEventListener('blur', () => this.validateInput(input));
            });
        });

        // Form submissions
        // Login Form
        const loginForm = document.querySelector('#loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Register Form
        const registerForm = document.querySelector('#signUpForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
            const passwordInput = registerForm.querySelector('input[type="password"]');
            if (passwordInput) {
                passwordInput.addEventListener('input', this.handlePasswordValidation.bind(this));
            }
        }

        // Reset Password Form
        const resetForm = document.querySelector('#forgetPasswordForm');
        if (resetForm) {
            resetForm.addEventListener('submit', this.handleResetPassword.bind(this));
        }

        // Verification Form
        const verificationForm = document.querySelector('#verificationForm');
        if (verificationForm) {
            verificationForm.addEventListener('submit', this.handleVerification.bind(this));
            
            // Code inputs
            const codeInputs = verificationForm.querySelectorAll('.code-input');
            this.setupCodeInputs(codeInputs);
            
            // Resend button
            const resendButton = verificationForm.querySelector('.resend-code');
            if (resendButton) {
                resendButton.addEventListener('click', this.handleResendOTP.bind(this));
            }
        }

        // New Password Form
        const newPasswordForm = document.querySelector('#newPasswordForm');
        if (newPasswordForm) {
            newPasswordForm.addEventListener('submit', this.handleNewPassword.bind(this));
        }

        // Update logout button handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                AuthService.logout();
                AuthUI.showLogoutModal();
            });
        }
    }

    initializePasswordToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-password');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const input = e.currentTarget.parentNode.querySelector('input');
                const icon = e.currentTarget.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    setupCodeInputs(inputs) {
        inputs.forEach((input, index) => {
            input.addEventListener('keyup', (e) => {
                if (e.key >= 0 && e.key <= 9) {
                    if (index < inputs.length - 1) inputs[index + 1].focus();
                } else if (e.key === 'Backspace') {
                    if (index > 0) inputs[index - 1].focus();
                }
            });
        });
    }

    validateInput(input) {
        const { name, value } = input;
        let isValid = true;

        switch (name) {
            case 'username':
                if (!AuthValidator.validateUsername(value)) {
                    AuthUI.showError(input, 'Username must be at least 3 characters');
                    isValid = false;
                }
                break;

            case 'email':
                if (!AuthValidator.validateEmail(value)) {
                    AuthUI.showError(input, 'Please enter a valid email address');
                    isValid = false;
                }
                break;

            case 'password':
                const requirements = AuthValidator.validatePassword(value);
                if (!Object.values(requirements).every(Boolean)) {
                    AuthUI.showError(input, 'Password does not meet requirements');
                    isValid = false;
                }
                updatePasswordRequirements(requirements);
                break;

            case 'confirmPassword':
                const passwordInput = input.form.querySelector('[name="password"]');
                if (value !== passwordInput.value) {
                    AuthUI.showError(input, 'Passwords do not match');
                    isValid = false;
                }
                break;
        }

        if (isValid) {
            AuthUI.showSuccess(input);
        }

        return isValid;
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        
        if (!this.validateForm(form)) return;

        const button = form.querySelector('button[type="submit"]');
        const email = form.querySelector('[name="email"]').value;
        const password = form.querySelector('[name="password"]').value;
        const rememberMe = form.querySelector('[name="rememberMe"]')?.checked || false;

        try {
            if (!navigator.onLine) {
                throw new Error('OFFLINE');
            }

            AuthUI.showLoading(button);
            const result = await AuthService.login({ email, password, rememberMe });

            if (result.token) {
                $('#loginModal').modal('hide');
                AuthUI.showLoginSuccessModal();
                setTimeout(() => {
                    AuthUI.updateUIForAuthState();
                }, 4000);
            }
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.message === 'OFFLINE' || 
                error.message === 'Failed to fetch' || 
                error.name === 'TypeError') {
                AuthUI.showConnectionErrorModal();
            } else {
                AuthUI.showLoginErrorModal(this.getErrorMessage(error.message));
            }
        } finally {
            AuthUI.hideLoading(button);
        }
    }

    getErrorMessage(error) {
        const errorMessages = {
            'email_exists': 'This email address is already registered',
            'email_not_verified': 'Please verify your email address first',
            'invalid_credentials': 'Invalid email or password',
            'user_not_found': 'No account found with this email',
            'password_incorrect': 'The password you entered is incorrect',
            'server_error': 'Server error. Please try again later',
            'network_error': 'Unable to connect to the server. Please check your internet connection',
            'invalid_input': 'Please check your input and try again',
            'default': 'An error occurred. Please try again'
        };

        console.log('Error type:', error);
        return errorMessages[error] || errorMessages.default;
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        
        if (!this.validateForm(form)) return;

        const button = form.querySelector('button[type="submit"]');
        const userData = {
            username: form.querySelector('[name="username"]').value,
            email: form.querySelector('[name="email"]').value,
            password: form.querySelector('[name="password"]').value
        };

        try {
            AuthUI.showLoading(button);
            const result = await AuthService.register(userData);
            
            if (result.success) {
                $('#signUpModal').modal('hide');
                AuthUI.showToast('Account created successfully! Please verify your email.');
                AuthUI.showVerificationModal(userData.email, result.userId);
            }

        } catch (error) {
            if (error.message === 'EXISTING_EMAIL') {
                AuthUI.showExistingEmailModal(userData.email);
            } else {
                AuthUI.showRegistrationErrorModal(
                    error.message || 'Registration failed. Please try again.'
                );
            }
        } finally {
            AuthUI.hideLoading(button);
        }
    }

    async handleResetPassword(e) {
        e.preventDefault();
        const form = e.target;
        
        if (!this.validateForm(form)) return;

        const button = form.querySelector('button[type="submit"]');
        const email = form.querySelector('[name="email"]').value;

        if (!AuthValidator.validateEmail(email)) {
            AuthUI.showError(form.querySelector('[name="email"]'), 'Please enter a valid email');
            return;
        }

        try {
            AuthUI.showLoading(button);
            this.verificationEmail = email;
            await AuthService.resetPassword(email);
            await this.handleResendOTP();
            AuthUI.showToast('Reset instructions sent to your email');
            $('#forgetPasswordModal').modal('hide');
            $('#verificationModal').modal('show');
        } catch (error) {
            AuthUI.showToast(error.message, 'error');
        } finally {
            AuthUI.hideLoading(button);
        }
    }

    async handleResendOTP() {
        const email = localStorage.getItem('pendingVerificationEmail');
        if (!email) {
            AuthUI.showToast('Verification session expired. Please try again', 'error');
            return;
        }

        try {
            await AuthService.resendOTP(email);
            AuthUI.showToast('Verification code resent successfully');
            AuthUI.startCountdown();
        } catch (error) {
            console.error('Resend OTP error:', error);
            AuthUI.showToast(error.message || 'Failed to resend code', 'error');
        }
    }

    async handleVerification(e) {
        e.preventDefault();
        const form = e.target;
        const button = form.querySelector('button[type="submit"]');

        try {
            AuthUI.showLoading(button);
            
            const codeInputs = form.querySelectorAll('.code-input');
            const otp = Array.from(codeInputs).map(input => input.value).join('');

            if (otp.length !== 6) { // تم تغيير الطول إلى 6
                throw new Error('Please enter the complete verification code');
            }

            const email = localStorage.getItem('pendingVerificationEmail');
            if (!email) {
                throw new Error('Verification session expired');
            }

            // التحقق من صحة OTP
            const result = await AuthService.verifyOTP(email, otp);
            
            if (result.success) {
                // تنظيف البيانات المؤقتة
                localStorage.removeItem('pendingVerificationEmail');
                
                // إغلاق مودال التحقق وإظهار رسالة النجاح
                $('#verificationModal').modal('hide');
                AuthUI.showToast('Account created and verified successfully! Please login.', 'success');
                
                // فتح مودال تسجيل الدخول
                setTimeout(() => {
                    $('#loginModal').modal('show');
                }, 1500);
            }
            
        } catch (error) {
            console.error('Verification error:', error);
            AuthUI.showToast(error.message || 'Verification failed', 'error');
            
            // إعادة تعيين حقول الإدخال
            form.querySelectorAll('.code-input').forEach(input => input.value = '');
            form.querySelector('.code-input').focus();
        } finally {
            AuthUI.hideLoading(button);
        }
    }

    async handleNewPassword(e) {
        e.preventDefault();
        const form = e.target;
        if (!this.validateForm(form)) return;

        const button = form.querySelector('button[type="submit"]');
        const newPassword = form.querySelector('[name="newPassword"]').value;
        const confirmPassword = form.querySelector('[name="confirmPassword"]').value;

        if (newPassword !== confirmPassword) {
            AuthUI.showError(form.querySelector('[name="confirmPassword"]'), 'Passwords do not match');
            return;
        }

        try {
            AuthUI.showLoading(button);
            const token = localStorage.getItem('resetToken');
            await AuthService.updatePassword(this.verificationEmail, newPassword, token);
            AuthUI.showToast('Password updated successfully!');
            $('#newPasswordModal').modal('hide');
            $('#loginModal').modal('show');
        } catch (error) {
            AuthUI.showToast(error.message, 'error');
        } finally {
            AuthUI.hideLoading(button);
        }
    }

    validateRegistration(userData) {
        let isValid = true;
        const form = document.querySelector('#signUpForm');

        if (!AuthValidator.validateUsername(userData.username)) {
            AuthUI.showError(form.querySelector('[name="username"]'), 'Username must be at least 3 characters');
            isValid = false;
        }

        if (!AuthValidator.validateEmail(userData.email)) {
            AuthUI.showError(form.querySelector('[name="email"]'), 'Please enter a valid email');
            isValid = false;
        }

        const passwordValidation = AuthValidator.validatePassword(userData.password);
        if (!Object.values(passwordValidation).every(Boolean)) {
            AuthUI.showError(form.querySelector('[name="password"]'), 'Password does not meet requirements');
            isValid = false;
        }

        if (userData.password !== userData.confirmPassword) {
            AuthUI.showError(form.querySelector('[name="confirmPassword"]'), 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    }

    handlePasswordValidation(e) {
        const requirements = AuthValidator.validatePassword(e.target.value);
        const requirementsList = e.target.closest('.form-group').querySelector('.password-requirements');
        
        if (requirementsList) {
            Object.entries(requirements).forEach(([requirement, isMet]) => {
                const element = requirementsList.querySelector(`.requirement-${requirement}`);
                if (element) {
                    element.classList.toggle('met', isMet);
                    element.querySelector('i').className = `fas fa-${isMet ? 'check' : 'times'}`;
                }
            });
        }

        // Show/hide requirements list based on focus
        e.target.addEventListener('focus', () => {
            if (requirementsList) {
                requirementsList.style.display = 'block';
            }
        });

        e.target.addEventListener('blur', () => {
            if (requirementsList && Object.values(requirements).every(Boolean)) {
                requirementsList.style.display = 'none';
            }
        });

        return Object.values(requirements).every(Boolean);
    }
}

// Initialize auth forms
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing auth handler...');
        new AuthFormHandler();
        AuthUI.updateUIForAuthState();
        
        window.addEventListener('sessionExpired', () => {
            console.log('Session expired event triggered');
            AuthUI.showSessionExpiredAlert();
        });

        window.addEventListener('authStateChanged', () => {
            console.log('Auth state changed event triggered');
            AuthUI.updateUIForAuthState();
        });

    } catch (error) {
        console.error('Initialization error:', error);
        AuthUI.showToast('Failed to initialize authentication', 'error');
    }
});

function updatePasswordRequirements(requirements) {
    Object.entries(requirements).forEach(([requirement, isMet]) => {
        const element = document.querySelector(`.requirement-${requirement}`);
        if (element) {
            element.classList.toggle('met', isMet);
            element.querySelector('i').className = `fas fa-${isMet ? 'check' : 'times'}`;
        }
    });
}

// Add connection status listener
window.addEventListener('online', () => {
    AuthUI.showToast('Internet connection restored', 'success');
});

window.addEventListener('offline', () => {
    AuthUI.showToast('No internet connection', 'error');
});

