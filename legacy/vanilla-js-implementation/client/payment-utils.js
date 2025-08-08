// payment-utils.js
// Defines utility functions for payment processing, primarily initializing the LiteAPI payment form.

/**
 * Initializes and handles the LiteAPI payment form.
 *
 * @param {string} clientSecret The secret key for the payment session.
 * @param {string} prebookId The prebook ID associated with the transaction.
 * @param {string} transactionId The transaction ID for tracking.
 * @param {string} guestFirstName The first name of the guest.
 * @param {string} guestLastName The last name of the guest.
 * @param {string} guestEmail The email address of the guest.
 * @param {string} targetElementSelector The CSS selector for the HTML element where the payment form will be rendered.
 * @param {string} environmentValue The environment for the API call ('sandbox' or 'production').
 */
function initializePaymentForm(clientSecret, prebookId, transactionId, guestFirstName, guestLastName, guestEmail, targetElementSelector, environmentValue) {
    const publicKey = environmentValue === "sandbox" ? "sandbox" : "live";

    console.log("Initializing Payment Form. Public Key:", publicKey, "Target:", targetElementSelector, "Env:", environmentValue);

    const config = {
        publicKey: publicKey,
        appearance: {
            theme: "flat",
        },
        options: {
            business: {
                name: "LiteAPI Hotel Booking",
            },
        },
        targetElement: targetElementSelector,
        secretKey: `${clientSecret}`,
        returnUrl: `http://localhost:3000/book?prebookId=${prebookId}&transactionId=${transactionId}&guestFirstName=${encodeURIComponent(guestFirstName)}&guestLastName=${encodeURIComponent(guestLastName)}&guestEmail=${encodeURIComponent(guestEmail)}&environment=${encodeURIComponent(environmentValue)}`,
    };

    try {
        if (typeof LiteAPIPayment === 'undefined') {
            console.error('LiteAPIPayment script not loaded or LiteAPIPayment is not defined.');
            const targetDiv = document.querySelector(targetElementSelector);
            if (targetDiv) {
                targetDiv.innerHTML = '<p style="color: red;">Error: Payment gateway could not be initialized. Please try again later.</p>';
            }
            return;
        }
        console.log('[PaymentUtils] LiteAPIPayment is defined. Config:', JSON.parse(JSON.stringify(config))); // Log config, avoid logging functions
        
        let paymentInstance;
        console.log('[PaymentUtils] Attempting: new LiteAPIPayment(config)');
        paymentInstance = new LiteAPIPayment(config);
        console.log('[PaymentUtils] Success: new LiteAPIPayment(config) created instance.');
        
        console.log('[PaymentUtils] Attempting: paymentInstance.handlePayment()');
        paymentInstance.handlePayment();
        console.log('[PaymentUtils] Success: paymentInstance.handlePayment() called. Awaiting redirect to returnUrl.');

    } catch (error) {
        console.error('Error initializing LiteAPIPayment or setting up event handlers:', error);
        const targetDiv = document.querySelector(targetElementSelector);
        if (targetDiv) {
            targetDiv.innerHTML = '<p style="color: red;">An unexpected error occurred while setting up the payment process. Please refresh and try again.</p>';
        }
    }
}
