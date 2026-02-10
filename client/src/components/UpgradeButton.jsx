import React, { useState } from 'react';
import axios from 'axios';

const UpgradeButton = () => {
    const [loading, setLoading] = useState(false);

    const handleFakePayment = async () => {
        // 1. Start the "Fake" Processing
        setLoading(true);

        // 2. Simulate a 2-second delay (like a real bank)
        setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: { 'x-auth-token': token }
                };

                // 3. Call the backend to flip the switch
                const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://freelanceflow-oy9e.onrender.com';
                const res = await axios.post(
                    `${API_URL}/api/payment/fake-verify`,
                    {},
                    config
                );

                if (res.data.success) {
                    alert("🎉 Payment Successful! Welcome to Pro Plan.");
                    window.location.reload(); // Refresh to unlock features
                }

            } catch (err) {
                console.error(err);
                alert("Payment Failed. Try again.");
                setLoading(false);
            }
        }, 2000); // 2000ms = 2 seconds delay
    };

    return (
        <div className="p-4 border rounded-lg shadow-md bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-center">
            <h3 className="text-xl font-bold mb-2">Upgrade to Pro 🚀</h3>
            <p className="mb-4 text-sm opacity-90">Unlimited Clients & PDF Invoices for just ₹1/mo</p>

            <button
                onClick={handleFakePayment}
                disabled={loading}
                className={`px-6 py-2 rounded-full font-bold transition-all shadow-lg ${loading
                    ? "bg-gray-400 cursor-wait"
                    : "bg-white text-indigo-600 hover:bg-gray-100 hover:scale-105"
                    }`}
            >
                {loading ? (
                    <span className="flex items-center justify-center">
                        🔄 Processing...
                    </span>
                ) : (
                    "⚡ Upgrade Now (Demo)"
                )}
            </button>
        </div>
    );
};

export default UpgradeButton;