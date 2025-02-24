export class AuthService {
    constructor() {
        this.baseUrl = 'https://virlo.vercel.app';
        this.tokenKey = 'auth_token';
        this.userKey = 'user_data';
        this.endpoints = {
            signin: '/signin',
            signup: '/signup',
            resetPassword: '/reset-password'
        };
    }

    async login({ email, password }) {
        try {
            const response = await fetch(`${this.baseUrl}/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.status === 404 || response.status === 500) {
                throw new Error('invalid_credentials');
            }

            if (response.status === 201 && data.token) {
                // تخزين التوكن
                this.setToken(data.token);
                
                // استخراج بيانات المستخدم من التوكن
                const tokenData = this.parseJwt(data.token);
                
                // تخزين بيانات المستخدم
                const userData = {
                    userId: tokenData.userId || data._id,
                    username: tokenData.name || data.username,
                    email: tokenData.email || data.email,
                    profileImage: data.profileImage
                };
                
                this.setUserData(userData);
                
                // جلب معلومات البروفايل إذا كان هناك userId
                if (userData.userId) {
                    try {
                        const profileData = await this.fetchUserProfile(userData.userId);
                        if (profileData) {
                            this.setUserData({ ...userData, ...profileData });
                        }
                    } catch (profileError) {
                        console.warn('Could not fetch profile:', profileError);
                    }
                }

                return { success: true, data: userData };
            }

            throw new Error(data.message || 'login_failed');
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(this.mapErrorMessage(error.message));
        }
    }

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('JWT parse error:', error);
            return {};
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseUrl}${this.endpoints.signup}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.status === 201) {
                return { success: true, message: data.message };
            } else if (response.status === 409) {
                throw new Error('User already registered');
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async requestPasswordReset(email) {
        try {
            const response = await fetch(`${this.baseUrl}/forgetpass/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            return { success: true, message: data.message };
        } catch (error) {
            console.error('Password reset request error:', error);
            throw error;
        }
    }

    async verifyResetCode(email, otp, newPassword) {
        try {
            const response = await fetch(`${this.baseUrl}${this.endpoints.resetPassword}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    otp,
                    newPassword
                })
            });

            const data = await response.json();
            return { success: true, message: data.message };
        } catch (error) {
            console.error('Reset verification error:', error);
            throw error;
        }
    }

    async changePassword(oldPassword, newPassword) {
        try {
            const response = await fetch(`${this.baseUrl}/change-pass`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword
                })
            });

            const data = await response.json();
            
            if (response.status === 403) {
                throw new Error('Incorrect old password');
            }
            
            return { success: true, message: data.message };
        } catch (error) {
            console.error('Password change error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            console.log('AuthService: Starting logout process');
            this.clearAuthData();
            console.log('AuthService: Auth data cleared');
            
            // إطلاق الأحداث لتحديث الواجهة
            window.dispatchEvent(new CustomEvent('authStateChanged'));
            window.dispatchEvent(new CustomEvent('userLoggedOut'));
            
            console.log('AuthService: Logout events dispatched');
            return { success: true };
        } catch (error) {
            console.error('AuthService: Logout error:', error);
            throw error;
        }
    }

    async fetchUserProfile(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch profile');

            const [profileData] = await response.json();
            return {
                numberOfProjects: profileData?.numberOfProjects || 0,
                profilePic: profileData?.profilePic || [],
                socialAccounts: profileData?.socialAccounts || [],
                title: profileData?.title,
                about: profileData?.about,
                phoneNumber: profileData?.phoneNumber,
                address: profileData?.address,
                city: profileData?.city,
                state: profileData?.state,
                zipCode: profileData?.zipCode
            };
        } catch (error) {
            console.error('Profile fetch error:', error);
            return null;
        }
    }

    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setUserData(userData) {
        localStorage.setItem(this.userKey, JSON.stringify(userData));
    }

    getUserData() {
        try {
            const userStr = localStorage.getItem(this.userKey);
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    getAuthData() {
        const token = this.getToken();
        const user = this.getUserData();
        return {
            token,
            user,
            isAuthenticated: !!token
        };
    }

    clearAuthData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.userKey);
    }

    triggerAuthStateChange() {
        window.dispatchEvent(new CustomEvent('authStateChanged'));
    }

    _handleError(error) {
        if (!navigator.onLine) return new Error('OFFLINE');
        if (error.message === 'Failed to fetch') return new Error('CONNECTION_ERROR');

        const errorMap = {
            'email_exists': 'This email is already registered',
            'invalid_credentials': 'Invalid email or password',
            'user_not_found': 'Account not found'
        };

        return new Error(errorMap[error.message] || error.message);
    }

    mapErrorMessage(error) {
        const errorMap = {
            'invalid_credentials': 'Invalid email or password',
            'server_error': 'Server error. Please try again later',
            'login_failed': 'Login failed. Please try again',
            'Failed to fetch': 'Connection error. Please check your internet'
        };

        return errorMap[error] || 'An unexpected error occurred';
    }

    isAuthenticated() {
        return !!this.getToken();
    }
}

export const authService = new AuthService();
