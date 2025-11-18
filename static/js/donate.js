// Donation Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeDonationPage();
});

function initializeDonationPage() {
    // Initialize amount selection
    initializeAmountSelection();
    
    // Initialize scroll animations
    initializeScrollAnimations();
    
    // Initialize purpose cards
    initializePurposeCards();
    
    // Generate QR code if needed
    generateQRCode();
}

// Amount Selection
function initializeAmountSelection() {
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountBtn = document.querySelector('.custom-amount-btn');
    const customAmountInput = document.getElementById('customAmountInput');
    const customAmountField = document.getElementById('customAmount');
    const selectedAmountDisplay = document.getElementById('selectedAmount');
    
    let selectedAmount = 0;
    
    // Handle preset amount buttons
    amountButtons.forEach(btn => {
        if (btn.dataset.amount !== 'custom') {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                amountButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                
                selectedAmount = parseInt(this.dataset.amount);
                updateSelectedAmount(selectedAmount);
                
                // Hide custom input if visible
                if (customAmountInput) {
                    customAmountInput.style.display = 'none';
                }
                if (customAmountField) {
                    customAmountField.value = '';
                }
            });
        }
    });
    
    // Handle custom amount button
    if (customAmountBtn) {
        customAmountBtn.addEventListener('click', function() {
            // Remove active class from all buttons
            amountButtons.forEach(b => b.classList.remove('active'));
            // Add active class to custom button
            this.classList.add('active');
            
            // Show custom input
            if (customAmountInput) {
                customAmountInput.style.display = 'block';
                customAmountField.focus();
            }
        });
    }
    
    // Handle custom amount input
    if (customAmountField) {
        customAmountField.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (value && value >= 100) {
                selectedAmount = value;
                updateSelectedAmount(selectedAmount);
            } else {
                selectedAmount = 0;
                updateSelectedAmount(selectedAmount);
            }
        });
    }
    
    function updateSelectedAmount(amount) {
        if (selectedAmountDisplay) {
            selectedAmountDisplay.textContent = `₹${amount.toLocaleString('en-IN')}`;
        }
    }
}

// Scroll Animations for Purpose Cards
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe purpose cards
    const purposeCards = document.querySelectorAll('.purpose-card');
    purposeCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Observe support cards
    const supportCards = document.querySelectorAll('.support-card');
    supportCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Purpose Cards Hover Effects
function initializePurposeCards() {
    const purposeCards = document.querySelectorAll('.purpose-card');
    
    purposeCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) rotate(1deg)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotate(0deg)';
        });
    });
}

// Generate QR Code (placeholder - you can integrate a QR code library)
function generateQRCode() {
    const qrPlaceholder = document.getElementById('qrPlaceholder');
    const qrCodeImage = document.getElementById('qrCodeImage');
    const upiId = document.getElementById('upiId')?.textContent || 'santbhagatram@paytm';
    
    // If you have a QR code library, generate it here
    // For now, we'll use a placeholder
    // Example: You can use a service like qr-server.com or a library like qrcode.js
    
    // Uncomment and configure when you have QR code generation:
    /*
    if (typeof QRCode !== 'undefined' && qrCodeImage) {
        QRCode.toDataURL(upiId, {
            width: 250,
            margin: 2,
            color: {
                dark: '#111827',
                light: '#ffffff'
            }
        }, function(err, url) {
            if (err) {
                console.error('QR Code generation error:', err);
                return;
            }
            qrCodeImage.src = url;
            if (qrPlaceholder) {
                qrPlaceholder.style.display = 'none';
            }
        });
    }
    */
}

// Copy UPI ID to Clipboard
function copyUPI() {
    const upiId = document.getElementById('upiId')?.textContent || 'santbhagatram@paytm';
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(upiId).then(() => {
            showCopyFeedback('UPI ID copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            fallbackCopy(upiId);
        });
    } else {
        fallbackCopy(upiId);
    }
}

// Fallback copy method
function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopyFeedback('UPI ID copied to clipboard!');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showCopyFeedback('Failed to copy. Please copy manually: ' + text);
    }
    
    document.body.removeChild(textArea);
}

// Copy Bank Detail
function copyBankDetail(type) {
    let text = '';
    
    switch(type) {
        case 'accountNumber':
            text = document.getElementById('accountNumber')?.textContent || '';
            break;
        case 'ifsc':
            text = document.getElementById('ifsc')?.textContent || '';
            break;
        default:
            return;
    }
    
    if (!text) return;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showCopyFeedback(`${type === 'accountNumber' ? 'Account Number' : 'IFSC Code'} copied!`);
        }).catch(err => {
            console.error('Failed to copy:', err);
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

// Show Copy Feedback
function showCopyFeedback(message) {
    // Create or update feedback element
    let feedback = document.getElementById('copyFeedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'copyFeedback';
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bubblegum-pink);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-weight: 600;
            animation: slideInRight 0.3s ease-out;
        `;
        document.body.appendChild(feedback);
    }
    
    feedback.textContent = message;
    feedback.style.display = 'block';
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    if (!document.getElementById('copyFeedbackStyle')) {
        style.id = 'copyFeedbackStyle';
        document.head.appendChild(style);
    }
    
    // Hide after 3 seconds
    setTimeout(() => {
        feedback.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 300);
    }, 3000);
}

// Initiate Payment
function initiatePayment() {
    const selectedAmount = document.getElementById('selectedAmount')?.textContent || '₹0';
    const amount = parseInt(selectedAmount.replace(/[₹,]/g, ''));
    
    if (!amount || amount < 100) {
        alert('Please select a donation amount (minimum ₹100)');
        return;
    }
    
    // Here you would integrate with your payment gateway
    // For example: Razorpay, Stripe, PayU, etc.
    
    // Example structure:
    /*
    const options = {
        key: 'YOUR_RAZORPAY_KEY',
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        name: 'Sant Bhagat Ram',
        description: 'Donation',
        handler: function(response) {
            // Handle successful payment
            console.log('Payment successful:', response);
            // Send payment details to your backend
        },
        prefill: {
            // Pre-fill user details if available
        },
        theme: {
            color: '#ff4d6d'
        }
    };
    
    const razorpay = new Razorpay(options);
    razorpay.open();
    */
    
    // For now, show a message
    alert(`Redirecting to secure payment gateway for ${selectedAmount}...\n\n(Integration with payment gateway required)`);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add ripple effect to amount buttons
document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

