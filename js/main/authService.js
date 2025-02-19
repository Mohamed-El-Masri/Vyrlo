class AuthService {
    static API_BASE = 'https://virlo.vercel.app';
    static TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
    static SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

    static async makeRequest(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            },
            mode: 'cors'
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const url = `${this.API_BASE}${endpoint}`;
            console.log('Making request to:', url);
            
            const response = await fetch(url, finalOptions);
            console.log('Response:', response);

            if (!response.ok) {
                const error = await response.json().catch(() => ({
                    message: `HTTP error! status: ${response.status}`
                }));
                throw new Error(error.message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', {
                endpoint,
                error: error.message,
                status: error.status
            });
            throw error;
        }
    }

    static parseJwt(token) {
        try {
            return jwt_decode(token);
        } catch (error) {
            console.error('JWT Parse Error:', error);
            return null;
        }
    }

    static async login({ email, password, rememberMe = false }) {
        try {
            const response = await fetch(`${this.API_BASE}/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (data.token) {
                const decodedToken = this.parseJwt(data.token);
                console.log('Decoded token:', decodedToken);

                // Use data from token if profile is not available
                const userData = {
                    email: decodedToken.email,
                    _id: decodedToken.userId,
                    username: decodedToken.name || email.split('@')[0], // Use name from token or fallback
                    profileImage: null // Default will be handled by UI
                };

                const expiryTime = rememberMe ? 
                    Date.now() + (30 * 24 * 60 * 60 * 1000) : 
                    Date.now() + this.TOKEN_EXPIRY;

                this.setAuthData(data.token, userData, expiryTime);

                // Try to get additional profile data
                try {
                    const profileData = await this.getUserProfile(decodedToken.userId);
                    if (profileData && profileData.length > 0) {
                        // Update with profile data if available
                        const updatedUserData = {
                            ...userData,
                            username: profileData[0].userId.username || userData.username,
                            profileImage: profileData[0].profilePic?.[0],
                            title: profileData[0].title,
                            about: profileData[0].about,
                            phoneNumber: profileData[0].phoneNumber,
                            address: profileData[0].address,
                            city: profileData[0].city,
                            state: profileData[0].state,
                            socialAccounts: profileData[0].socialAccounts
                        };
                        this.updateUserData(updatedUserData);
                    }
                } catch (profileError) {
                    console.warn('Could not fetch profile data:', profileError);
                    // Continue with basic user data
                }

                // Trigger UI update
                window.dispatchEvent(new CustomEvent('authStateChanged'));
                return data;
            }
            throw new Error('No token received');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static setAuthData(token, user, expiryTime) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tokenExpiry', expiryTime.toString());
    }

    static getAuthData() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const expiry = parseInt(localStorage.getItem('tokenExpiry') || '0');
        return { token, user, expiry };
    }

    static isAuthenticated() {
        const { token, expiry } = this.getAuthData();
        return token && expiry && Date.now() < expiry;
    }

    static startSessionCheck() {
        setInterval(() => {
            if (!this.isAuthenticated()) {
                this.handleSessionExpired();
            }
        }, this.SESSION_CHECK_INTERVAL);
    }

    static handleSessionExpired() {
        this.logout();
        // Dispatch custom event for session expiry
        window.dispatchEvent(new CustomEvent('sessionExpired'));
    }

    static async register(userData) {
        try {
            console.log('Starting registration process for:', userData.email);
            
            // 1. إنشاء الحساب أولاً
            const registerResponse = await fetch(`${this.API_BASE}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    isVerified: false // علامة تشير إلى أن الحساب غير مفعل
                })
            });

            const registerData = await registerResponse.json();
            
            if (!registerResponse.ok) {
                if (registerResponse.status === 409) {
                    throw new Error('EXISTING_EMAIL');
                }
                throw new Error(registerData.message || 'Registration failed');
            }

            // 2. إرسال OTP للتحقق
            const otpResponse = await fetch(`${this.API_BASE}/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userData.email,
                    userId: registerData.userId // إرسال ID المستخدم الجديد
                })
            });

            if (!otpResponse.ok) {
                throw new Error('Failed to send verification code');
            }

            // 3. حفظ بيانات التحقق مؤقتاً
            localStorage.setItem('pendingVerification', JSON.stringify({
                email: userData.email,
                userId: registerData.userId
            }));

            return {
                success: true,
                message: 'Account created successfully. Please verify your email.',
                userId: registerData.userId
            };

        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    static async verifyEmail(userId, otp) {
        try {
            const response = await fetch(`${this.API_BASE}/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, otp })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Verification failed');
            }

            // تنظيف البيانات المؤقتة
            localStorage.removeItem('pendingVerification');

            return {
                success: true,
                message: 'Email verified successfully'
            };

        } catch (error) {
            console.error('Verification error:', error);
            throw error;
        }
    }

    static async resetPassword(email) {
        try {
            const response = await fetch(`${this.API_BASE}/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data;
        } catch (error) {
            throw new Error(error.message || 'Password reset failed');
        }
    }

    static async sendOTP(email) {
        try {
            console.log('Sending OTP to:', email);
            
            const response = await fetch(`${this.API_BASE}/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            console.log('OTP response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send verification code');
            }

            return {
                success: true,
                message: 'Verification code sent successfully'
            };

        } catch (error) {
            console.error('OTP send error:', error);
            throw new Error('Failed to send verification code. Please try again');
        }
    }

    static async resendOTP(email) {
        try {
            console.log('Resending OTP for:', email);
            
            const lastSentTime = localStorage.getItem('lastOTPSentTime');
            const now = Date.now();
            
            if (lastSentTime && (now - parseInt(lastSentTime)) < 30000) {
                throw new Error('Please wait before requesting a new code');
            }

            const response = await fetch(`${this.API_BASE}/send-otp`, { // تم تغيير المسار
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email,
                    type: 'resend' // إضافة نوع العملية
                })
            });

            const data = await response.json();
            console.log('Resend OTP Response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend code');
            }

            localStorage.setItem('lastOTPSentTime', now.toString());

            return {
                success: true,
                message: 'Verification code resent successfully'
            };

        } catch (error) {
            console.error('Resend OTP error:', {
                message: error.message,
                stack: error.stack,
                email: email
            });
            throw error;
        }
    }

    static async updatePassword(email, password, token) {
        try {
            const response = await fetch(`${this.API_BASE}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return data;
        } catch (error) {
            throw new Error(error.message || 'Password update failed');
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
        window.dispatchEvent(new CustomEvent('authStateChanged'));
    }

    static async getUserProfile(specificUserId = null) {
        try {
            // Get stored auth data
            const { token, user } = this.getAuthData();
            if (!token) throw new Error('Not authenticated');

            // Use provided ID or get from stored user data
            const userId = specificUserId || user?._id;
            console.log('Getting profile for user:', { userId, token });

            if (!userId) {
                console.error('No user ID available');
                throw new Error('User ID not found');
            }

            // Make API request
            const response = await fetch(`${this.API_BASE}/profile/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Profile response status:', response.status);

            // Handle response
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Profile error response:', errorData);
                throw new Error(`Failed to fetch profile: ${response.status}`);
            }

            const data = await response.json();
            console.log('Profile data received:', data);
            return data;

        } catch (error) {
            console.error('Profile fetch error:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    static updateUserData(userData) {
        const { token, expiry } = this.getAuthData();
        this.setAuthData(token, userData, expiry);
        window.dispatchEvent(new CustomEvent('userDataChanged', { detail: userData }));
    }

    static async refreshUserData() {
        if (!this.isAuthenticated()) {
            console.log('User not authenticated, skipping refresh');
            return;
        }

        try {
            const { user } = this.getAuthData();
            if (!user?._id) {
                console.error('No user ID in stored data');
                return;
            }
            console.log('Refreshing user data for:', user._id);
            const profileData = await this.getUserProfile(user._id);
            if (profileData && profileData.length > 0) {
                const userData = {
                    ...user,
                    username: profileData[0].userId.username,
                    profileImage: profileData[0].profilePic?.[0],
                    title: profileData[0].title,
                    about: profileData[0].about,
                    phoneNumber: profileData[0].phoneNumber,
                    address: profileData[0].address,
                    city: profileData[0].city,
                    state: profileData[0].state,
                    socialAccounts: profileData[0].socialAccounts
                };
                this.updateUserData(userData);
                this.updateUIElements(userData);
            }
        } catch (error) {
            console.error('Data refresh error:', error);
            if (error.message.includes('Not authenticated')) {
                this.handleSessionExpired();
            }
        }
    }

    static updateUIElements(userData) {
        if (!userData) {
            console.warn('No user data provided for UI update');
            return;
        }

        try {
            console.log('Updating UI with user data:', userData);
            
            // Update username display
            document.querySelectorAll('.masry-user-name').forEach(el => {
                const displayName = userData.username || userData.name || userData.email.split('@')[0];
                el.textContent = displayName;
                console.log('Updated username element with:', displayName);
            });

            // Update user image
            document.querySelectorAll('.masry-user-image').forEach(el => {
                el.src = userData.profileImage || '../images/user/user-1.png';
                el.alt = userData.username || 'User Profile';
            });

            // ...rest of UI updates...
        } catch (error) {
            console.error('UI update error:', error);
        }
    }

    static async checkEmailExists(email) {
        try {
            const response = await fetch(`${this.API_BASE}/check-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            // إذا كان الرد 409 فهذا يعني أن البريد موجود بالفعل
            if (response.status === 409) {
                return true;
            }

            // إذا كان الرد 404 فهذا يعني أن البريد غير موجود
            if (response.status === 404) {
                return false;
            }

            // في حالة حدوث خطأ في السيرفر
            if (!response.ok) {
                throw new Error(data.message || 'Server error');
            }

            return data.exists;
        } catch (error) {
            console.error('Check email error:', error);
            // في حالة وجود مشكلة في الاتصال، نفترض أن البريد غير موجود
            return false;
        }
    }
}

// Add auto refresh on page load
document.addEventListener('DOMContentLoaded', () => {
    AuthService.refreshUserData();
    
    // Refresh every 5 minutes
    setInterval(() => {
        AuthService.refreshUserData();
    }, 5 * 60 * 1000);
});
