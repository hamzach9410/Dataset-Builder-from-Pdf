// Simple CSRF protection
class CSRFProtection {
    constructor() {
        this.token = this.generateToken();
    }
    
    generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    
    getToken() {
        return this.token;
    }
    
    addTokenToFormData(formData) {
        formData.append('csrf_token', this.token);
        return formData;
    }
    
    addTokenToHeaders(headers = {}) {
        headers['X-CSRF-Token'] = this.token;
        return headers;
    }
}

// Global CSRF instance
window.csrfProtection = new CSRFProtection();