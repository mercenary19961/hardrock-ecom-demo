import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;

/**
 * Clear all accessible cookies for the current domain
 * This helps resolve stale cookie issues that cause 419 errors
 */
function clearAllCookies() {
    const cookies = document.cookie.split(';');
    const domain = window.location.hostname;
    const paths = ['/', ''];

    for (const cookie of cookies) {
        const cookieName = cookie.split('=')[0].trim();
        // Clear cookie for various path combinations
        for (const path of paths) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
            // Also try with leading dot for subdomains
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=.${domain};`;
        }
    }
}

// Expose globally so inline onclick can use it
(window as typeof window & { clearCookiesAndReload: () => void }).clearCookiesAndReload = function() {
    clearAllCookies();
    window.location.reload();
};

/**
 * Graceful 419 (CSRF Token Mismatch) Error Handler
 *
 * After a deployment, the browser may hold a stale XSRF-TOKEN cookie while the
 * server has rotated its session/CSRF secrets. This causes a 419 on the first
 * POST (e.g. login). Rather than forcing the user to manually clear cookies,
 * we auto-recover:
 *   1st 419 → clear stale cookies and reload (gets fresh cookies from server)
 *   2nd 419 within 30s → show a manual-action modal (something else is wrong)
 */
const CSRF_AUTO_RECOVER_KEY = 'csrf_auto_recover_ts';

function showSessionExpiredModal() {
    const modal = document.createElement('div');
    modal.id = 'session-expired-modal';
    modal.innerHTML = `
        <div style="
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
        ">
            <div style="
                background: white;
                padding: 24px;
                border-radius: 12px;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            ">
                <div style="
                    width: 48px;
                    height: 48px;
                    background: #FEF3C7;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                ">
                    <svg width="24" height="24" fill="none" stroke="#D97706" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;">
                    Session Expired
                </h3>
                <p style="margin: 0 0 20px; color: #6B7280; font-size: 14px;">
                    Your session has expired for security reasons. Click below to clear cookies and refresh.
                </p>
                <button
                    onclick="window.clearCookiesAndReload()"
                    style="
                        background: #7C3AED;
                        color: white;
                        border: none;
                        padding: 10px 24px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background 0.2s;
                    "
                    onmouseover="this.style.background='#6D28D9'"
                    onmouseout="this.style.background='#7C3AED'"
                >
                    Refresh Page
                </button>
            </div>
        </div>
    `;

    // Remove any existing modal first
    const existingModal = document.getElementById('session-expired-modal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.appendChild(modal);
}

axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 419) {
            const lastRecover = sessionStorage.getItem(CSRF_AUTO_RECOVER_KEY);
            const now = Date.now();

            // If we already auto-recovered within the last 30 seconds, something
            // else is wrong — show the manual modal instead of looping.
            if (lastRecover && now - Number(lastRecover) < 30_000) {
                showSessionExpiredModal();
                return new Promise(() => {}); // Never resolves
            }

            // First attempt: auto-recover by clearing stale cookies and reloading.
            // The full page reload will fetch fresh XSRF-TOKEN + session cookies
            // from the server middleware.
            sessionStorage.setItem(CSRF_AUTO_RECOVER_KEY, String(now));
            clearAllCookies();
            window.location.reload();
            return new Promise(() => {}); // Never resolves
        }
        return Promise.reject(error);
    }
);

/**
 * Auto-refresh CSRF token every 30 minutes
 * This prevents 419 errors while actively working.
 *
 * We hit `/sanctum/csrf-cookie` (sets the XSRF-TOKEN cookie) or fall back to
 * a lightweight HEAD request to the current page, which also refreshes the
 * cookie via Laravel's VerifyCsrfToken / AddQueuedCookiesToResponse middleware.
 */
const CSRF_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

function refreshCsrfToken() {
    axios.get('/sanctum/csrf-cookie').catch(() => {
        // Sanctum route may not be available — fall back to a HEAD request
        // which still triggers the middleware that sets XSRF-TOKEN.
        axios.head(window.location.pathname).catch(() => {});
    });
}

// Start the auto-refresh interval
setInterval(refreshCsrfToken, CSRF_REFRESH_INTERVAL);

// Also refresh when user returns to a tab that may have been idle during a deploy
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        refreshCsrfToken();
    }
});
