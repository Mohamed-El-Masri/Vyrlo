// Used to dynamically inject HTML content into specific elements of a webpage.
/**
 * This file contains JavaScript code for dynamically injecting HTML content into specific elements of a webpage.
 * 
 * The following sections are included:
 * - Header: Contains the navigation bar with links to Home, Explore, and Contact pages, as well as user account options.
 * - Footer: Currently empty and can be populated with footer content.
 * - Get Started: Currently empty and can be populated with content for a "Get Started" section.
 * 
 * The header includes:
 * - A brand logo.
 * - A collapsible navigation menu with links and dropdowns.
 * - User account options including login, add business, and user profile dropdown.
 * 
 * @file /E:/PWD - 9Months/Intake45-9Months/ITI 9 Months Labs/00000- FreeLance/YellowBages/Masry/js/main/component.js
 */

import { authService } from '../services/authService.js';
import { initScrollToTop } from '../utilities/scroll.js';

// #region Header
// Injects the header content into the element with the ID 'header'.
document.getElementById('header').innerHTML = `
<nav id="guestNav" class="navbar navbar-expand-lg navbar-custom masry-main-nav">
    <div class="container masry-nav-container">
        <!-- Logo with updated href -->
        <a class="navbar-brand masry-brand" href="../pages/home.html">
            <img src="../images/Logo.png" alt="logo" id="logo" class="masry-logo">
        </a>

        <!-- Toggler Button -->
        <button class="navbar-toggler collapsed masry-toggler" type="button" data-bs-toggle="collapse" 
                data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" 
                aria-expanded="false" aria-label="Toggle navigation">
            <span class="toggler-icon top-bar masry-toggler-bar"></span>
            <span class="toggler-icon middle-bar masry-toggler-bar"></span>
            <span class="toggler-icon bottom-bar masry-toggler-bar"></span>
        </button>

        <div class="collapse navbar-collapse justify-content-between masry-nav-collapse" id="navbarNavDropdown">
            <!-- Navigation Links -->
            <ul class="navbar-nav masry-nav-list">
                <li class="nav-item masry-nav-item">
                    <a class="nav-link masry-nav-link" href="../pages/home.html" id="homeLink">Home</a>
                </li>
                <li class="nav-item dropdown masry-nav-item">
                    <a class="nav-link dropdown-toggle masry-dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown"
                        aria-expanded="false" id="exploreLink">
                        Explore
                    </a>
                    <ul class="dropdown-menu masry-dropdown-menu">
                        <li>
                            <a class="dropdown-item masry-dropdown-item" href="#">
                                <img src="../images/categorey-icons/supermarket.png" alt="Shopping" class="small-icon">
                                <span>Shopping</span>
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item masry-dropdown-item" href="#">
                                <img src="../images/categorey-icons/dentist.png" alt="Restaurants" class="small-icon">
                                <span>Restaurants</span>
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item masry-dropdown-item" href="#">
                                <img src="../images/categorey-icons/health-insurance.png" alt="Health" class="small-icon">
                                <span>Health</span>
                            </a>
                        </li>
                        <!-- More items will be added dynamically from API -->
                    </ul>
                </li>
                <li class="nav-item masry-nav-item">
                    <a class="nav-link masry-nav-link" aria-current="page" href="../pages/contact.html" id="contactLink">Contact</a>
                </li>
            </ul>

            <!-- User Section -->
            <div class="d-lg-flex align-items-center dropdown masry-user-section">
                <!-- Guest Buttons (shown only to non-authenticated users) -->
                <div class="masry-header-buttons guest-only">
                    <button class="btn masry-login-btn" data-bs-toggle="modal" data-bs-target="#loginModal">
                        Log In
                    </button>
                    <a href="../pages/newAddListing.html" class="masry-add-business">
                        <i class="fa-solid fa-circle-plus masry-plus-icon"></i>
                        Add Your Business
                    </a>
                </div>

                <!-- User Dropdown (shown only to authenticated users) -->
                <div class="user-dropdown auth-only d-none">
                    <a class="dropdown-toggle user masry-user-dropdown" href="#" role="button" 
                       data-bs-toggle="dropdown" aria-expanded="false">
                        <img src="../images/user/user-1.png" alt="user image" class="user-image masry-user-image">
                        <span>Hello, </span><span id="user-name" class="masry-user-name">User</span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-user masry-user-menu">
                        <li>
                            <a class="dropdown-item masry-dropdown-item" href="../pages/profile.html">
                                My Account
                            </a>
                        </li>
                        <li id="businessLinkContainer">
                            <!-- Will be dynamically updated based on user's business status -->
                        </li>
                        <li>
                            <a class="dropdown-item masry-dropdown-item" href="#" id="logoutBtn">
                                Log Out
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</nav>
`;

