import { useNavigate } from 'react-router-dom';

const UpgradeButton = () => {
    const navigate = useNavigate();

    return (
        <div className="p-6 border rounded-2xl shadow-xl bg-gradient-to-r from-orange-500 to-yellow-600 text-white text-center hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h3 className="text-2xl font-bold mb-2 relative z-10">Limit Reached 🚀</h3>
            <p className="mb-6 text-sm opacity-90 relative z-10 max-w-sm mx-auto">
                You've hit the limit of 2 clients on the Free plan. Upgrade to <b>Pro</b> for unlimited clients and PDF invoices.
            </p>

            <button
                onClick={() => navigate('/subscription')}
                className="px-8 py-3 rounded-xl font-bold transition-all shadow-lg bg-white text-orange-600 hover:bg-orange-50 hover:scale-105 active:scale-95 relative z-10"
            >
                ⚡ Upgrade Now
            </button>
        </div>
    );
};

export default UpgradeButton;