// تحديث حالة المصادقة في الهيدر
const updateAuthUI = () => {
    const { isAuthenticated, user } = authService.getAuthData();
    
    // Guest elements (Login & Add Business buttons)
    document.querySelectorAll('.guest-only')
        .forEach(el => el.classList.toggle('d-none', isAuthenticated));
    
    // Auth elements (Avatar & dropdown)
    document.querySelectorAll('.auth-only')
        .forEach(el => el.classList.toggle('d-none', !isAuthenticated));

    if (isAuthenticated && user) {
        // تحديث معلومات المستخدم
        document.querySelectorAll('.masry-user-name')
            .forEach(el => el.textContent = user.username);

        document.querySelectorAll('.masry-user-image')
            .forEach(el => {
                el.src = user.profilePic?.[0] || '../images/user/user-1.png';
                el.alt = user.username;
            });

        // تحديث قائمة روابط المستخدم
        const businessLinkContainer = document.getElementById('businessLinkContainer');
        if (businessLinkContainer) {
            businessLinkContainer.innerHTML = `
                <a class="dropdown-item masry-dropdown-item" href="../pages/newAddListing.html">
                    <i class="fa-solid fa-plus"></i> Add Listing
                </a>
                ${user.numberOfProjects > 0 ? `
                <a class="dropdown-item masry-dropdown-item" href="../pages/myListings.html">
                    <i class="fa-solid fa-list"></i> My Listings
                </a>` : ''}
            `;
        }

        // إضافة معالج حدث تسجيل الخروج
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.removeEventListener('click', handleLogout); // إزالة المعالج القديم إن وجد
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
};

// دالة معالجة تسجيل الخروج
const handleLogout = async (e) => {
    e.preventDefault();
    try {
        await authService.logout();
        location.reload(); // إعادة تحميل الصفحة بعد تسجيل الخروج
    } catch (error) {
        console.error('Logout failed:', error);
    }
};

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    initScrollToTop();
    updateAuthUI();
    
    // Add logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.removeEventListener('click', handleLogout); // Remove old handler if exists
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Listen for auth state changes
document.addEventListener('authStateChanged', updateAuthUI);

// بعد إضافة محتوى Header مباشرة
document.addEventListener('DOMContentLoaded', () => {
    // Dispatch event after header content is loaded
    const event = new CustomEvent('componentLoaded');
    document.dispatchEvent(event);
    console.log('Component: Header loaded, dispatched componentLoaded event');
});

//#endregion




//#region Footer
document.getElementById('footer').innerHTML = `
    <footer class="masry-footer">
        <div class="masry-footer__container container">
            <div class="masry-footer__brand">
                <a href="../pages/home.html">
                    <img src="../images/logo.png" alt="Logo" class="masry-footer__logo">
                </a>
                <p class="masry-footer__description">Your trusted directory for local businesses and services. Find, connect, and grow with our community.</p>
                <ul class="masry-footer__social">
                    <li><a href="#" class="masry-footer__social-link"><i class="fa-brands fa-facebook-f"></i></a></li>
                    <li><a href="#" class="masry-footer__social-link"><i class="fa-brands fa-twitter"></i></a></li>
                    <li><a href="#" class="masry-footer__social-link"><i class="fa-brands fa-instagram"></i></a></li>
                    <li><a href="#" class="masry-footer__social-link"><i class="fa-brands fa-linkedin-in"></i></a></li>
                </ul>
            </div>

            <div class="masry-footer__section">
                <h2 class="masry-footer__title">Useful Links</h2>
                <div class="masry-footer__links">
                    <a href="#" class="masry-footer__link">About Us</a>
                    <a href="#" class="masry-footer__link">Home Page</a>
                    <a href="#" class="masry-footer__link">Contact</a>
                    <a href="#" class="masry-footer__link">Add Your Business</a>
                    <a href="#" class="masry-footer__link">Login</a>
                    <a href="#" class="masry-footer__link">Terms & Conditions</a>
                    <a href="#" class="masry-footer__link">Privacy Policy</a>
                    <a href="#" class="masry-footer__link">Help Center</a>
                </div>
            </div>

            <div class="masry-footer__section">
                <h2 class="masry-footer__title">Categories</h2>
                <div class="masry-footer__categories">
                    <a href="#" class="masry-footer__link">Shopping</a>
                    <a href="#" class="masry-footer__link">Travel</a>
                    <a href="#" class="masry-footer__link">Adventures</a>
                    <a href="#" class="masry-footer__link">Real Estate</a>
                    <a href="#" class="masry-footer__link">Restaurants</a>
                    <a href="#" class="masry-footer__link">Health</a>
                    <a href="#" class="masry-footer__link">Education</a>
                    <a href="#" class="masry-footer__link">Services</a>
                    <a href="#" class="masry-footer__link">Entertainment</a>
                    <a href="#" class="masry-footer__link">Automotive</a>
                    <a href="#" class="masry-footer__link">Professional</a>
                    <a href="#" class="masry-footer__link">More</a>
                </div>
            </div>
        </div>
        <div class="masry-footer__scroll-top">
            <a href="#" class="masry-footer__scroll-link">
                <i class="fa-solid fa-arrow-up"></i>
            </a> 
        </div>
        <hr class="masry-footer__divider">
        <p class="masry-footer__copyright">© 2024 VYRLO - Designed By <a href="#" class="masry-footer__credit">ByteCamp</a> - All Rights Reserved</p>
    </footer>
`;

// Initialize scroll-to-top functionality after footer is rendered
initScrollToTop();
//#endregion


//#region Get Started

document.getElementById('getStarted').innerHTML = `
<!-- Login Modal -->
<div class="modal fade" id="loginModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <button class="modal-close" data-bs-dismiss="modal">×</button>
            <form class="auth-form" id="loginForm" novalidate>
                <h2 class="auth-title">Welcome Back</h2>
                <div class="form-group">
                    <input type="email" class="form-control" name="email" required
                           placeholder="Email Address">
                    <i class="fa-solid fa-envelope input-icon"></i>
                    <div class="invalid-feedback">Please enter a valid email address</div>
                </div>
                <div class="form-group">
                    <div class="password-input-group">
                        <input type="password" class="form-control" name="password" required
                               placeholder="Password" minlength="8">
                        <i class="fa-solid fa-lock input-icon"></i>
                        <button type="button" class="toggle-password">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="invalid-feedback">Please enter your password</div>
                </div>
                <div class="form-check mb-3">
                    <input type="checkbox" class="form-check-input" id="rememberMe" name="rememberMe">
                    <label class="form-check-label" for="rememberMe">Remember me</label>
                </div>
                <button type="submit" class="auth-submit w-100">Sign In</button>
                <div class="auth-links">
                    <a href="#" class="auth-switch-link" data-bs-toggle="modal" data-bs-target="#signUpModal" data-bs-dismiss="modal">
                        Create New Account
                    </a>
                    <br>
                    <a href="#" class="auth-switch-link" data-bs-toggle="modal" data-bs-target="#forgetPasswordModal" data-bs-dismiss="modal">
                        Forgot Password?
                    </a>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Sign Up Modal -->
<div class="modal fade" id="signUpModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <button class="modal-close" data-bs-dismiss="modal">×</button>
            <form class="auth-form" id="signUpForm" novalidate>
                <h2 class="auth-title">Create Account</h2>
                <div class="form-group">
                    <input type="text" class="form-control" name="username" required
                           placeholder="Username" minlength="3">
                    <i class="fa-solid fa-user input-icon"></i>
                    <div class="invalid-feedback">Username must be at least 3 characters</div>
                </div>
                <div class="form-group">
                    <input type="email" class="form-control" name="email" required
                           placeholder="Email">
                    <i class="fa-solid fa-envelope input-icon"></i>
                    <div class="invalid-feedback">Please enter a valid email address</div>
                </div>
                <div class="form-group">
                    <div class="password-input-group">
                        <input type="password" class="form-control" name="password" required
                               placeholder="Password" minlength="8">
                        <i class="fa-solid fa-lock input-icon"></i>
                        <button type="button" class="toggle-password">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="password-requirements">
                        <div class="requirement requirement-length">
                            <i class="fas fa-times"></i>
                            <span>At least 8 characters</span>
                        </div>
                        <div class="requirement requirement-uppercase">
                            <i class="fas fa-times"></i>
                            <span>One uppercase letter</span>
                        </div>
                        <div class="requirement requirement-lowercase">
                            <i class="fas fa-times"></i>
                            <span>One lowercase letter</span>
                        </div>
                        <div class="requirement requirement-number">
                            <i class="fas fa-times"></i>
                            <span>One number</span>
                        </div>
                        <div class="requirement requirement-special">
                            <i class="fas fa-times"></i>
                            <span>One special character (!@#$%^&*)</span>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="password-input-group">
                        <input type="password" class="form-control" name="confirmPassword" required
                               placeholder="Confirm Password">
                        <i class="fa-solid fa-lock input-icon"></i>
                        <button type="button" class="toggle-password">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="invalid-feedback">Passwords do not match</div>
                </div>
                <button type="submit" class="auth-submit w-100">Sign Up</button>
                <div class="auth-links">
                    <a href="#" class="auth-switch-link" data-bs-toggle="modal" data-bs-target="#loginModal" data-bs-dismiss="modal">
                        Already have an account? Sign In
                    </a>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Forget Password Modal -->
<div class="modal fade" id="forgetPasswordModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <button class="modal-close" data-bs-dismiss="modal">×</button>
            <form class="auth-form" id="forgetPasswordForm" novalidate>
                <h2 class="auth-title">Reset Password</h2>
                <div class="form-group">
                    <input type="email" class="form-control" name="email" required
                           placeholder="Enter your email">
                    <i class="fa-solid fa-envelope input-icon"></i>
                    <div class="invalid-feedback">Please enter a valid email address</div>
                </div>
                <button type="submit" class="auth-submit w-100">Send Reset Link</button>
                <div class="auth-links">
                    <a href="#" class="auth-switch-link" data-bs-toggle="modal" data-bs-target="#loginModal" data-bs-dismiss="modal">
                        Back to Sign In
                    </a>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Verification Code Modal -->
<div class="modal fade" id="verificationModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <button class="modal-close" data-bs-dismiss="modal">×</button>
            <form class="auth-form">
                <h2 class="auth-title">Verify Your Email</h2>
                <p class="text-center text-muted">Enter the verification code sent to your email</p>
                
                <div class="verification-code-container mb-4">
                    <input type="text" class="code-input" maxlength="1" pattern="[0-9]" autofocus>
                    <input type="text" class="code-input" maxlength="1" pattern="[0-9]">
                    <input type="text" class="code-input" maxlength="1" pattern="[0-9]">
                    <input type="text" class="code-input" maxlength="1" pattern="[0-9]">
                    <input type="text" class="code-input" maxlength="1" pattern="[0-9]">
                    <input type="text" class="code-input" maxlength="1" pattern="[0-9]">
                </div>
                
                <div class="resend-timer">
                    <span class="timer">Resend code in 60 seconds</span>
                </div>

                <button type="submit" class="auth-submit w-100">Verify Code</button>
            </form>
        </div>
    </div>
</div>

<!-- New Password Modal -->
<div class="modal fade" id="newPasswordModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <button class="modal-close" data-bs-dismiss="modal">×</button>
            <form class="auth-form">
                <h2 class="auth-title">Create New Password</h2>
                
                <div class="form-group">
                    <input type="password" class="form-control" placeholder="New Password">
                    <i class="fa-solid fa-lock input-icon"></i>
                </div>
                
                <div class="password-requirements">
                    <div class="requirement requirement-length">
                        <i class="fas fa-times"></i>
                        <span>At least 8 characters</span>
                    </div>
                    <div class="requirement requirement-uppercase">
                        <i class="fas fa-times"></i>
                        <span>One uppercase letter</span>
                    </div>
                    <div class="requirement requirement-lowercase">
                        <i class="fas fa-times"></i>
                        <span>One lowercase letter</span>
                    </div>
                    <div class="requirement requirement-number">
                        <i class="fas fa-times"></i>
                        <span>One number</span>
                    </div>
                    <div class="requirement requirement-special">
                        <i class="fas fa-times"></i>
                        <span>One special character</span>
                    </div>
                </div>

                <div class="form-group">
                    <input type="password" class="form-control" placeholder="Confirm New Password">
                    <i class="fa-solid fa-lock input-icon"></i>
                </div>

                <button type="submit" class="auth-submit w-100">Update Password</button>
            </form>
        </div>
    </div>
</div>

<!-- Toast Container -->
<div class="toast-container"></div>
`;

//#endregion

// إضافة دالة لتحديد الصفحة النشطة
function setActiveLink() {
    // الحصول على اسم الصفحة الحالية من URL
    const currentPage = window.location.pathname.split('/').pop();
    
    // إزالة الكلاس النشط من جميع الروابط
    document.querySelectorAll('.masry-nav-link').forEach(link => {
        link.classList.remove('masry-header-active');
    });

    // إضافة الكلاس للرابط النشط
    switch(currentPage) {
        case 'home.html':
            document.getElementById('homeLink')?.classList.add('masry-header-active');
            break;
        case 'contact.html':
            document.getElementById('contactLink')?.classList.add('masry-header-active');
            break;
        // يمكن إضافة المزيد من الحالات هنا
    }

    // التعامل مع Explore إذا كنا في صفحة allListings.html
    if (currentPage === 'allListings.html') {
        document.getElementById('exploreLink')?.classList.add('masry-header-active');
    }
}

// إضافة معالج DOMContentLoaded لتنفيذ الدالة
document.addEventListener('DOMContentLoaded', () => {
    setActiveLink();
    // ...existing DOMContentLoaded handlers...
});

// export class Component {
//     // ...existing code...

//     initializeLogoutHandler() {
//         console.log('Component: Initializing logout handler');
//         const logoutBtn = document.getElementById('logoutBtn');
//         if (logoutBtn) {
//             // إزالة معالجات الأحداث القديمة لتجنب التكرار
//             logoutBtn.replaceWith(logoutBtn.cloneNode(true));
//             const newLogoutBtn = document.getElementById('logoutBtn');
            
//             newLogoutBtn.addEventListener('click', async (e) => {
//                 e.preventDefault();
//                 console.log('Component: Logout button clicked');
//                 // ترك معالجة الحدث لـ AuthUI
//                 return;
//             });
//         }
//     }

//     // ...existing code...
// }